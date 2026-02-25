import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const dbPath = path.resolve("apas.db");
const db = new Database(dbPath);

export function getDb() {
  return db;
}

export function initDatabase() {
  console.log("Initializing Academic Database...");

  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // 1. Users (Admin/Teachers)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'teacher')) NOT NULL,
      full_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Classes/Cohorts
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, -- e.g., "L3 Computer Science"
      academic_year TEXT NOT NULL -- e.g., "2025-2026"
    )
  `);

  // 3. Students
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL, -- Matricule
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      class_id INTEGER,
      FOREIGN KEY (class_id) REFERENCES classes(id)
    )
  `);

  // 4. Courses/Subjects
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL, -- e.g., "CS101"
      name TEXT NOT NULL,
      credits INTEGER NOT NULL,
      semester INTEGER NOT NULL -- 1 or 2
    )
  `);

  // 5. Grades (Performance)
  db.exec(`
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      score REAL NOT NULL, -- 0-20 or 0-100
      type TEXT CHECK(type IN ('exam', 'continuous', 'project')) NOT NULL,
      weight REAL DEFAULT 1.0,
      date_recorded DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )
  `);

  // Seed initial data if empty
  const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    console.log("Seeding initial academic data...");
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync("admin123", salt);
    
    // Admin
    db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run("admin", hash, "admin", "Dr. Alan Turing");
    
    // Classes
    const classResult = db.prepare("INSERT INTO classes (name, academic_year) VALUES (?, ?)").run("L3 Informatique", "2025-2026");
    const classId = classResult.lastInsertRowid;

    // Courses
    const courses = [
      { code: "CS301", name: "Algorithmique Avancée", credits: 6, semester: 1 },
      { code: "CS302", name: "Bases de Données", credits: 6, semester: 1 },
      { code: "CS303", name: "Systèmes d'Exploitation", credits: 4, semester: 1 },
      { code: "MATH301", name: "Probabilités & Stat.", credits: 4, semester: 1 },
      { code: "WEB301", name: "Développement Web", credits: 4, semester: 2 },
    ];
    
    const courseIds: number[] = [];
    const insertCourse = db.prepare("INSERT INTO courses (code, name, credits, semester) VALUES (?, ?, ?, ?)");
    courses.forEach(c => {
      const info = insertCourse.run(c.code, c.name, c.credits, c.semester);
      courseIds.push(Number(info.lastInsertRowid));
    });

    // Students
    const students = [
      { id: "2023001", first: "Ada", last: "Lovelace" },
      { id: "2023002", first: "Grace", last: "Hopper" },
      { id: "2023003", first: "John", last: "von Neumann" },
      { id: "2023004", first: "Claude", last: "Shannon" },
      { id: "2023005", first: "Margaret", last: "Hamilton" },
    ];

    const insertStudent = db.prepare("INSERT INTO students (student_id, first_name, last_name, class_id) VALUES (?, ?, ?, ?)");
    const insertGrade = db.prepare("INSERT INTO grades (student_id, course_id, score, type, weight) VALUES (?, ?, ?, ?, ?)");

    students.forEach(s => {
      const info = insertStudent.run(s.id, s.first, s.last, classId);
      const studentDbId = info.lastInsertRowid;

      // Generate random grades for each course
      courseIds.forEach(cId => {
        // Exam
        insertGrade.run(studentDbId, cId, Math.floor(Math.random() * 10) + 10, 'exam', 0.6); // 10-20 range
        // Continuous
        insertGrade.run(studentDbId, cId, Math.floor(Math.random() * 8) + 12, 'continuous', 0.4); // 12-20 range
      });
    });
  }
}
