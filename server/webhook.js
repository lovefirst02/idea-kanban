const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../config.json');

// Load config
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Error loading config:', e.message);
  }
  return { webhookUrl: '' };
}

// Save config
function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// Get webhook URL (env var takes priority)
function getWebhookUrl() {
  return process.env.DISCORD_WEBHOOK_URL || loadConfig().webhookUrl || '';
}

// Set webhook URL
function setWebhookUrl(url) {
  const config = loadConfig();
  config.webhookUrl = url;
  saveConfig(config);
}

// Format timestamp
function formatTime() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

// ===== OpenClaw Gateway Integration =====

// Send wake event to OpenClaw Gateway
async function notifyOpenClaw(message) {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:4444';
  const token = process.env.OPENCLAW_GATEWAY_TOKEN;
  
  if (!token) {
    console.log('OpenClaw token not configured, skipping wake event');
    return false;
  }
  
  try {
    const response = await fetch(`${gatewayUrl}/hooks/wake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text: message,
        mode: 'now'
      })
    });
    
    if (!response.ok) {
      console.error('OpenClaw wake error:', response.status);
      return false;
    }
    
    console.log('OpenClaw wake event sent');
    return true;
  } catch (error) {
    console.error('OpenClaw wake error:', error.message);
    return false;
  }
}

// Generate wake message for different actions
function generateWakeMessage(type, idea, extra = {}) {
  const time = formatTime();
  
  switch (type) {
    case 'create':
      return `【看板通知】新點子建立\n點子: ${idea.id} - ${idea.name}\n優先級: ${idea.priority || 'Medium'}\n時間: ${time}`;
    
    case 'update':
      return `【看板通知】點子已更新\n點子: ${idea.id} - ${idea.name}\n時間: ${time}`;
    
    case 'delete':
      return `【看板通知】點子已刪除\n點子: ${idea.id} - ${idea.name}\n時間: ${time}`;
    
    case 'status':
      return `【看板通知】狀態變更\n點子: ${idea.id} - ${idea.name}\n變更: ${extra.oldStatus} → ${extra.newStatus}\n時間: ${time}`;
    
    default:
      return `【看板通知】${idea.id} - ${idea.name}`;
  }
}

// ===== Discord Webhook =====

// Send Discord notification
async function sendDiscordNotification(type, idea, extra = {}) {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    console.log('Discord webhook not configured, skipping');
    return false;
  }

  let title, description, color;

  switch (type) {
    case 'create':
      title = '📝 新點子建立';
      description = `**${idea.id}** ${idea.name}`;
      color = 0x9ece6a; // green
      break;
    
    case 'update':
      title = '✏️ 點子已更新';
      description = `**${idea.id}** ${idea.name}`;
      color = 0x7aa2f7; // blue
      break;
    
    case 'delete':
      title = '🗑️ 點子已刪除';
      description = `**${idea.id}** ${idea.name}`;
      color = 0xf7768e; // red
      break;
    
    case 'status':
      title = '🔄 狀態變更';
      description = `**${idea.id}** ${idea.name}\n${extra.oldStatus} → ${extra.newStatus}`;
      color = 0xe0af68; // yellow
      break;
    
    default:
      return false;
  }

  const embed = {
    title: `【看板更新】${title}`,
    description,
    color,
    fields: [
      {
        name: '優先級',
        value: idea.priority || 'Medium',
        inline: true
      }
    ],
    footer: {
      text: `Idea Kanban • ${formatTime()}`
    }
  };

  // Add assignee if exists
  if (idea.assignee) {
    embed.fields.push({
      name: '負責 Agent',
      value: idea.assignee,
      inline: true
    });
  }

  // Add status for non-status-change events
  if (type !== 'status' && idea.status) {
    embed.fields.push({
      name: '狀態',
      value: idea.status,
      inline: true
    });
  }

  // Add GitHub link if exists
  if (idea.github) {
    embed.fields.push({
      name: 'GitHub',
      value: `[連結](${idea.github})`,
      inline: true
    });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

    if (!response.ok) {
      console.error('Discord webhook error:', response.status, await response.text());
      return false;
    }

    console.log(`Discord notification sent: ${type} - ${idea.id}`);
    return true;
  } catch (error) {
    console.error('Discord webhook error:', error.message);
    return false;
  }
}

// ===== Combined Notification =====

// Send notification to both Discord and OpenClaw
async function sendNotification(type, idea, extra = {}) {
  // Send Discord webhook (non-blocking)
  sendDiscordNotification(type, idea, extra).catch(console.error);
  
  // Send OpenClaw wake event
  const wakeMessage = generateWakeMessage(type, idea, extra);
  await notifyOpenClaw(wakeMessage);
  
  return true;
}

module.exports = {
  getWebhookUrl,
  setWebhookUrl,
  sendNotification,
  sendDiscordNotification,
  notifyOpenClaw,
  loadConfig,
  saveConfig
};
