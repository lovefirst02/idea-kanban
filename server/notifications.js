const fs = require('fs');
const path = require('path');

const NOTIFICATIONS_PATH = '/home/hao0x0/.openclaw/workspace-project-manager/memory/notifications.jsonl';

// Ensure directory exists
function ensureDir() {
  const dir = path.dirname(NOTIFICATIONS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Append notification to file
function addNotification(notification) {
  ensureDir();
  
  const entry = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    read: false,
    ...notification
  };
  
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(NOTIFICATIONS_PATH, line, 'utf-8');
  
  console.log(`Notification added: ${entry.action} - ${entry.ideaId}`);
  return entry;
}

// Read all notifications
function getAllNotifications() {
  ensureDir();
  
  if (!fs.existsSync(NOTIFICATIONS_PATH)) {
    return [];
  }
  
  const content = fs.readFileSync(NOTIFICATIONS_PATH, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  
  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (e) {
      return null;
    }
  }).filter(Boolean);
}

// Get unread notifications
function getUnreadNotifications() {
  return getAllNotifications().filter(n => !n.read);
}

// Get a single notification by ID
function getNotificationById(id) {
  return getAllNotifications().find(n => n.id === id) || null;
}

// Mark notifications as read
function markAsRead(ids) {
  const notifications = getAllNotifications();
  const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
  
  let updated = 0;
  const updatedNotifications = notifications.map(n => {
    if (idSet.has(n.id) || ids === 'all') {
      if (!n.read) {
        updated++;
        return { ...n, read: true };
      }
    }
    return n;
  });
  
  // Rewrite file
  const content = updatedNotifications.map(n => JSON.stringify(n)).join('\n') + '\n';
  fs.writeFileSync(NOTIFICATIONS_PATH, content, 'utf-8');
  
  return updated;
}

// Clean old notifications (keep last N days)
function cleanOldNotifications(daysToKeep = 7) {
  const notifications = getAllNotifications();
  const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  const filtered = notifications.filter(n => {
    const ts = new Date(n.timestamp).getTime();
    return ts > cutoff;
  });
  
  const removed = notifications.length - filtered.length;
  
  if (removed > 0) {
    const content = filtered.map(n => JSON.stringify(n)).join('\n') + '\n';
    fs.writeFileSync(NOTIFICATIONS_PATH, content, 'utf-8');
  }
  
  return removed;
}

// Create notification for different actions
function notifyCreate(idea) {
  return addNotification({
    action: 'create',
    ideaId: idea.id,
    ideaName: idea.name,
    priority: idea.priority,
    status: idea.status
  });
}

function notifyUpdate(idea) {
  return addNotification({
    action: 'update',
    ideaId: idea.id,
    ideaName: idea.name,
    priority: idea.priority,
    status: idea.status
  });
}

function notifyDelete(idea) {
  return addNotification({
    action: 'delete',
    ideaId: idea.id,
    ideaName: idea.name
  });
}

function notifyStatusChange(idea, oldStatus, newStatus) {
  return addNotification({
    action: 'status_change',
    ideaId: idea.id,
    ideaName: idea.name,
    from: oldStatus,
    to: newStatus,
    priority: idea.priority
  });
}

module.exports = {
  addNotification,
  getAllNotifications,
  getUnreadNotifications,
  getNotificationById,
  markAsRead,
  cleanOldNotifications,
  notifyCreate,
  notifyUpdate,
  notifyDelete,
  notifyStatusChange,
  NOTIFICATIONS_PATH
};
