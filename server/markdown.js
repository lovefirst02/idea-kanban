const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const IDEAS_PATH = '/home/hao0x0/.openclaw/workspace-project-manager/memory/ideas';

// Ensure directory exists
function ensureDir() {
  if (!fs.existsSync(IDEAS_PATH)) {
    fs.mkdirSync(IDEAS_PATH, { recursive: true });
  }
}

// Parse a single markdown file
function parseIdeaFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content);
    
    // Extract ID from filename if not in frontmatter
    const filename = path.basename(filePath, '.md');
    const id = data.id || filename;
    
    // Parse status from content if not in frontmatter
    let status = data.status || '📝 待審核';
    let priority = data.priority || 'Medium';
    let assignee = data.assignee || '';
    let progress = data.progress || 0;
    let github = data.github || '';
    let name = data.name || data.title || '';
    let created = data.created || data['建立日期'] || '';
    
    // Try to parse from markdown content
    const statusMatch = body.match(/\*\*狀態\*\*[：:]\s*(.+)/);
    if (statusMatch) status = statusMatch[1].trim();
    
    const priorityMatch = body.match(/\*\*優先級\*\*[：:]\s*(.+)/);
    if (priorityMatch) priority = priorityMatch[1].trim();
    
    const assigneeMatch = body.match(/\*\*負責\s*Agent?\*\*[：:]\s*(.+)/);
    if (assigneeMatch) assignee = assigneeMatch[1].trim();
    
    const progressMatch = body.match(/\*\*進度\*\*[：:]\s*(\d+)/);
    if (progressMatch) progress = parseInt(progressMatch[1]);
    
    const githubMatch = body.match(/\*\*GitHub\*\*[：:]\s*(.+)/);
    if (githubMatch) github = githubMatch[1].trim();
    
    const idMatch = body.match(/\*\*ID\*\*[：:]\s*(.+)/);
    if (idMatch && !data.id) id = idMatch[1].trim();
    
    const createdMatch = body.match(/\*\*建立日期\*\*[：:]\s*(.+)/);
    if (createdMatch) created = createdMatch[1].trim();
    
    // Get name from first h1
    const nameMatch = body.match(/^#\s+(.+)$/m);
    if (nameMatch && !name) name = nameMatch[1].trim();
    
    // Extract description
    const descMatch = body.match(/##\s*描述\s*\n([\s\S]*?)(?=\n##|$)/);
    const description = descMatch ? descMatch[1].trim() : '';
    
    return {
      id,
      name,
      status,
      priority,
      assignee,
      progress,
      github,
      created,
      description,
      filename,
      filePath
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

// Get all ideas
function getAllIdeas() {
  ensureDir();
  
  const files = fs.readdirSync(IDEAS_PATH).filter(f => f.endsWith('.md'));
  const ideas = files
    .map(f => parseIdeaFile(path.join(IDEAS_PATH, f)))
    .filter(Boolean);
  
  return ideas;
}

// Get single idea by ID
function getIdea(id) {
  const ideas = getAllIdeas();
  return ideas.find(i => i.id === id || i.filename === id);
}

// Generate markdown content
function generateMarkdown(idea) {
  return `# ${idea.name || 'Untitled'}

## 基本資訊
- **ID**: ${idea.id}
- **建立日期**: ${idea.created || new Date().toISOString().split('T')[0]}
- **狀態**: ${idea.status || '📝 待審核'}
- **優先級**: ${idea.priority || 'Medium'}
${idea.assignee ? `- **負責 Agent**: ${idea.assignee}` : ''}
${idea.progress ? `- **進度**: ${idea.progress}%` : ''}
${idea.github ? `- **GitHub**: ${idea.github}` : ''}

## 描述
${idea.description || ''}
`;
}

// Create new idea
function createIdea(idea) {
  ensureDir();
  
  // Generate ID if not provided
  if (!idea.id) {
    const existing = getAllIdeas();
    const maxNum = existing
      .map(i => {
        const match = i.id.match(/IDEA-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .reduce((max, n) => Math.max(max, n), 0);
    idea.id = `IDEA-${String(maxNum + 1).padStart(3, '0')}`;
  }
  
  const filename = `${idea.id}.md`;
  const filePath = path.join(IDEAS_PATH, filename);
  
  const content = generateMarkdown(idea);
  fs.writeFileSync(filePath, content, 'utf-8');
  
  return parseIdeaFile(filePath);
}

// Update idea
function updateIdea(id, updates) {
  const idea = getIdea(id);
  if (!idea) return null;
  
  const updated = { ...idea, ...updates };
  const content = generateMarkdown(updated);
  fs.writeFileSync(idea.filePath, content, 'utf-8');
  
  return parseIdeaFile(idea.filePath);
}

// Update status only
function updateStatus(id, status) {
  return updateIdea(id, { status });
}

// Delete idea
function deleteIdea(id) {
  const idea = getIdea(id);
  if (!idea) return false;
  
  fs.unlinkSync(idea.filePath);
  return true;
}

module.exports = {
  getAllIdeas,
  getIdea,
  createIdea,
  updateIdea,
  updateStatus,
  deleteIdea,
  IDEAS_PATH
};
