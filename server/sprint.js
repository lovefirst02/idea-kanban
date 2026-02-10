/**
 * Sprint Management Module
 * Handles Sprint CRUD operations and idea assignments
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Data file path
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const SPRINTS_FILE = path.join(DATA_DIR, 'sprints.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load sprints from file
function loadSprints() {
  ensureDataDir();
  if (fs.existsSync(SPRINTS_FILE)) {
    try {
      const data = fs.readFileSync(SPRINTS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }
  return [];
}

// Save sprints to file
function saveSprints(sprints) {
  ensureDataDir();
  fs.writeFileSync(SPRINTS_FILE, JSON.stringify(sprints, null, 2));
}

// Generate unique ID
function generateId() {
  return `sprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Validate sprint data
function validateSprint(data, isUpdate = false) {
  const errors = [];
  
  if (!isUpdate && !data.name) {
    errors.push('Name is required');
  }
  
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      errors.push('End date must be after start date');
    }
  }
  
  if (data.status && !['planned', 'active', 'completed'].includes(data.status)) {
    errors.push('Invalid status. Must be: planned, active, or completed');
  }
  
  return errors;
}

// GET /api/sprints - List all sprints
router.get('/', (req, res) => {
  try {
    const sprints = loadSprints();
    res.json({ success: true, data: sprints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sprints - Create new sprint
router.post('/', (req, res) => {
  try {
    const errors = validateSprint(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(', ') });
    }
    
    const sprints = loadSprints();
    const now = new Date().toISOString();
    
    const newSprint = {
      id: generateId(),
      name: req.body.name,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      goals: req.body.goals || [],
      ideas: req.body.ideas || [],
      status: req.body.status || 'planned',
      createdAt: now,
      updatedAt: now
    };
    
    sprints.push(newSprint);
    saveSprints(sprints);
    
    res.status(201).json({ success: true, data: newSprint });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sprints/:id - Get single sprint
router.get('/:id', (req, res) => {
  try {
    const sprints = loadSprints();
    const sprint = sprints.find(s => s.id === req.params.id);
    
    if (!sprint) {
      return res.status(404).json({ success: false, error: 'Sprint not found' });
    }
    
    res.json({ success: true, data: sprint });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/sprints/:id - Update sprint
router.put('/:id', (req, res) => {
  try {
    const errors = validateSprint(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(', ') });
    }
    
    const sprints = loadSprints();
    const index = sprints.findIndex(s => s.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Sprint not found' });
    }
    
    const updatedSprint = {
      ...sprints[index],
      ...req.body,
      id: sprints[index].id,  // Prevent ID change
      createdAt: sprints[index].createdAt,  // Preserve creation time
      updatedAt: new Date().toISOString()
    };
    
    sprints[index] = updatedSprint;
    saveSprints(sprints);
    
    res.json({ success: true, data: updatedSprint });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/sprints/:id - Delete sprint
router.delete('/:id', (req, res) => {
  try {
    const sprints = loadSprints();
    const index = sprints.findIndex(s => s.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Sprint not found' });
    }
    
    sprints.splice(index, 1);
    saveSprints(sprints);
    
    res.json({ success: true, message: 'Sprint deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sprints/:id/ideas - Add idea to sprint
router.post('/:id/ideas', (req, res) => {
  try {
    const { ideaId } = req.body;
    
    if (!ideaId) {
      return res.status(400).json({ success: false, error: 'ideaId is required' });
    }
    
    const sprints = loadSprints();
    const index = sprints.findIndex(s => s.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Sprint not found' });
    }
    
    // Add idea if not already present
    if (!sprints[index].ideas.includes(ideaId)) {
      sprints[index].ideas.push(ideaId);
      sprints[index].updatedAt = new Date().toISOString();
      saveSprints(sprints);
    }
    
    res.json({ success: true, data: sprints[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/sprints/:id/ideas/:ideaId - Remove idea from sprint
router.delete('/:id/ideas/:ideaId', (req, res) => {
  try {
    const sprints = loadSprints();
    const index = sprints.findIndex(s => s.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Sprint not found' });
    }
    
    sprints[index].ideas = sprints[index].ideas.filter(id => id !== req.params.ideaId);
    sprints[index].updatedAt = new Date().toISOString();
    saveSprints(sprints);
    
    res.json({ success: true, data: sprints[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export for testing
module.exports = router;
module.exports.loadSprints = loadSprints;
module.exports.saveSprints = saveSprints;
