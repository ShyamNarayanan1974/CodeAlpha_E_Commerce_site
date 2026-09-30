const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const db = require("../data/db");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register  { name, email, password }
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (!password || password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  if (db.getUserByEmail(email)) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name: name.trim(),
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };
  db.createUser(user);

  req.session.userId = user.id;
  res.status(201).json({ id: user.id, name: user.name, email: user.email.toLowerCase() });
});

// POST /api/auth/login  { email, password }
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  req.session.userId = user.id;
  res.json({ id: user.id, name: user.name, email: user.email });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.userId = null;
  res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.json(null);
  }
  const user = db.getUserById(req.session.userId);
  if (!user) {
    req.session.userId = null;
    return res.json(null);
  }
  res.json(db.toPublicUser(user));
});

module.exports = router;
