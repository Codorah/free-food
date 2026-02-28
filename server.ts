import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.VERCEL ? path.join("/tmp", "freefood.db") : "freefood.db";
const db = new Database(dbPath);

const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    date TEXT NOT NULL,
    time TEXT,
    type TEXT,
    food_certainty TEXT DEFAULT 'unknown',
    description TEXT,
    poster_url TEXT,
    reporter_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    user_email TEXT,
    FOREIGN KEY(event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    user_email TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    user_email TEXT,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed database from JSON if empty
const eventCount = db.prepare("SELECT COUNT(*) as count FROM events").get() as { count: number };
if (eventCount.count === 0) {
  const possiblePaths = [
    path.join(__dirname, "src", "data", "initial_events.json"),
    path.join(__dirname, "data", "initial_events.json"),
    path.join(process.cwd(), "src", "data", "initial_events.json")
  ];

  let jsonPath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      jsonPath = p;
      break;
    }
  }

  if (jsonPath) {
    const initialData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const insert = db.prepare(`
      INSERT INTO events (name, location, latitude, longitude, date, time, type, food_certainty, description, poster_url, reporter_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const event of initialData) {
      insert.run(
        event.name,
        event.location,
        event.latitude,
        event.longitude,
        event.date,
        event.time,
        event.type,
        event.food_certainty,
        event.description,
        event.poster_url,
        event.reporter_email
      );
    }
    console.log(`Seeded ${initialData.length} events from JSON.`);
  }
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use('/uploads', express.static(uploadDir));

  // API Routes
  app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });
  app.get("/api/events", (req, res) => {
    const events = db.prepare(`
      SELECT e.*, 
      (SELECT COUNT(*) FROM participants WHERE event_id = e.id) as participant_count
      FROM events e 
      ORDER BY date ASC
    `).all();
    res.json(events);
  });

  app.get("/api/events/:id", (req, res) => {
    const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const participants = db.prepare("SELECT user_email FROM participants WHERE event_id = ?").all(req.params.id);
    const comments = db.prepare("SELECT * FROM comments WHERE event_id = ? ORDER BY created_at DESC").all(req.params.id);

    res.json({ ...event, participants, comments });
  });

  app.post("/api/events", (req, res) => {
    const { name, location, latitude, longitude, date, time, type, food_certainty, description, poster_url, reporter_email } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO events (name, location, latitude, longitude, date, time, type, food_certainty, description, poster_url, reporter_email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        name,
        location,
        latitude,
        longitude,
        date,
        time,
        type || 'Divers',
        food_certainty || 'unknown',
        description ?? null,
        poster_url ?? null,
        reporter_email ?? null
      );
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      console.error("Save Event Error:", err);
      res.status(500).json({ error: "Failed to save event", details: err.message });
    }
  });

  app.post("/api/events/:id/join", (req, res) => {
    const { user_email } = req.body;
    const event_id = req.params.id;

    const existing = db.prepare("SELECT id FROM participants WHERE event_id = ? AND user_email = ?").get(event_id, user_email);
    if (existing) return res.json({ success: true, message: "Already joined" });

    db.prepare("INSERT INTO participants (event_id, user_email) VALUES (?, ?)").run(event_id, user_email);
    res.json({ success: true });
  });

  app.post("/api/events/:id/comments", (req, res) => {
    const { user_email, content } = req.body;
    const event_id = req.params.id;
    db.prepare("INSERT INTO comments (event_id, user_email, content) VALUES (?, ?, ?)").run(event_id, user_email, content);
    res.json({ success: true });
  });

  app.post("/api/events/:id/report", (req, res) => {
    const { user_email, reason } = req.body;
    const event_id = req.params.id;
    db.prepare("INSERT INTO reports (event_id, user_email, reason) VALUES (?, ?, ?)").run(event_id, user_email, reason);
    res.json({ success: true });
  });

  // Chat Routes
  app.get("/api/chat", (req, res) => {
    const messages = db.prepare("SELECT * FROM chat_messages ORDER BY created_at ASC LIMIT 100").all();
    res.json(messages);
  });

  app.post("/api/chat", (req, res) => {
    const { user_email, content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });
    db.prepare("INSERT INTO chat_messages (user_email, content) VALUES (?, ?)").run(user_email, content);
    res.json({ success: true });
  });

  // Catch-all for undefined API routes to prevent falling through to the SPA index.html
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  // Global error handler for API routes to avoid returning Express default HTML error pages
  app.use("/api", (err: any, req: any, res: any, next: any) => {
    console.error("API Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  return app;
}

const appPromise = createServer();

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  appPromise.then(app => {
    app.listen(3000, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:3000`);
    });
  });
}

export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
