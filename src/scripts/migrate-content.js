import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/com1.db');

const db = new Database(dbPath);

console.log('Migrating database content for new stationery site structure...');

try {
  // 1. Update Pages
  const updatePage = db.prepare('UPDATE pages SET slug = ?, title = ? WHERE slug = ?');
  updatePage.run('about-music', '關於音樂課程', 'about-teacher');
  updatePage.run('about-guchau', '關於鼓潮', 'about-us');
  db.prepare("DELETE FROM pages WHERE slug IN ('about-ftmo','about-manufacturing','about-coop')").run();
  db.prepare("INSERT OR IGNORE INTO pages (slug, title, content_html, is_published) VALUES ('about-guchau','關於鼓潮','',1)").run();
  db.prepare("INSERT OR IGNORE INTO pages (slug, title, content_html, is_published) VALUES ('about-music','關於音樂課程','',1)").run();

  // 2. Update Menus
  // We'll delete existing menus and re-seed them to ensure clean structure match.
  db.prepare('DELETE FROM menus').run();
  
  const insertMenu = db.prepare('INSERT INTO menus (title, slug, url, order_index, parent_id, visible) VALUES (?, ?, ?, ?, ?, 1)');
  
  // Parent items
  const info = insertMenu.run('關於', null, null, 10, null);
  const parentId = info.lastInsertRowid;
  
  insertMenu.run('關於鼓潮', 'about-guchau', '/about-guchau.html', 1, parentId);
  insertMenu.run('關於音樂課程', 'about-music', '/about-music.html', 2, parentId);
  
  insertMenu.run('部落格', 'blog', null, 20, null);
  insertMenu.run('最新消息', 'news', null, 30, null);
  insertMenu.run('師資說明', 'leaderboard', null, 40, null); // URL stays leaderboard.html for now
  insertMenu.run('體驗課程專案', 'plans', null, 50, null); // URL stays plans.html
  insertMenu.run('聯絡我們', 'contact', null, 60, null);
  insertMenu.run('影像記錄', 'trial', null, 70, null); // URL stays trial.html

  console.log('Database migration completed.');
  
} catch (err) {
  console.error('Migration failed:', err);
} finally {
  db.close();
}

