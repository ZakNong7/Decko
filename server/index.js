const express = require("express");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const db = require("./config/db");
const { getBoardContext, canEditCards } = require("./middleware/permissions");

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);
app.use(express.json());
app.set("io", io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Authentication required"));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(new Error("Invalid token"));
    }
    socket.user = user;
    next();
  });
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id, socket.user?.username);

  // Auto-join user room untuk pengiriman notifikasi personal secara real-time
  if (socket.user && socket.user.id) {
    socket.join(`user-${socket.user.id}`);
  }

  socket.on("join-board", async (boardId) => {
    try {
      const ctx = await getBoardContext(socket.user.id, String(boardId));
      if (!ctx) {
        socket.emit("error", { message: "Board access denied" });
        return;
      }
      socket.join(`board-${boardId}`);
      console.log(`User ${socket.user.username} joined board: ${boardId}`);
    } catch (err) {
      console.error("join-board error:", err);
      socket.emit("error", { message: "Failed to join board" });
    }
  });

  socket.on("card-moved", async (data) => {
    try {
      const ctx = await getBoardContext(socket.user.id, String(data.boardId));
      if (!ctx || !canEditCards(ctx.role)) {
        socket.emit("error", { message: "Insufficient permissions" });
        return;
      }
      socket.to(`board-${data.boardId}`).emit("card-update", data);
    } catch (err) {
      console.error("card-moved error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.get("/", (req, res) => {
  res.send("Decko API is running");
});

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "healthy", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "unhealthy", database: "disconnected", error: err.message });
  }
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/workspaces", require("./routes/workspaces"));
app.use("/api/boards", require("./routes/boards"));
app.use("/api/cards", require("./routes/cards"));
app.use("/api/cards/:cardId/attachments", require("./routes/attachments"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/recurring-tasks", require("./routes/recurring"));
app.use("/api/profile", require("./routes/profile"));

const PORT = process.env.PORT || 5001;

async function ensureSchemaCompatibility() {
  const fs = require("fs");

  // 1. Jika database masih kosong/baru, inisialisasi schema.sql dasar
  try {
    const checkUsersTable = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'",
    );
    if (checkUsersTable.rows.length === 0) {
      console.log("[-] Database baru/kosong terdeteksi. Menginisialisasi schema dasar...");
      const baseSchemaSql = fs.readFileSync(path.resolve(__dirname, "models/schema.sql"), "utf8");
      await db.query(baseSchemaSql);
      console.log("[✓] Schema dasar Decko berhasil diinisialisasi otomatis!");
    }
  } catch (initErr) {
    console.error("Gagal inisialisasi schema dasar:", initErr.message);
  }

  await db.query(
    "ALTER TABLE lists ADD COLUMN IF NOT EXISTS is_final BOOLEAN NOT NULL DEFAULT FALSE",
  );
  await db.query(
    "ALTER TABLE cards ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#0095ff'",
  );
  await db.query(
    "ALTER TABLE labels ADD COLUMN IF NOT EXISTS workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE",
  );

  await db.query(
    "ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_priority_check",
  );
  await db.query(
    "ALTER TABLE cards ADD CONSTRAINT cards_priority_check CHECK (priority IN ('Low', 'Medium', 'High', 'Rendah', 'Sedang', 'Tinggi'))",
  );

  await db.query(
    "ALTER TABLE workspace_members DROP CONSTRAINT IF EXISTS workspace_members_role_check",
  );
  await db.query(
    "UPDATE workspace_members SET role = 'Owner' WHERE LOWER(role) = 'owner'",
  );
  await db.query(
    "UPDATE workspace_members SET role = 'Admin' WHERE LOWER(role) = 'admin'",
  );
  await db.query(
    "UPDATE workspace_members SET role = 'Member' WHERE LOWER(role) = 'member'",
  );
  await db.query(
    "UPDATE workspace_members SET role = 'Observer' WHERE LOWER(role) = 'observer'",
  );
  await db.query(
    "UPDATE workspace_members wm SET role = 'Owner' FROM workspaces w WHERE w.id = wm.workspace_id AND w.owner_id = wm.user_id AND wm.role <> 'Owner'",
  );
  await db.query(
    "ALTER TABLE workspace_members ADD CONSTRAINT workspace_members_role_check CHECK (role IN ('Owner', 'Admin', 'Member', 'Observer'))",
  );
  await db.query(
    "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS invitation_code VARCHAR(10) UNIQUE",
  );

  // Performance Optimization: Database Indexes
  await db.query("CREATE INDEX IF NOT EXISTS idx_boards_workspace_id ON boards(workspace_id)");
  await db.query("CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id)");
  await db.query("CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id)");
  await db.query("CREATE INDEX IF NOT EXISTS idx_comments_card_id ON comments(card_id)");
  await db.query("CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id)");
  await db.query("ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP");
  await db.query("ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE");
  await db.query("ALTER TABLE cards ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE");
  await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE");
  await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT");
  await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMP WITH TIME ZONE");

  // Proyek 2 Database Migration Skema (auth_tokens, card_attachments, notifications, recurring_tasks, users ext)
  try {
    const fs = require("fs");
    const migrationPath = path.resolve(__dirname, "models/proyek2_migration.sql");
    if (fs.existsSync(migrationPath)) {
      const migrationSql = fs.readFileSync(migrationPath, "utf8");
      await db.query(migrationSql);
    }
  } catch (migrationErr) {
    console.error("Proyek 2 migration error:", migrationErr.message);
  }
}

ensureSchemaCompatibility()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Schema compatibility check failed:", error);
    process.exit(1);
  });
