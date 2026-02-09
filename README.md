# 💡 Idea Kanban Board

A local web kanban board for managing ideas and project status. Drag and drop cards to change status, with real-time sync to Markdown files.

## Features

- 📋 **Kanban View** - Four columns: 待審核 → 已批准 → 開發中 → 已完成
- 🖱️ **Drag & Drop** - Drag cards between columns to change status
- 📝 **Markdown Storage** - All data stored as Markdown files
- 🔄 **Real-time Sync** - Auto-refresh when files change
- 🔍 **Search & Filter** - Find ideas by name, ID, or filter by priority
- ✏️ **CRUD Operations** - Create, edit, and delete ideas

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

## Keyboard Shortcuts

- `Ctrl + N` - New idea
- `Esc` - Close modal

## Project Structure

```
idea-kanban/
├── server/
│   ├── index.js      # Express server + SSE
│   ├── api.js        # REST API routes
│   └── markdown.js   # Markdown read/write
├── public/
│   ├── index.html    # Main page
│   ├── style.css     # Dark theme styles
│   └── app.js        # Frontend logic
├── package.json
└── README.md
```

## License

MIT
