// State
let ideas = [];
let sprints = [];
let editingId = null;
let editingSprintId = null;
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
const filterSprint = document.getElementById('filter-sprint');

// Sprint elements
const sprintSidebar = document.getElementById('sprint-sidebar');
const btnSprint = document.getElementById('btn-sprint');
const btnCloseSidebar = document.getElementById('btn-close-sidebar');
const btnNewSprint = document.getElementById('btn-new-sprint');
const sprintList = document.getElementById('sprint-list');
const sprintModal = document.getElementById('sprint-modal');
const sprintForm = document.getElementById('sprint-form');
const sprintModalTitle = document.getElementById('sprint-modal-title');
const btnSprintClose = document.getElementById('btn-sprint-close');
const btnSprintCancel = document.getElementById('btn-sprint-cancel');
const btnSprintDelete = document.getElementById('btn-sprint-delete');

// Status column mapping (new IDs)
const statusColumns = {
  'backlog': 'col-backlog',
  'pending': 'col-pending',
  'approved': 'col-approved',
  'in-progress': 'col-inprogress',
  'testing': 'col-testing',
  'done': 'col-done'
};

// Old status to new ID mapping
const statusMap = {
  '📝 待審核': 'pending',
  '✅ 已批准': 'approved',
  '🚧 開發中': 'in-progress',
  '✅ 已完成': 'done',
  '📋 Backlog': 'backlog',
  '🧪 測試中': 'testing'
};

// ===== API functions =====

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

async function fetchSprints() {
  try {
    const res = await fetch('/api/sprints');
    const data = await res.json();
    if (data.success) {
      sprints = data.data;
      renderSprintList();
      updateSprintFilter();
    }
  } catch (error) {
    console.error('Failed to load sprints:', error);
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

// ===== Sprint API =====

async function createSprint(sprint) {
  try {
    const res = await fetch('/api/sprints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sprint)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Sprint 已建立！', 'success');
      fetchSprints();
      return data.data;
    }
  } catch (error) {
    showToast('建立失敗: ' + error.message, 'error');
  }
}

async function updateSprint(id, updates) {
  try {
    const res = await fetch(`/api/sprints/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Sprint 已更新！', 'success');
      fetchSprints();
    }
  } catch (error) {
    showToast('更新失敗: ' + error.message, 'error');
  }
}

async function deleteSprint(id) {
  if (!confirm('確定要刪除這個 Sprint 嗎？')) return;
  
  try {
    const res = await fetch(`/api/sprints/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      showToast('Sprint 已刪除', 'success');
      closeSprintModal();
      fetchSprints();
    }
  } catch (error) {
    showToast('刪除失敗: ' + error.message, 'error');
  }
}

// ===== Render functions =====

function renderBoard() {
  // Clear all columns
  Object.values(statusColumns).forEach(colId => {
    const col = document.getElementById(colId);
    if (col) col.innerHTML = '';
  });
  
  // Filter ideas
  const searchTerm = searchInput.value.toLowerCase();
  const priorityFilter = filterPriority.value;
  const sprintFilter = filterSprint.value;
  
  const filtered = ideas.filter(idea => {
    const matchSearch = !searchTerm || 
      idea.name.toLowerCase().includes(searchTerm) ||
      idea.id.toLowerCase().includes(searchTerm) ||
      (idea.description && idea.description.toLowerCase().includes(searchTerm));
    
    const matchPriority = !priorityFilter || idea.priority === priorityFilter;
    
    // Sprint filter
    let matchSprint = true;
    if (sprintFilter === 'backlog') {
      // Show ideas not in any sprint
      matchSprint = !idea.sprint;
    } else if (sprintFilter) {
      matchSprint = idea.sprint === sprintFilter;
    }
    
    return matchSearch && matchPriority && matchSprint;
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
    const col = document.getElementById(colId);
    if (col) col.appendChild(card);
  });
  
  // Update counts
  document.querySelectorAll('.kanban-column').forEach(col => {
    const status = col.dataset.status;
    const count = counts[status] || 0;
    col.querySelector('.column-count').textContent = count;
  });
}

function normalizeStatus(status) {
  // If already a valid ID, return it
  if (statusColumns[status]) return status;
  
  // Map old format to new
  if (statusMap[status]) return statusMap[status];
  
  // Handle variations
  if (status.includes('待審核')) return 'pending';
  if (status.includes('已批准') && !status.includes('完成')) return 'approved';
  if (status.includes('開發中') || status.includes('進行中')) return 'in-progress';
  if (status.includes('測試')) return 'testing';
  if (status.includes('完成')) return 'done';
  if (status.includes('Backlog')) return 'backlog';
  
  return 'backlog';
}

function createCard(idea) {
  const card = document.createElement('div');
  card.className = 'idea-card';
  card.dataset.id = idea.id;
  card.draggable = true;
  
  const priorityClass = `priority-${(idea.priority || 'medium').toLowerCase()}`;
  const priorityEmoji = idea.priority === 'High' ? '🔴' : idea.priority === 'Medium' ? '🟡' : '🟢';
  
  // Find sprint name
  let sprintBadge = '';
  if (idea.sprint) {
    const sprint = sprints.find(s => s.id === idea.sprint);
    if (sprint) {
      sprintBadge = `<span class="card-sprint">🏃 ${escapeHtml(sprint.name)}</span>`;
    }
  }
  
  card.innerHTML = `
    <div class="card-header">
      <span class="card-id">${idea.id}</span>
      <span class="card-priority ${priorityClass}">${priorityEmoji} ${idea.priority || 'Medium'}</span>
    </div>
    <div class="card-name">${escapeHtml(idea.name)}</div>
    <div class="card-meta">
      ${idea.assignee ? `<span class="card-assignee">👤 ${escapeHtml(idea.assignee)}</span>` : ''}
      ${sprintBadge}
    </div>
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
        <a href="${escapeHtml(idea.github)}" target="_blank" onclick="event.stopPropagation()">🔗 GitHub</a>
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

function renderSprintList() {
  sprintList.innerHTML = '';
  
  if (sprints.length === 0) {
    sprintList.innerHTML = '<div class="empty-state">尚無 Sprint</div>';
    return;
  }
  
  // Sort: active first, then by start date
  const sorted = [...sprints].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    return new Date(b.startDate || 0) - new Date(a.startDate || 0);
  });
  
  sorted.forEach(sprint => {
    const card = createSprintCard(sprint);
    sprintList.appendChild(card);
  });
}

function createSprintCard(sprint) {
  const card = document.createElement('div');
  card.className = `sprint-card ${sprint.status === 'active' ? 'active' : ''}`;
  card.dataset.id = sprint.id;
  
  // Calculate progress
  const sprintIdeas = ideas.filter(i => i.sprint === sprint.id);
  const doneIdeas = sprintIdeas.filter(i => normalizeStatus(i.status) === 'done');
  const progress = sprintIdeas.length > 0 
    ? Math.round((doneIdeas.length / sprintIdeas.length) * 100) 
    : 0;
  
  // Format dates
  const dates = sprint.startDate && sprint.endDate 
    ? `${sprint.startDate} ~ ${sprint.endDate}`
    : '日期未設定';
  
  // Status display
  const statusText = sprint.status === 'active' ? '🏃 進行中' 
    : sprint.status === 'completed' ? '✅ 已完成' 
    : '📅 計劃中';
  
  card.innerHTML = `
    <div class="sprint-card-header">
      <span class="sprint-card-name">${escapeHtml(sprint.name)}</span>
      <span class="sprint-card-status ${sprint.status}">${statusText}</span>
    </div>
    <div class="sprint-card-dates">${dates}</div>
    <div class="sprint-card-progress">
      <div class="sprint-progress-bar">
        <div class="sprint-progress-fill" style="width: ${progress}%"></div>
      </div>
      <span class="sprint-progress-text">${doneIdeas.length}/${sprintIdeas.length}</span>
    </div>
  `;
  
  card.addEventListener('click', () => openSprintEditModal(sprint));
  
  return card;
}

function updateSprintFilter() {
  // Update filter dropdown
  const currentValue = filterSprint.value;
  filterSprint.innerHTML = `
    <option value="">所有 Sprint</option>
    <option value="backlog">📋 Backlog</option>
  `;
  
  sprints.forEach(sprint => {
    const option = document.createElement('option');
    option.value = sprint.id;
    option.textContent = `🏃 ${sprint.name}`;
    filterSprint.appendChild(option);
  });
  
  filterSprint.value = currentValue;
  
  // Update idea form sprint dropdown
  const ideaSprintSelect = document.getElementById('sprint');
  if (ideaSprintSelect) {
    ideaSprintSelect.innerHTML = '<option value="">未分配</option>';
    sprints.forEach(sprint => {
      const option = document.createElement('option');
      option.value = sprint.id;
      option.textContent = sprint.name;
      ideaSprintSelect.appendChild(option);
    });
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== Modal functions =====

function openNewModal() {
  editingId = null;
  modalTitle.textContent = '新增點子';
  ideaForm.reset();
  document.getElementById('status').value = 'backlog';
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
  document.getElementById('sprint').value = idea.sprint || '';
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

// Sprint modal
function openNewSprintModal() {
  editingSprintId = null;
  sprintModalTitle.textContent = '新增 Sprint';
  sprintForm.reset();
  btnSprintDelete.classList.add('hidden');
  sprintModal.classList.remove('hidden');
  document.getElementById('sprint-name').focus();
}

function openSprintEditModal(sprint) {
  editingSprintId = sprint.id;
  sprintModalTitle.textContent = '編輯 Sprint';
  
  document.getElementById('sprint-name').value = sprint.name || '';
  document.getElementById('sprint-start').value = sprint.startDate || '';
  document.getElementById('sprint-end').value = sprint.endDate || '';
  document.getElementById('sprint-status').value = sprint.status || 'planned';
  document.getElementById('sprint-goals').value = (sprint.goals || []).join('\n');
  
  btnSprintDelete.classList.remove('hidden');
  sprintModal.classList.remove('hidden');
}

function closeSprintModal() {
  sprintModal.classList.add('hidden');
  editingSprintId = null;
  sprintForm.reset();
}

// ===== Form submission =====

ideaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(ideaForm);
  const idea = {
    name: formData.get('name'),
    status: formData.get('status'),
    priority: formData.get('priority'),
    assignee: formData.get('assignee'),
    sprint: formData.get('sprint') || null,
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

sprintForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(sprintForm);
  const goalsText = formData.get('goals') || '';
  const goals = goalsText.split('\n').map(g => g.trim()).filter(g => g);
  
  const sprint = {
    name: formData.get('name'),
    startDate: formData.get('startDate') || null,
    endDate: formData.get('endDate') || null,
    status: formData.get('status'),
    goals
  };
  
  if (editingSprintId) {
    await updateSprint(editingSprintId, sprint);
  } else {
    await createSprint(sprint);
  }
  
  closeSprintModal();
});

// ===== Drag and drop =====

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

// ===== Event listeners =====

btnNew.addEventListener('click', openNewModal);
btnClose.addEventListener('click', closeModal);
btnCancel.addEventListener('click', closeModal);
btnDelete.addEventListener('click', () => editingId && deleteIdea(editingId));

// Sprint events
btnSprint.addEventListener('click', () => {
  sprintSidebar.classList.toggle('hidden');
  if (!sprintSidebar.classList.contains('hidden')) {
    fetchSprints();
  }
});
btnCloseSidebar.addEventListener('click', () => sprintSidebar.classList.add('hidden'));
btnNewSprint.addEventListener('click', openNewSprintModal);
btnSprintClose.addEventListener('click', closeSprintModal);
btnSprintCancel.addEventListener('click', closeSprintModal);
btnSprintDelete.addEventListener('click', () => editingSprintId && deleteSprint(editingSprintId));

searchInput.addEventListener('input', renderBoard);
filterPriority.addEventListener('change', renderBoard);
filterSprint.addEventListener('change', renderBoard);

// Close modals on outside click
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
sprintModal.addEventListener('click', (e) => {
  if (e.target === sprintModal) closeSprintModal();
});

// ===== Toast notifications =====

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || document.body;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ===== SSE for live updates =====

function setupSSE() {
  const evtSource = new EventSource('/api/events');
  
  evtSource.addEventListener('refresh', () => {
    fetchIdeas();
    fetchSprints();
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

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeSprintModal();
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

// ===== Initialize =====
fetchIdeas();
fetchSprints();
setupSSE();
