const express = require('express');
const router = express.Router();
const md = require('./markdown');
const webhook = require('./webhook');
const notifications = require('./notifications');

// GET /api/ideas - Get all ideas
router.get('/ideas', (req, res) => {
  try {
    const ideas = md.getAllIdeas();
    res.json({ success: true, data: ideas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/ideas/:id - Get single idea
router.get('/ideas/:id', (req, res) => {
  try {
    const idea = md.getIdea(req.params.id);
    if (!idea) {
      return res.status(404).json({ success: false, error: 'Idea not found' });
    }
    res.json({ success: true, data: idea });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ideas - Create new idea
router.post('/ideas', async (req, res) => {
  try {
    const idea = md.createIdea(req.body);
    
    // Send webhook notification
    await webhook.sendNotification('create', idea);
    
    // Write to notifications.jsonl for OpenClaw
    notifications.notifyCreate(idea);
    
    res.status(201).json({ success: true, data: idea });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/ideas/:id - Update idea
router.put('/ideas/:id', async (req, res) => {
  try {
    const oldIdea = md.getIdea(req.params.id);
    const idea = md.updateIdea(req.params.id, req.body);
    if (!idea) {
      return res.status(404).json({ success: false, error: 'Idea not found' });
    }
    
    // Check if status changed
    if (oldIdea && oldIdea.status !== idea.status) {
      await webhook.sendNotification('status', idea, {
        oldStatus: oldIdea.status,
        newStatus: idea.status
      });
      // Write to notifications.jsonl for OpenClaw
      notifications.notifyStatusChange(idea, oldIdea.status, idea.status);
    } else {
      await webhook.sendNotification('update', idea);
      // Write to notifications.jsonl for OpenClaw
      notifications.notifyUpdate(idea);
    }
    
    res.json({ success: true, data: idea });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/ideas/:id/status - Quick status update
router.patch('/ideas/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }
    
    const oldIdea = md.getIdea(req.params.id);
    const idea = md.updateStatus(req.params.id, status);
    if (!idea) {
      return res.status(404).json({ success: false, error: 'Idea not found' });
    }
    
    // Send status change notification
    if (oldIdea) {
      await webhook.sendNotification('status', idea, {
        oldStatus: oldIdea.status,
        newStatus: status
      });
      // Write to notifications.jsonl for OpenClaw
      notifications.notifyStatusChange(idea, oldIdea.status, status);
    }
    
    res.json({ success: true, data: idea });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/ideas/:id - Delete idea
router.delete('/ideas/:id', async (req, res) => {
  try {
    const idea = md.getIdea(req.params.id);
    const deleted = md.deleteIdea(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Idea not found' });
    }
    
    // Send delete notification
    if (idea) {
      await webhook.sendNotification('delete', idea);
      // Write to notifications.jsonl for OpenClaw
      notifications.notifyDelete(idea);
    }
    
    res.json({ success: true, message: 'Idea deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== Notifications API (for OpenClaw) =====

// GET /api/notifications - Get all notifications
router.get('/notifications', (req, res) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const data = unreadOnly 
      ? notifications.getUnreadNotifications()
      : notifications.getAllNotifications();
    
    res.json({ success: true, data, count: data.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/notifications/mark-read - Mark notifications as read
router.patch('/notifications/mark-read', (req, res) => {
  try {
    const { ids } = req.body; // array of ids or 'all'
    if (!ids) {
      return res.status(400).json({ success: false, error: 'ids is required (array or "all")' });
    }
    
    const updated = notifications.markAsRead(ids);
    res.json({ success: true, message: `${updated} notification(s) marked as read` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/notifications/cleanup - Clean old notifications
router.delete('/notifications/cleanup', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const removed = notifications.cleanOldNotifications(days);
    res.json({ success: true, message: `${removed} old notification(s) removed` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== Settings API =====

// GET /api/settings - Get settings
router.get('/settings', (req, res) => {
  try {
    const webhookUrl = webhook.getWebhookUrl();
    res.json({ 
      success: true, 
      data: { 
        webhookUrl: webhookUrl ? '••••••' + webhookUrl.slice(-20) : '',
        webhookConfigured: !!webhookUrl
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/settings/webhook - Update webhook URL
router.put('/settings/webhook', async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    webhook.setWebhookUrl(webhookUrl || '');
    
    // Test the webhook if URL provided
    if (webhookUrl) {
      const testResult = await testWebhook(webhookUrl);
      res.json({ 
        success: true, 
        message: testResult ? 'Webhook 設定成功！測試通知已發送。' : 'Webhook 已儲存，但測試發送失敗。'
      });
    } else {
      res.json({ success: true, message: 'Webhook 已清除。' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test webhook
async function testWebhook(url) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '✅ Webhook 測試成功！',
          description: 'Idea Kanban 看板已成功連接到此頻道。',
          color: 0x9ece6a,
          footer: {
            text: `Idea Kanban • ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC`
          }
        }]
      })
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}

// ===== Notify PM API =====

// POST /api/notify-pm - Manually notify PM Agent
router.post('/notify-pm', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const message = `【看板通知】用戶手動請求
操作：用戶點擊「通知 PM」按鈕
請求：請 PM Agent 檢查看板狀態
時間：${timestamp}`;

    // Send Discord webhook
    await webhook.sendDiscordNotification('manual', { 
      id: 'MANUAL', 
      name: '用戶請求 PM Agent 檢查看板',
      priority: 'High',
      status: '📢 手動通知'
    });

    // Send OpenClaw wake event
    await webhook.notifyOpenClaw(message);

    // Write to notifications.jsonl
    notifications.addNotification({
      action: 'manual_notify',
      ideaId: 'MANUAL',
      ideaName: '用戶請求 PM Agent 檢查看板',
      message: '用戶點擊「通知 PM」按鈕'
    });

    res.json({ success: true, message: '已發送通知，PM Agent 會盡快回應' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
