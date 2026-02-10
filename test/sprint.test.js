/**
 * Sprint API Tests
 * TDD - Red/Green/Refactor
 */

const request = require('supertest');
const express = require('express');
const sprintRouter = require('../server/sprint');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/sprints', sprintRouter);

describe('Sprint API', () => {
  // Store for cleanup
  let createdSprintId;

  describe('GET /api/sprints', () => {
    it('should return an array of sprints', async () => {
      const res = await request(app).get('/api/sprints');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/sprints', () => {
    it('should create a new sprint', async () => {
      const newSprint = {
        name: 'Test Sprint 1',
        startDate: '2026-02-10',
        endDate: '2026-02-24',
        goals: ['Goal 1', 'Goal 2']
      };

      const res = await request(app)
        .post('/api/sprints')
        .send(newSprint);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Sprint 1');
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('planned');
      
      createdSprintId = res.body.data.id;
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post('/api/sprints')
        .send({ startDate: '2026-02-10' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if dates are invalid', async () => {
      const res = await request(app)
        .post('/api/sprints')
        .send({
          name: 'Invalid Sprint',
          startDate: '2026-02-24',
          endDate: '2026-02-10'  // End before start
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/sprints/:id', () => {
    it('should return a single sprint', async () => {
      // First create a sprint
      const createRes = await request(app)
        .post('/api/sprints')
        .send({
          name: 'Sprint for Get Test',
          startDate: '2026-02-10',
          endDate: '2026-02-24'
        });
      
      const sprintId = createRes.body.data.id;

      const res = await request(app).get(`/api/sprints/${sprintId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(sprintId);
    });

    it('should return 404 for non-existent sprint', async () => {
      const res = await request(app).get('/api/sprints/non-existent-id');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/sprints/:id', () => {
    it('should update an existing sprint', async () => {
      // First create a sprint
      const createRes = await request(app)
        .post('/api/sprints')
        .send({
          name: 'Sprint to Update',
          startDate: '2026-02-10',
          endDate: '2026-02-24'
        });
      
      const sprintId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/sprints/${sprintId}`)
        .send({ name: 'Updated Sprint Name', status: 'active' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Sprint Name');
      expect(res.body.data.status).toBe('active');
    });

    it('should return 404 for non-existent sprint', async () => {
      const res = await request(app)
        .put('/api/sprints/non-existent-id')
        .send({ name: 'Updated' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/sprints/:id', () => {
    it('should delete an existing sprint', async () => {
      // First create a sprint
      const createRes = await request(app)
        .post('/api/sprints')
        .send({
          name: 'Sprint to Delete',
          startDate: '2026-02-10',
          endDate: '2026-02-24'
        });
      
      const sprintId = createRes.body.data.id;

      const res = await request(app).delete(`/api/sprints/${sprintId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it's deleted
      const getRes = await request(app).get(`/api/sprints/${sprintId}`);
      expect(getRes.status).toBe(404);
    });

    it('should return 404 for non-existent sprint', async () => {
      const res = await request(app).delete('/api/sprints/non-existent-id');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/sprints/:id/ideas', () => {
    it('should add an idea to a sprint', async () => {
      // First create a sprint
      const createRes = await request(app)
        .post('/api/sprints')
        .send({
          name: 'Sprint for Ideas',
          startDate: '2026-02-10',
          endDate: '2026-02-24'
        });
      
      const sprintId = createRes.body.data.id;

      const res = await request(app)
        .post(`/api/sprints/${sprintId}/ideas`)
        .send({ ideaId: 'IDEA-001' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ideas).toContain('IDEA-001');
    });

    it('should not add duplicate idea', async () => {
      // First create a sprint
      const createRes = await request(app)
        .post('/api/sprints')
        .send({
          name: 'Sprint for Duplicate Test',
          startDate: '2026-02-10',
          endDate: '2026-02-24'
        });
      
      const sprintId = createRes.body.data.id;

      // Add idea first time
      await request(app)
        .post(`/api/sprints/${sprintId}/ideas`)
        .send({ ideaId: 'IDEA-002' });

      // Try to add same idea again
      const res = await request(app)
        .post(`/api/sprints/${sprintId}/ideas`)
        .send({ ideaId: 'IDEA-002' });

      expect(res.status).toBe(200);
      // Should not have duplicates
      const ideas = res.body.data.ideas.filter(id => id === 'IDEA-002');
      expect(ideas.length).toBe(1);
    });

    it('should return 400 if ideaId is missing', async () => {
      // First create a sprint
      const createRes = await request(app)
        .post('/api/sprints')
        .send({
          name: 'Sprint for Missing Idea Test',
          startDate: '2026-02-10',
          endDate: '2026-02-24'
        });
      
      const sprintId = createRes.body.data.id;

      const res = await request(app)
        .post(`/api/sprints/${sprintId}/ideas`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/sprints/:id/ideas/:ideaId', () => {
    it('should remove an idea from a sprint', async () => {
      // First create a sprint and add an idea
      const createRes = await request(app)
        .post('/api/sprints')
        .send({
          name: 'Sprint for Remove Idea Test',
          startDate: '2026-02-10',
          endDate: '2026-02-24'
        });
      
      const sprintId = createRes.body.data.id;

      await request(app)
        .post(`/api/sprints/${sprintId}/ideas`)
        .send({ ideaId: 'IDEA-003' });

      // Remove the idea
      const res = await request(app)
        .delete(`/api/sprints/${sprintId}/ideas/IDEA-003`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ideas).not.toContain('IDEA-003');
    });
  });
});
