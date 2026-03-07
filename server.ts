import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const db = new Database("fintrack.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    preferred_currency TEXT DEFAULT 'USD'
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    category TEXT,
    date TEXT,
    time TEXT,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    receipt_url TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category TEXT,
    amount REAL,
    month TEXT,
    expiryDate TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, category, month)
  );

  CREATE TABLE IF NOT EXISTS income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    source TEXT,
    date TEXT,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Migration for existing tables
  PRAGMA table_info(users);
  -- We'll check if columns exist before adding them in a real app, 
  -- but here we can try to add them and ignore errors or use a try-catch pattern if needed.
  -- For better-sqlite3, we can just run them and they might fail if column exists.
  -- A safer way is to check first.
`);

// Migration helper
try {
  db.prepare("ALTER TABLE users ADD COLUMN preferred_currency TEXT DEFAULT 'USD'").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE expenses ADD COLUMN time TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE expenses ADD COLUMN currency TEXT DEFAULT 'USD'").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE budgets ADD COLUMN expiryDate TEXT").run();
} catch (e) {}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Middleware (Simple for demo)
  const auth = (req: any, res: any, next: any) => {
    console.log("Auth middleware: checking headers", req.headers);
    const userIdHeader = req.headers["x-user-id"];
    const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;
    if (!userId) {
      console.log("Auth middleware: no userId found");
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const userIdNum = Number(userId);
    if (isNaN(userIdNum)) {
      console.log("Auth middleware: invalid userId", userId);
      return res.status(401).json({ error: "Unauthorized - Invalid User ID" });
    }
    
    // Verify user exists
    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(userIdNum);
    if (!user) {
      console.log("Auth middleware: user not found", userIdNum);
      return res.status(401).json({ error: "Unauthorized - User not found" });
    }
    
    req.userId = userIdNum;
    next();
  };

  // API Routes
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    
    if (!user) {
      // Auto-register for demo purposes if user doesn't exist
      const result = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)").run(email, password, email.split('@')[0]);
      user = { id: result.lastInsertRowid, email, name: email.split('@')[0] };
    }
    
    res.json({ user: { id: user.id, email: user.email, name: user.name, preferred_currency: user.preferred_currency } });
  });

  app.post("/api/user/settings", auth, (req: any, res) => {
    const { preferred_currency } = req.body;
    db.prepare("UPDATE users SET preferred_currency = ? WHERE id = ?").run(preferred_currency, req.userId);
    res.json({ success: true });
  });

  app.get("/api/expenses", auth, (req: any, res) => {
    const expenses = db.prepare("SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, time DESC").all(req.userId);
    res.json(expenses);
  });

  app.post("/api/expenses", auth, (req: any, res) => {
    const { amount, category, date, time, currency, notes, receipt_url } = req.body;
    const result = db.prepare(`
      INSERT INTO expenses (user_id, amount, category, date, time, currency, notes, receipt_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.userId, amount, category, date, time, currency, notes, receipt_url);
    
    const newExpense = db.prepare("SELECT * FROM expenses WHERE id = ?").get(result.lastInsertRowid);
    res.json(newExpense);
  });

  app.get("/api/budgets", auth, (req: any, res) => {
    const budgets = db.prepare("SELECT * FROM budgets WHERE user_id = ?").all(req.userId);
    res.json(budgets);
  });

  app.get("/api/income", auth, (req: any, res) => {
    const income = db.prepare("SELECT * FROM income WHERE user_id = ? ORDER BY date DESC").all(req.userId);
    res.json(income);
  });

  app.post("/api/income", auth, (req: any, res) => {
    const { amount, source, date, currency, notes } = req.body;
    const result = db.prepare(`
      INSERT INTO income (user_id, amount, source, date, currency, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.userId, amount, source, date, currency, notes);
    
    const newIncome = db.prepare("SELECT * FROM income WHERE id = ?").get(result.lastInsertRowid);
    res.json(newIncome);
  });

  app.post("/api/budgets", auth, (req: any, res) => {
    const { category, amount, month, expiryDate } = req.body;
    console.log("POST /api/budgets received:", { userId: req.userId, category, amount, month, expiryDate });
    const result = db.prepare(`
      INSERT OR REPLACE INTO budgets (user_id, category, amount, month, expiryDate)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.userId, category, amount, month, expiryDate);
    
    const newBudget = db.prepare("SELECT * FROM budgets WHERE user_id = ? AND category = ? AND month = ?").get(req.userId, category, month);
    res.json(newBudget);
  });

  app.delete("/api/expenses/:id", auth, (req: any, res) => {
    db.prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    res.json({ success: true });
  });

  app.delete("/api/budgets/:id", auth, (req: any, res) => {
    db.prepare("DELETE FROM budgets WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
