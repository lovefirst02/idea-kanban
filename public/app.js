// State
let ideas = [];
let editingId = null;
let draggedCard = null;

// DOM Elements
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const ideaForm = document.getElementById('idea-form');
const btnNew = document.getElementById('btn-new');
const btnClose = document.getElementById('btn-close');
const btnCancel = document.getElementById('btn-cancel');
const btnDelete = document.getElementById('btn-delete');
const searchInput = document.getElementById('search');
const filterPriority = document.getElementById('filter-priority');

// Status column mapping
const statusColumns = {
  '📝 待審核': 'col-pending',
  '✅ 已批准': 'col-approved',
  '🚧 開發中': 'col-inprogress',
  '✅ 已完成': 'col-done'
};

// API functions
async function fetchIdeas() {
  try {
    const res = await fetch('/api/ideas');
    const data = await res.json();
    if (data.success) {
      ideas = data.data;
      renderBoard();
    }
  } catch (error) {
    showToast('載入失敗: ' + error.message, 'error');
  }
}

async function createIdea(idea) {
  try {
    const res = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(idea)
    });
    const data = await res.json();
    if (data.success) {
      showToast('點子已建立！', 'success');
      fetchIdeas();
    }
  } catch (error) {
    showToast('建立失敗: ' + error.message, 'error');
  }
}

async function updateIdea(id, updates) {
  try {
    const res = await fetch(`/api/ideas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (data.success) {
      showToast('點子已更新！', 'success');
      fetchIdeas();
    }
  } catch (error) {
    showToast('更新失敗: ' + error.message, 'error');
  }
}

async function updateStatus(id, status) {
  try {
    const res = await fetch(`/api/ideas/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      fetchIdeas();
    }
  } catch (error) {
    showToast('狀態更新失敗: ' + error.message, 'error');
  }
}

async function deleteIdea(id) {
  if (!confirm('確定要刪除這個點子嗎？')) return;
  
  try {
    const res = await fetch(`/api/ideas/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      showToast('點子已刪除', 'success');
      closeModal();
      fetchIdeas();
    }
  } catch (error) {
    showToast('刪除失敗: ' + error.message, 'error');
  }
}

// Render functions
function renderBoard() {
  // Clear all columns
  Object.values(statusColumns).forEach(colId => {
    document.getElementById(colId).innerHTML = '';
  });
  
  // Filter ideas
  const searchTerm = searchInput.value.toLowerCase();
  const priorityFilter = filterPriority.value;
  
  const filtered = ideas.filter(idea => {
    const matchSearch = !searchTerm || 
      idea.name.toLowerCase().includes(searchTerm) ||
      idea.id.toLowerCase().includes(searchTerm) ||
      (idea.description && idea.description.toLowerCase().includes(searchTerm));
    
    const matchPriority = !priorityFilter || idea.priority === priorityFilter;
    
    return matchSearch && matchPriority;
  });
  
  // Count per column
  const counts = {};
  Object.keys(statusColumns).forEach(s => counts[s] = 0);
  
  // Render cards
  filtered.forEach(idea => {
    const status = normalizeStatus(idea.status);
    const colId = statusColumns[status];
    if (!colId) return;
    
    counts[status]++;
    
    const card = createCard(idea);
    document.getElementById(colId).appendChild(card);
  });
  
  // Update counts
  document.querySelectorAll('.kanban-column').forEach(col => {
    const status = col.dataset.status;
    const count = counts[status] || 0;
    col.querySelector('.column-count').textContent = count;
  });
}

function normalizeStatus(status) {
  // Handle variations
  if (status.includes('待審核')) return '📝 待審核';
  if (status.includes('已批准') && !status.includes('完成')) return '✅ 已批准';
  if (status.includes('開發中') || status.includes('進行中')) return '🚧 開發中';
  if (status.includes('完成')) return '✅ 已完成';
  return '📝 待審核';
}

function createCard(idea) {
  const card = document.createElement('div');
  card.className = 'idea-card';
  card.dataset.id = idea.id;
  card.draggable = true;
  
  const priorityClass = `priority-${idea.priority.toLowerCase()}`;
  const priorityEmoji = idea.priority === 'High' ? '🔴' : idea.priority === 'Medium' ? '🟡' : '🟢';
  
  card.innerHTML = `
    <div class="card-header">
      <span class="card-id">${idea.id}</span>
      <span class="card-priority ${priorityClass}">${priorityEmoji} ${idea.priority}</span>
    </div>
    <div class="card-name">${escapeHtml(idea.name)}</div>
    ${idea.assignee ? `
      <div class="card-meta">
        <span class="card-assignee">👤 ${escapeHtml(idea.assignee)}</span>
      </div>
    ` : ''}
    ${idea.progress > 0 ? `
      <div class="card-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${idea.progress}%"></div>
        </div>
        <span class="progress-text">${idea.progress}%</span>
      </div>
    ` : ''}
    ${idea.github ? `
      <div class="card-github">
        <a href="${escapeHtml(idea.github)}" target="_blank">🔗 GitHub</a>
      </div>
    ` : ''}
  `;
  
  // Click to edit
  card.addEventListener('click', () => openEditModal(idea));
  
  // Drag events
  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragend', handleDragEnd);
  
  return card;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Modal functions
function openNewModal() {
  editingId = null;
  modalTitle.textContent = '新增點子';
  ideaForm.reset();
  btnDelete.classList.add('hidden');
  modal.classList.remove('hidden');
  document.getElementById('name').focus();
}

function openEditModal(idea) {
  editingId = idea.id;
  modalTitle.textContent = '編輯點子';
  
  document.getElementById('name').value = idea.name || '';
  document.getElementById('status').value = normalizeStatus(idea.status);
  document.getElementById('priority').value = idea.priority || 'Medium';
  document.getElementById('assignee').value = idea.assignee || '';
  document.getElementById('progress').value = idea.progress || 0;
  document.getElementById('github').value = idea.github || '';
  document.getElementById('description').value = idea.description || '';
  
  btnDelete.classList.remove('hidden');
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
  editingId = null;
  ideaForm.reset();
}

// Form submission
ideaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(ideaForm);
  const idea = {
    name: formData.get('name'),
    status: formData.get('status'),
    priority: formData.get('priority'),
    assignee: formData.get('assignee'),
    progress: parseInt(formData.get('progress')) || 0,
    github: formData.get('github'),
    description: formData.get('description')
  };
  
  if (editingId) {
    await updateIdea(editingId, idea);
  } else {
    await createIdea(idea);
  }
  
  closeModal();
});

// Drag and drop
function handleDragStart(e) {
  draggedCard = e.target;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', e.target.dataset.id);
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  draggedCard = null;
  
  document.querySelectorAll('.column-cards').forEach(col => {
    col.classList.remove('drag-over');
  });
}

// Setup drop zones
document.querySelectorAll('.column-cards').forEach(column => {
  column.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    column.classList.add('drag-over');
  });
  
  column.addEventListener('dragleave', (e) => {
    column.classList.remove('drag-over');
  });
  
  column.addEventListener('drop', (e) => {
    e.preventDefault();
    column.classList.remove('drag-over');
    
    const id = e.dataTransfer.getData('text/plain');
    const status = column.closest('.kanban-column').dataset.status;
    
    if (id && status) {
      updateStatus(id, status);
    }
  });
});

// Event listeners
btnNew.addEventListener('click', openNewModal);
btnClose.addEventListener('click', closeModal);
btnCancel.addEventListener('click', closeModal);
btnDelete.addEventListener('click', () => editingId && deleteIdea(editingId));

searchInput.addEventListener('input', renderBoard);
filterPriority.addEventListener('change', renderBoard);

// Close modal on outside click
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Keyboard shortcuts (moved to settings section)

// Toast notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// SSE for live updates
function setupSSE() {
  const evtSource = new EventSource('/api/events');
  
  evtSource.addEventListener('refresh', () => {
    fetchIdeas();
  });
  
  evtSource.onerror = () => {
    evtSource.close();
    setTimeout(setupSSE, 5000);
  };
}

// ===== Settings =====
const settingsModal = document.getElementById('settings-modal');
const settingsForm = document.getElementById('settings-form');
const btnSettings = document.getElementById('btn-settings');
const btnSettingsClose = document.getElementById('btn-settings-close');
const btnSettingsCancel = document.getElementById('btn-settings-cancel');
const webhookUrlInput = document.getElementById('webhook-url');
const webhookStatus = document.getElementById('webhook-status');

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success) {
      if (data.data.webhookConfigured) {
        webhookStatus.className = 'webhook-status configured';
        webhookStatus.textContent = '✅ Webhook 已設定: ' + data.data.webhookUrl;
      } else {
        webhookStatus.className = 'webhook-status not-configured';
        webhookStatus.textContent = '⚠️ Webhook 未設定';
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

function openSettingsModal() {
  loadSettings();
  webhookUrlInput.value = '';
  settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
  settingsModal.classList.add('hidden');
}

settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const webhookUrl = webhookUrlInput.value.trim();
  
  try {
    const res = await fetch('/api/settings/webhook', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl })
    });
    const data = await res.json();
    
    if (data.success) {
      showToast(data.message, 'success');
      closeSettingsModal();
    } else {
      showToast('設定失敗: ' + data.error, 'error');
    }
  } catch (error) {
    showToast('設定失敗: ' + error.message, 'error');
  }
});

btnSettings.addEventListener('click', openSettingsModal);
btnSettingsClose.addEventListener('click', closeSettingsModal);
btnSettingsCancel.addEventListener('click', closeSettingsModal);

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeSettingsModal();
});

// Update keyboard handler to close settings modal too
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeSettingsModal();
  }
  if (e.key === 'n' && e.ctrlKey) {
    e.preventDefault();
    openNewModal();
  }
});

// ===== Notify PM Button =====
const btnNotifyPM = document.getElementById('btn-notify-pm');

async function notifyPM() {
  const btn = btnNotifyPM;
  const originalText = btn.textContent;
  
  // Disable button
  btn.disabled = true;
  btn.textContent = '發送中...';
  
  try {
    const res = await fetch('/api/notify-pm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    
    if (data.success) {
      btn.textContent = '✅ 已通知';
      btn.classList.add('success');
      showToast(data.message, 'success');
      
      // Re-enable after 3 seconds
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('success');
        btn.disabled = false;
      }, 3000);
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    btn.textContent = originalText;
    btn.disabled = false;
    showToast('通知失敗: ' + error.message, 'error');
  }
}

btnNotifyPM.addEventListener('click', notifyPM);

// Initialize
fetchIdeas();
setupSSE();
