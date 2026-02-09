# 💡 Idea Kanban Board

A local web kanban board for managing ideas and project status. Drag and drop cards to change status, with real-time sync to Markdown files.

## Features

- 📋 **Kanban View** - Four columns: 待審核 → 已批准 → 開發中 → 已完成
- 🖱️ **Drag & Drop** - Drag cards between columns to change status
- 📝 **Markdown Storage** - All data stored as Markdown files
- 🔄 **Real-time Sync** - Auto-refresh when files change
- 🔍 **Search & Filter** - Find ideas by name, ID, or filter by priority
- ✏️ **CRUD Operations** - Create, edit, and delete ideas
- 📢 **Discord Webhook** - Send notifications to Discord channels
- 🤖 **OpenClaw Integration** - Notify OpenClaw agents via JSONL file

## Installation

```bash
git clone https://github.com/lovefirst02/idea-kanban.git
cd idea-kanban
npm install
```

## Usage

```bash
npm start
# Opens at http://localhost:3456
```

The kanban board will read/write Markdown files from:
```
~/.openclaw/workspace-project-manager/memory/ideas/
```

## Discord Webhook

Configure Discord notifications:

1. Click ⚙️ in the header
2. Paste your Discord Webhook URL
3. Save

Or use environment variable:
```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx npm start
```

## OpenClaw Integration

### Wake Event (Direct Agent Trigger)

The kanban can directly wake OpenClaw agents via Gateway API:

```bash
OPENCLAW_GATEWAY_URL=http://localhost:4444 \
OPENCLAW_GATEWAY_TOKEN=your-token \
npm start
```

When configured, every kanban operation will send a wake event to trigger the agent immediately.

### JSONL File (Polling)

The kanban also writes notifications to a JSONL file that OpenClaw agents can poll:

**File:** `~/.openclaw/workspace-project-manager/memory/notifications.jsonl`

**Format:**
```json
{"id": "notif-xxx", "timestamp": "2026-02-09T09:40:00Z", "action": "status_change", "ideaId": "IDEA-001", "ideaName": "xxx", "from": "📝 待審核", "to": "✅ 已批准", "read": false}
```

**Actions:** `create`, `update`, `delete`, `status_change`

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | Get all notifications |
| GET | /api/notifications?unread=true | Get unread only |
| PATCH | /api/notifications/mark-read | Mark as read |
| DELETE | /api/notifications/cleanup | Clean old (default 7 days) |

**Mark as read example:**
```bash
curl -X PATCH http://localhost:3456/api/notifications/mark-read \
  -H "Content-Type: application/json" \
  -d '{"ids": ["notif-xxx"]}'

# Or mark all as read:
curl -X PATCH http://localhost:3456/api/notifications/mark-read \
  -H "Content-Type: application/json" \
  -d '{"ids": "all"}'
```

## Card Information

Each idea card displays:
- ID (e.g., IDEA-001)
- Name
- Priority (High/Medium/Low)
- Assigned Agent
- Progress percentage
- GitHub link (if available)

## Markdown Format

Each idea is stored as a Markdown file:

```markdown
# Project Name

## 基本資訊
- **ID**: IDEA-001
- **建立日期**: 2026-02-09
- **狀態**: 📝 待審核
- **優先級**: Medium
- **負責 Agent**: Coding Agent
- **進度**: 50%
- **GitHub**: https://github.com/...

## 描述
Description of the idea...
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/ideas | Get all ideas |
| GET | /api/ideas/:id | Get single idea |
| POST | /api/ideas | Create new idea |
| PUT | /api/ideas/:id | Update idea |
| PATCH | /api/ideas/:id/status | Quick status update |
| DELETE | /api/ideas/:id | Delete idea |
| GET | /api/settings | Get settings |
| PUT | /api/settings/webhook | Update webhook URL |

## Keyboard Shortcuts

- `Ctrl + N` - New idea
- `Esc` - Close modal

## Project Structure

```
idea-kanban/
├── server/
│   ├── index.js         # Express server + SSE
│   ├── api.js           # REST API routes
│   ├── markdown.js      # Markdown read/write
│   ├── webhook.js       # Discord webhook
│   └── notifications.js # OpenClaw notifications
├── public/
│   ├── index.html       # Main page
│   ├── style.css        # Dark theme styles
│   └── app.js           # Frontend logic
├── config.json          # Webhook config (auto-created)
├── package.json
└── README.md
```

## License

MIT
