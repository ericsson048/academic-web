import { Router } from "express";
import { getDb } from "../db";

const router = Router();

// --- Classes ---
router.get("/classes", (req, res) => {
  const db = getDb();
  const classes = db.prepare("SELECT * FROM classes").all();
  res.json(classes);
});

// --- Students ---
router.get("/students", (req, res) => {
  const db = getDb();
  const students = db.prepare(`
    SELECT s.*, c.name as class_name 
    FROM students s 
    LEFT JOIN classes c ON s.class_id = c.id
  `).all();
  res.json(students);
});

router.post("/students", (req, res) => {
  const { student_id, first_name, last_name, class_id } = req.body;
  const db = getDb();
  try {
    const info = db.prepare("INSERT INTO students (student_id, first_name, last_name, class_id) VALUES (?, ?, ?, ?)").run(student_id, first_name, last_name, class_id);
    res.json({ id: info.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Courses ---
router.get("/courses", (req, res) => {
  const db = getDb();
  const courses = db.prepare("SELECT * FROM courses").all();
  res.json(courses);
});

// --- Grades & Analytics ---
router.get("/analytics/overview", (req, res) => {
  const db = getDb();
  
  // Calculate average per course
  const coursePerformance = db.prepare(`
    SELECT c.code, c.name, AVG(g.score) as average_score
    FROM grades g
    JOIN courses c ON g.course_id = c.id
    GROUP BY c.id
  `).all();

  // Calculate student distribution (e.g., <10, 10-14, 14-16, >16)
  // This is a simplified "final grade" approximation (avg of all grades)
  const studentAverages = db.prepare(`
    SELECT s.id, AVG(g.score) as final_avg
    FROM students s
    JOIN grades g ON s.id = g.student_id
    GROUP BY s.id
  `).all() as { final_avg: number }[];

  const distribution = {
    failed: studentAverages.filter(s => s.final_avg < 10).length,
    pass: studentAverages.filter(s => s.final_avg >= 10 && s.final_avg < 14).length,
    good: studentAverages.filter(s => s.final_avg >= 14 && s.final_avg < 16).length,
    excellent: studentAverages.filter(s => s.final_avg >= 16).length,
  };

  res.json({
    coursePerformance,
    distribution,
    totalStudents: studentAverages.length
  });
});

router.get("/grades/student/:id", (req, res) => {
  const db = getDb();
  const grades = db.prepare(`
    SELECT g.*, c.code, c.name as course_name, c.credits
    FROM grades g
    JOIN courses c ON g.course_id = c.id
    WHERE g.student_id = ?
  `).all(req.params.id);
  res.json(grades);
});

router.post("/grades", (req, res) => {
  const { student_id, course_id, score, type, weight } = req.body;
  const db = getDb();
  try {
    const info = db.prepare("INSERT INTO grades (student_id, course_id, score, type, weight) VALUES (?, ?, ?, ?, ?)").run(student_id, course_id, score, type, weight || 1.0);
    res.json({ id: info.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
