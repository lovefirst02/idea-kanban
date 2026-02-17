/**
 * Notifications Mark-as-Read API Tests
 */

const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const notifications = require('../server/notifications');

// Setup test app using the api router
const apiRouter = require('../server/api');
const app = express();
app.use(express.json());
app.use('/api', apiRouter);

// Use a temporary notifications file for tests
const TEST_NOTIFICATIONS_PATH = notifications.NOTIFICATIONS_PATH;

function seedNotifications(entries) {
  const dir = path.dirname(TEST_NOTIFICATIONS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const content = entries.map(e => JSON.stringify(e)).join('\n') + '\n';
  fs.writeFileSync(TEST_NOTIFICATIONS_PATH, content, 'utf-8');
}

function readNotifications() {
  if (!fs.existsSync(TEST_NOTIFICATIONS_PATH)) return [];
  const content = fs.readFileSync(TEST_NOTIFICATIONS_PATH, 'utf-8');
  return content.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
}

// Backup & restore the real notifications file around the test suite
let originalContent = null;

beforeAll(() => {
  if (fs.existsSync(TEST_NOTIFICATIONS_PATH)) {
    originalContent = fs.readFileSync(TEST_NOTIFICATIONS_PATH, 'utf-8');
  }
});

afterAll(() => {
  if (originalContent !== null) {
    fs.writeFileSync(TEST_NOTIFICATIONS_PATH, originalContent, 'utf-8');
  } else if (fs.existsSync(TEST_NOTIFICATIONS_PATH)) {
    fs.unlinkSync(TEST_NOTIFICATIONS_PATH);
  }
});

describe('POST /api/notifications/:id/read', () => {
  const notif1 = { id: 'notif-test-001', timestamp: new Date().toISOString(), read: false, action: 'create', ideaId: 'IDEA-1', ideaName: 'Test Idea 1' };
  const notif2 = { id: 'notif-test-002', timestamp: new Date().toISOString(), read: false, action: 'update', ideaId: 'IDEA-2', ideaName: 'Test Idea 2' };

  beforeEach(() => {
    seedNotifications([notif1, notif2]);
  });

  it('should mark a single notification as read and return { success: true }', async () => {
    const res = await request(app).post('/api/notifications/notif-test-001/read');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    // Verify the notification is now read
    const all = readNotifications();
    const updated = all.find(n => n.id === 'notif-test-001');
    expect(updated.read).toBe(true);

    // The other notification should remain unread
    const other = all.find(n => n.id === 'notif-test-002');
    expect(other.read).toBe(false);
  });

  it('should return 404 for a non-existent notification', async () => {
    const res = await request(app).post('/api/notifications/notif-does-not-exist/read');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Notification not found');
  });

  it('should be idempotent — marking an already-read notification succeeds', async () => {
    // Mark it once
    await request(app).post('/api/notifications/notif-test-001/read');
    // Mark it again
    const res = await request(app).post('/api/notifications/notif-test-001/read');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});

describe('POST /api/notifications/mark-read', () => {
  const notif1 = { id: 'notif-batch-001', timestamp: new Date().toISOString(), read: false, action: 'create', ideaId: 'IDEA-10', ideaName: 'Batch 1' };
  const notif2 = { id: 'notif-batch-002', timestamp: new Date().toISOString(), read: false, action: 'create', ideaId: 'IDEA-11', ideaName: 'Batch 2' };
  const notif3 = { id: 'notif-batch-003', timestamp: new Date().toISOString(), read: false, action: 'update', ideaId: 'IDEA-12', ideaName: 'Batch 3' };

  beforeEach(() => {
    seedNotifications([notif1, notif2, notif3]);
  });

  it('should batch-mark multiple notifications as read', async () => {
    const res = await request(app)
      .post('/api/notifications/mark-read')
      .send({ ids: ['notif-batch-001', 'notif-batch-003'] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);

    // Verify
    const all = readNotifications();
    expect(all.find(n => n.id === 'notif-batch-001').read).toBe(true);
    expect(all.find(n => n.id === 'notif-batch-002').read).toBe(false);
    expect(all.find(n => n.id === 'notif-batch-003').read).toBe(true);
  });

  it('should return count 0 when ids do not match any notifications', async () => {
    const res = await request(app)
      .post('/api/notifications/mark-read')
      .send({ ids: ['notif-nonexistent'] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(0);
  });

  it('should return 400 when ids is missing', async () => {
    const res = await request(app)
      .post('/api/notifications/mark-read')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when ids is not an array', async () => {
    const res = await request(app)
      .post('/api/notifications/mark-read')
      .send({ ids: 'all' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when ids is an empty array', async () => {
    const res = await request(app)
      .post('/api/notifications/mark-read')
      .send({ ids: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
