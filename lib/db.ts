import fs from "fs";
import { DatabaseSync } from "node:sqlite";

import { dbPath, uploadDir } from "./paths";

export type User = {
  id: number;
  username: string;
  password_hash: string;
  avatar: string | null;
};

export type Group = {
  id: number;
  name: string;
  code: string;
};

export type Entry = {
  id: number;
  group_id: number;
  user_id: number;
  day: string;
  kind: string;
  filename: string;
  created_at: string | null;
  username: string;
  avatar: string | null;
};

export type Comment = {
  id: number;
  entry_id: number;
  user_id: number;
  body: string | null;
  filename: string | null;
  created_at: string | null;
  username: string;
  avatar: string | null;
};

export type PromptRow = {
  group_id: number;
  day: string;
  prompt: string;
  set_by: number;
};

const globalForDb = globalThis as unknown as { journalDb?: DatabaseSync };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS memberships (
  user_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, group_id)
);
CREATE TABLE IF NOT EXISTS daily_prompts (
  group_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  prompt TEXT NOT NULL,
  set_by INTEGER NOT NULL,
  PRIMARY KEY (group_id, day)
);
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  kind TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  body TEXT,
  filename TEXT,
  created_at TEXT
);
`;

export function getDb() {
  if (!globalForDb.journalDb) {
    fs.mkdirSync(uploadDir(), { recursive: true });
    const db = new DatabaseSync(dbPath());
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
    db.exec(SCHEMA);
    const userColumns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    if (!userColumns.some((column) => column.name === "avatar")) {
      db.exec("ALTER TABLE users ADD COLUMN avatar TEXT");
    }
    globalForDb.journalDb = db;
  }
  return globalForDb.journalDb;
}

export function todayStr() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function isUniqueError(err: unknown) {
  return err instanceof Error && /UNIQUE/i.test(err.message);
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeCode(db: DatabaseSync) {
  const exists = db.prepare("SELECT 1 FROM groups WHERE code = ?");
  while (true) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    if (!exists.get(code)) return code;
  }
}

export function groupForMember(db: DatabaseSync, userId: number, groupId: number) {
  const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(groupId) as Group | undefined;
  if (!group) return { error: "missing" as const };
  const member = db
    .prepare("SELECT 1 FROM memberships WHERE user_id = ? AND group_id = ?")
    .get(userId, groupId);
  if (!member) return { error: "forbidden" as const };
  return { group };
}
