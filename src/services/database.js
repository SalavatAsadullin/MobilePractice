 
import * as SQLite from 'expo-sqlite';
 
const db = SQLite.openDatabaseSync('aquadelivery.db');
 
export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL,
      email     TEXT NOT NULL UNIQUE,
      phone     TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
 
    CREATE TABLE IF NOT EXISTS orders (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      brand     TEXT NOT NULL,
      volume    TEXT NOT NULL,
      price     INTEGER NOT NULL,
      address   TEXT NOT NULL,
      phone     TEXT NOT NULL,
      quantity  INTEGER NOT NULL,
      timeSlot  TEXT NOT NULL,
      comment   TEXT,
      status    TEXT NOT NULL DEFAULT 'В процессе',
      createdAt TEXT NOT NULL
    );
  `);
}
 
 
// Сохранить пользователя при регистрации
export function saveUser(name, email, phone) {
  const createdAt = new Date().toISOString();
  // INSERT OR REPLACE — перезаписывает если email уже есть
  // ? — параметры, защита от SQL-инъекций
  db.runSync(
    `INSERT OR REPLACE INTO users (name, email, phone, createdAt)
     VALUES (?, ?, ?, ?)`,
    [name, email, phone, createdAt]
  );
}
 
// Загрузить последнего пользователя
export function loadUser() {
  return db.getFirstSync(
    `SELECT * FROM users ORDER BY id DESC LIMIT 1`
  );
}
 

