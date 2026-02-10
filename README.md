# 💡 Idea Kanban Board

A local web kanban board for managing ideas and project status with Scrum/Sprint support. Drag and drop cards to change status, with real-time sync to Markdown files.

## Features

- 📋 **Kanban View** - Six columns: Backlog → 待審核 → 已批准 → 開發中 → 測試中 → 已完成
- 🏃 **Sprint Management** - Create and manage Sprints, assign ideas
- 🖱️ **Drag & Drop** - Drag cards between columns to change status
- 📝 **Markdown Storage** - All data stored as Markdown files
- 🔄 **Real-time Sync** - Auto-refresh when files change
- 🔍 **Search & Filter** - Find ideas by name, ID, priority, or Sprint
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

## Sprint Management

### Creating a Sprint

1. Click 🏃 Sprint button in header
2. Click "+ 新增 Sprint"
3. Fill in name, dates, and goals
4. Save

### Assigning Ideas to Sprint

1. Open an idea card
2. Select Sprint from dropdown
3. Save

### Sprint Progress

Sprint cards show:
- Status (計劃中 / 進行中 / 已完成)
- Date range
- Progress bar (completed / total ideas)

## Testing

```bash
# Run tests with coverage
npm test

# Watch mode
npm run test:watch
```

Current coverage: 87%+ (Sprint API)

## API Endpoints

### Ideas API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/ideas | Get all ideas |
| GET | /api/ideas/:id | Get single idea |
| POST | /api/ideas | Create new idea |
| PUT | /api/ideas/:id | Update idea |
| PATCH | /api/ideas/:id/status | Quick status update |
| DELETE | /api/ideas/:id | Delete idea |

### Sprint API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/sprints | Get all sprints |
| GET | /api/sprints/:id | Get single sprint |
| POST | /api/sprints | Create sprint |
| PUT | /api/sprints/:id | Update sprint |
| DELETE | /api/sprints/:id | Delete sprint |
| POST | /api/sprints/:id/ideas | Add idea to sprint |
| DELETE | /api/sprints/:id/ideas/:ideaId | Remove idea from sprint |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/columns | Get column definitions |
| GET | /api/settings | Get settings |
| PUT | /api/settings/webhook | Update webhook URL |
| POST | /api/notify-pm | Manually notify PM Agent |

## Column Status

| ID | Title | Color |
|----|-------|-------|
| backlog | 📋 Backlog | Gray |
| pending | 📝 待審核 | Yellow |
| approved | ✅ 已批准 | Green |
| in-progress | 🚧 開發中 | Blue |
| testing | 🧪 測試中 | Purple |
| done | ✅ 已完成 | Teal |

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

### Wake Event

```bash
OPENCLAW_GATEWAY_URL=http://localhost:18789 \
OPENCLAW_GATEWAY_TOKEN=your-token \
npm start
```

### JSONL Notifications

**File:** `~/.openclaw/workspace-project-manager/memory/notifications.jsonl`

**Actions:** `create`, `update`, `delete`, `status_change`, `manual_notify`

## Keyboard Shortcuts

- `Ctrl + N` - New idea
- `Esc` - Close modal

## Project Structure

```
idea-kanban/
├── server/
│   ├── index.js         # Express server + SSE
│   ├── api.js           # REST API routes
│   ├── sprint.js        # Sprint API (TDD)
│   ├── columns.js       # Column definitions
│   ├── markdown.js      # Markdown read/write
│   ├── webhook.js       # Discord webhook
│   └── notifications.js # OpenClaw notifications
├── test/
│   └── sprint.test.js   # Sprint API tests
├── public/
│   ├── index.html       # Main page
│   ├── style.css        # Dark theme styles
│   └── app.js           # Frontend logic
├── jest.config.js       # Test configuration
├── package.json
└── README.md
```

## License

MIT
