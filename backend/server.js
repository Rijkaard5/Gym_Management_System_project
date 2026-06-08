/**
 * ╔══════════════════════════════════════════════╗
 * ║       🏋️  GYMPRO MANAGEMENT SYSTEM v2       ║
 * ║   PostgreSQL-backed Express API            ║
 * ╚══════════════════════════════════════════════╝
 */

const fs = require("fs");
const path = require("path");

// Load .env manually before DB initialization.
try {
  const envFile = path.join(__dirname, ".env");
  if (fs.existsSync(envFile)) {
    fs.readFileSync(envFile, "utf8")
      .split("\n")
      .forEach((line) => {
        const [key, ...vals] = line.split("=");
        if (key && key.trim() && !key.startsWith("#")) {
          process.env[key.trim()] = vals.join("=").trim();
        }
      });
  }
} catch (e) {
  console.warn("Unable to load .env file", e.message);
}

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "gympro-secret-2024";

app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "null",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : header;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.getUserById(decoded.id);
    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, error: "User not found or deactivated" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired token" });
  }
};

const role =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires: ${roles.join(" or ")}`,
      });
    }
    next();
  };

function createJwt(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "24h",
  });
}

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Email and password required" });
  }

  try {
    const user = await db.getUserByEmail(email);
    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }

    const token = createJwt(user);
    res.json({ success: true, message: "Login successful", token, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role: userRole, phone } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Name, email, password required" });
  }

  try {
    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res
        .status(400)
        .json({ success: false, error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.createUser({
      name,
      email,
      password: hashed,
      role: userRole || "member",
      phone,
    });

    if (user.role === "member") {
      await db.createMemberForExistingUser({
        userId: user.id,
        planName: "Basic Monthly",
        planId: 1,
        healthNotes: "",
        emergencyContact: "",
      });
    }

    const token = createJwt(user);
    res
      .status(201)
      .json({ success: true, message: "Registration successful", token, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/auth/me", auth, async (req, res) => {
  res.json({ success: true, user: req.user });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: "Email required" });
  }

  try {
    const user = await db.getUserByEmail(email);
    if (user) {
      const token =
        Math.random().toString(36).slice(2, 10).toUpperCase() +
        Math.random().toString(36).slice(2, 6).toUpperCase();
      const expiresAt = new Date(Date.now() + 60 * 60000).toISOString();
      await db.createPasswordReset(user.id, token, expiresAt);
      console.log(`\n🔑 PASSWORD RESET TOKEN for ${email}: ${token}\n`);
    }

    res.json({
      success: true,
      message:
        "If this email exists, a reset token has been generated. Check the server console for the token.",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res
      .status(400)
      .json({
        success: false,
        error: "Email, token, and new password required",
      });
  }

  try {
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid reset attempt" });
    }

    const reset = await db.getPasswordReset(user.id, token.toUpperCase());
    if (!reset) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid or already-used reset token" });
    }
    if (new Date(reset.expiresAt) < new Date()) {
      return res
        .status(400)
        .json({ success: false, error: "Reset token has expired" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.updateUserPassword(user.id, hashed);
    await db.deletePasswordResets(user.id);

    res.json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/auth/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ success: false, error: "All fields required" });
  }

  try {
    const user = await db.getUserByEmail(req.user.email);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res
        .status(400)
        .json({ success: false, error: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.updateUserPassword(req.user.id, hashed);
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/members", auth, async (req, res) => {
  try {
    const data = await db.getMembers();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post(
  "/api/members",
  auth,
  role("admin", "receptionist"),
  async (req, res) => {
    const {
      name,
      email,
      password,
      phone,
      planId,
      emergencyContact,
      healthNotes,
    } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Name, email and password required" });
    }

    try {
      const existing = await db.getUserByEmail(email);
      if (existing) {
        return res
          .status(400)
          .json({ success: false, error: "Email already exists" });
      }
      const hashed = await bcrypt.hash(password, 10);
      const payload = {
        name,
        email,
        password: hashed,
        phone,
        planId: planId || 1,
        emergencyContact,
        healthNotes,
      };
      const { user, member } = await db.createMemberWithUser(payload);
      res
        .status(201)
        .json({
          success: true,
          message: "Member added successfully",
          data: {
            ...member,
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
        });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

app.put(
  "/api/members/:id",
  auth,
  role("admin", "receptionist"),
  async (req, res) => {
    try {
      const updates = {};
      if (req.body.status !== undefined) updates.status = req.body.status;
      if (req.body.planName !== undefined) updates.planName = req.body.planName;
      if (req.body.planId !== undefined) updates.planId = req.body.planId;
      const updated = await db.updateMember(req.params.id, updates);
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: "Member not found" });
      }
      if (req.body.name && req.body.phone) {
        await db.updateUserNameAndPhone(
          updated.userId,
          req.body.name,
          req.body.phone,
        );
      }
      res.json({ success: true, message: "Member updated", data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

app.delete("/api/members/:id", auth, role("admin"), async (req, res) => {
  try {
    const deleted = await db.deleteMember(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, error: "Member not found" });
    }
    res.json({ success: true, message: "Member removed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/members/me/plan", auth, role("member"), async (req, res) => {
  const { planId } = req.body;
  if (!planId) {
    return res.status(400).json({ success: false, error: "planId is required" });
  }
  try {
    const member = await db.getMemberByUserId(req.user.id);
    if (!member) {
      return res
        .status(404)
        .json({ success: false, error: "Membership not found" });
    }
    const plan = await db.getPlanById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }
    const joinDate = new Date();
    const expiryDate = new Date(joinDate);
    expiryDate.setDate(expiryDate.getDate() + (plan.durationDays || 30));
    const updated = await db.updateMember(member.id, {
      planName: plan.name,
      planId: plan.id,
      joinDate: joinDate.toISOString().slice(0, 10),
      expiryDate: expiryDate.toISOString().slice(0, 10),
      status: "active",
    });
    res.json({ success: true, message: "Plan booked", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/trainers", auth, async (req, res) => {
  try {
    const data = await db.getTrainers();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/trainers", auth, role("admin"), async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    speciality,
    experienceYears,
    certification,
    hourlyRate,
    bio,
  } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Name, email and password required" });
  }

  try {
    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res
        .status(400)
        .json({ success: false, error: "Email already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const { trainer } = await db.createTrainerWithUser({
      name,
      email,
      password: hashed,
      phone,
      speciality,
      experienceYears,
      certification,
      hourlyRate,
      bio,
    });
    res
      .status(201)
      .json({ success: true, message: "Trainer added", data: trainer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/trainers/:id", auth, role("admin"), async (req, res) => {
  try {
    const deleted = await db.deleteTrainer(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, error: "Trainer not found" });
    }
    res.json({ success: true, message: "Trainer removed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/plans", async (req, res) => {
  try {
    const data = await db.getPlans();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/plans", auth, role("admin"), async (req, res) => {
  const { name, type, price, durationDays, features } = req.body;
  if (!name || !type) {
    return res
      .status(400)
      .json({ success: false, error: "Name and type are required" });
  }
  try {
    const plan = await db.createPlan({ name, type, price, durationDays, features });
    res.status(201).json({ success: true, message: "Plan created", data: plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/plans/:id", auth, role("admin"), async (req, res) => {
  try {
    const plan = await db.updatePlan(req.params.id, req.body);
    if (!plan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }
    res.json({ success: true, message: "Plan updated", data: plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/plans/:id", auth, role("admin"), async (req, res) => {
  try {
    const deleted = await db.deletePlan(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }
    res.json({ success: true, message: "Plan removed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/sessions", auth, async (req, res) => {
  try {
    const data = await db.getSessions();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/sessions", auth, async (req, res) => {
  const { memberId, trainerId, date, startTime, endTime, notes } = req.body;
  try {
    const session = await db.createSession({
      memberId,
      trainerId,
      date,
      startTime,
      endTime,
      notes,
    });
    res
      .status(201)
      .json({ success: true, message: "Session booked", data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/sessions/:id", auth, async (req, res) => {
  try {
    const deleted = await db.deleteSession(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, error: "Session not found" });
    }
    res.json({ success: true, message: "Session cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/attendance", auth, async (req, res) => {
  try {
    const data = await db.getAttendance();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/attendance/check-in", auth, async (req, res) => {
  const { memberId, method } = req.body;
  try {
    const open = await db.getOpenCheckIn(memberId);
    if (open) {
      return res
        .status(400)
        .json({ success: false, error: "Member already checked in" });
    }
    const record = await db.checkIn(memberId, method);
    res.json({ success: true, message: "Checked in", data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/attendance/check-out", auth, async (req, res) => {
  const { memberId } = req.body;
  try {
    const record = await db.checkOut(memberId);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, error: "No active check-in found" });
    }
    res.json({ success: true, message: "Checked out", data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/payments", auth, async (req, res) => {
  try {
    const data = await db.getPayments();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/payments", auth, async (req, res) => {
  const { memberId, amount, planName, paymentMethod } = req.body;
  try {
    const payment = await db.createPayment({
      memberId,
      amount,
      planName,
      paymentMethod,
    });
    res
      .status(201)
      .json({ success: true, message: "Payment recorded", data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/equipment", auth, async (req, res) => {
  try {
    const data = await db.getEquipment();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/equipment", auth, role("admin"), async (req, res) => {
  const { name, type, brand, quantity, conditionStatus, nextMaintenance } =
    req.body;
  if (!name) {
    return res
      .status(400)
      .json({ success: false, error: "Equipment name required" });
  }

  try {
    const item = await db.createEquipment({
      name,
      type,
      brand,
      quantity,
      conditionStatus,
      nextMaintenance,
    });
    res
      .status(201)
      .json({ success: true, message: "Equipment added", data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/equipment/:id", auth, role("admin"), async (req, res) => {
  try {
    const updated = await db.updateEquipment(req.params.id, {
      name: req.body.name,
      type: req.body.type,
      brand: req.body.brand,
      quantity: req.body.quantity,
      conditionStatus: req.body.conditionStatus,
      lastMaintenance: req.body.lastMaintenance,
      nextMaintenance: req.body.nextMaintenance,
    });
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, error: "Equipment not found" });
    }
    res.json({ success: true, message: "Equipment updated", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/equipment/:id", auth, role("admin"), async (req, res) => {
  try {
    const deleted = await db.deleteEquipment(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, error: "Equipment not found" });
    }
    res.json({ success: true, message: "Equipment removed" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/notifications", auth, async (req, res) => {
  try {
    const data = await db.getNotifications(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/notifications/:id/read", auth, async (req, res) => {
  try {
    await db.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/reports/dashboard", auth, async (req, res) => {
  try {
    const data = await db.getDashboardReport();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("*", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

(async () => {
  try {
    await db.init();
    app.listen(PORT, () => {
      console.log(`✅ GymPro backend started on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend", error);
    process.exit(1);
  }
})();
