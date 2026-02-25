import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../db";

const router = Router();
const SECRET_KEY = "academic_secret_key_change_in_production";

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const db = getDb();
  
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
  
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, role: user.role, name: user.full_name }, SECRET_KEY, { expiresIn: "8h" });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.full_name } });
});

export default router;
