const express = require('express');
const router = express.Router();
const md = require('./markdown');

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
router.post('/ideas', (req, res) => {
  try {
    const idea = md.createIdea(req.body);
    res.status(201).json({ success: true, data: idea });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/ideas/:id - Update idea
router.put('/ideas/:id', (req, res) => {
  try {
    const idea = md.updateIdea(req.params.id, req.body);
    if (!idea) {
      return res.status(404).json({ success: false, error: 'Idea not found' });
    }
    res.json({ success: true, data: idea });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/ideas/:id/status - Quick status update
router.patch('/ideas/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }
    const idea = md.updateStatus(req.params.id, status);
    if (!idea) {
      return res.status(404).json({ success: false, error: 'Idea not found' });
    }
    res.json({ success: true, data: idea });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/ideas/:id - Delete idea
router.delete('/ideas/:id', (req, res) => {
  try {
    const deleted = md.deleteIdea(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Idea not found' });
    }
    res.json({ success: true, message: 'Idea deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
