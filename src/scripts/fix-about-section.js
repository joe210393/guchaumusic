
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/com1.db');

console.log(`Refactoring About section in ${dbPath}...`);

try {
  const db = new Database(dbPath);

  // 1. Update Pages
  // about-us -> about-guchau
  const updateGuchau = db.prepare("UPDATE pages SET slug = 'about-guchau', title = '關於鼓潮' WHERE slug = 'about-us'");
  const res1 = updateGuchau.run();
  if (res1.changes === 0) {
      // Insert if not exists (maybe it was deleted or named differently)
      db.prepare("INSERT OR IGNORE INTO pages (slug, title, content_html, is_published) VALUES ('about-guchau', '關於鼓潮', '', 1)").run();
  }

  // about-teacher -> about-music
  const updateMusic = db.prepare("UPDATE pages SET slug = 'about-music', title = '關於音樂課程' WHERE slug = 'about-teacher'");
  const res2 = updateMusic.run();
  if (res2.changes === 0) {
      db.prepare("INSERT OR IGNORE INTO pages (slug, title, content_html, is_published) VALUES ('about-music', '關於音樂課程', '', 1)").run();
  }

  // about-ftmo -> DELETE
  db.prepare("DELETE FROM pages WHERE slug = 'about-ftmo'").run();
  
  // Delete any other 'about-' pages that are not these two? No, be safe.
  
  // 2. Update Menus
  // Find parent "關於" or create it
  let parent = db.prepare("SELECT id FROM menus WHERE title LIKE '%關於%' AND parent_id IS NULL").get();
  let parentId;
  
  if (!parent) {
      const info = db.prepare("INSERT INTO menus (title, order_index, visible) VALUES ('關於', 10, 1)").run();
      parentId = info.lastInsertRowid;
  } else {
      parentId = parent.id;
      // Ensure title is simple '關於' if user wants that, or '關於鼓潮' as top? 
      // User said "關於 打開來出現...", so top is likely "關於".
      db.prepare("UPDATE menus SET title = '關於' WHERE id = ?").run(parentId);
  }
  
  // Clear existing submenus for this parent to rebuild clean
  db.prepare("DELETE FROM menus WHERE parent_id = ?").run(parentId);
  
  // Insert new submenus
  const insertMenu = db.prepare("INSERT INTO menus (title, slug, url, order_index, parent_id, visible) VALUES (?, ?, ?, ?, ?, 1)");
  
  insertMenu.run('關於鼓潮', 'about-guchau', '/about-guchau.html', 1, parentId);
  insertMenu.run('關於音樂課程', 'about-music', '/about-music.html', 2, parentId);

  console.log('Database About section refactored successfully.');
  db.close();
  
} catch (err) {
  console.error('Error updating database:', err);
  process.exit(1);
}

