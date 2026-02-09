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

// Send Discord notification
async function sendNotification(type, idea, extra = {}) {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    console.log('Webhook not configured, skipping notification');
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
      console.error('Webhook error:', response.status, await response.text());
      return false;
    }

    console.log(`Notification sent: ${type} - ${idea.id}`);
    return true;
  } catch (error) {
    console.error('Webhook error:', error.message);
    return false;
  }
}

module.exports = {
  getWebhookUrl,
  setWebhookUrl,
  sendNotification,
  loadConfig,
  saveConfig
};
