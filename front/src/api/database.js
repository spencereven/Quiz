import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs/promises';

const dbPath = path.resolve(process.cwd(), 'data');
const dbFile = path.resolve(dbPath, 'quiz.db');

async function initializeDb() {
  try {
    await fs.mkdir(dbPath, { recursive: true });
  } catch (error) {
    console.error('Error creating database directory:', error);
    throw error;
  }

  const db = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correctAnswer TEXT NOT NULL,
      explanation TEXT,
      difficulty TEXT,
      category TEXT,
      tags TEXT
    );
  `);

  return db;
}

let dbInstance;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await initializeDb();
  }
  return dbInstance;
}