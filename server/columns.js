/**
 * Kanban Columns Configuration
 * Status definitions for the kanban board
 */

const COLUMNS = [
  { id: 'backlog', title: '📋 Backlog', color: '#6b7280', order: 0 },
  { id: 'pending', title: '📝 待審核', color: '#eab308', order: 1 },
  { id: 'approved', title: '✅ 已批准', color: '#22c55e', order: 2 },
  { id: 'in-progress', title: '🚧 開發中', color: '#3b82f6', order: 3 },
  { id: 'testing', title: '🧪 測試中', color: '#a855f7', order: 4 },
  { id: 'done', title: '✅ 已完成', color: '#10b981', order: 5 }
];

// Map old status names to new IDs
const STATUS_MAP = {
  '📝 待審核': 'pending',
  '✅ 已批准': 'approved',
  '🚧 開發中': 'in-progress',
  '✅ 已完成': 'done',
  '📋 Backlog': 'backlog',
  '🧪 測試中': 'testing'
};

// Get column by ID
function getColumnById(id) {
  return COLUMNS.find(c => c.id === id);
}

// Get column by title (for backward compatibility)
function getColumnByTitle(title) {
  return COLUMNS.find(c => c.title === title);
}

// Normalize status (convert old format to new)
function normalizeStatus(status) {
  if (STATUS_MAP[status]) {
    return STATUS_MAP[status];
  }
  // Check if already a valid ID
  if (COLUMNS.some(c => c.id === status)) {
    return status;
  }
  // Default to backlog
  return 'backlog';
}

module.exports = {
  COLUMNS,
  STATUS_MAP,
  getColumnById,
  getColumnByTitle,
  normalizeStatus
};
