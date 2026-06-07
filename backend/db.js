const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.PG_CONNECTION ||
  "postgres://postgres:postgres@localhost:5432/gympro";

let pool = null;
let useJSON = false;
let jsonDB = null;

const DATA_FILE = path.join(__dirname, "data", "db.json");

function loadJSON() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf8");
      jsonDB = JSON.parse(data);
      useJSON = true;
      return true;
    }
  } catch (e) {
    console.warn("Could not load JSON database:", e.message);
  }
  return false;
}

async function query(text, params = []) {
  if (useJSON) {
    // Return mock result for JSON mode
    return { rows: [], rowCount: 0 };
  }
  const result = await pool.query(text, params);
  return result;
}

async function init() {
  // Try PostgreSQL first
  try {
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    await createSchema();
    await seedData();
    console.log("✅ Using PostgreSQL database");
  } catch (error) {
    console.warn(
      "PostgreSQL not available, falling back to JSON:",
      error.message,
    );
    if (loadJSON()) {
      console.log("✅ Using JSON database from backend/data/db.json");
    } else {
      throw new Error(
        "Could not initialize database (neither PostgreSQL nor JSON)",
      );
    }
  }
}

async function createSchema() {
  await query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);

  await query(`CREATE TABLE IF NOT EXISTS membership_plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    duration_days INTEGER NOT NULL DEFAULT 30,
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
  )`);

  await query(`CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    plan_id INTEGER NOT NULL,
    join_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    health_notes TEXT,
    emergency_contact TEXT
  )`);

  await query(`CREATE TABLE IF NOT EXISTS trainers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    speciality TEXT,
    experience_years INTEGER NOT NULL DEFAULT 0,
    certification TEXT,
    hourly_rate NUMERIC NOT NULL DEFAULT 0,
    bio TEXT
  )`);

  await query(`CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    trainer_id INTEGER NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TEXT,
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);

  await query(`CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ NOT NULL,
    check_out TIMESTAMPTZ,
    method TEXT NOT NULL DEFAULT 'manual'
  )`);

  await query(`CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method TEXT NOT NULL DEFAULT 'cash',
    status TEXT NOT NULL DEFAULT 'completed',
    plan_name TEXT,
    receipt_number TEXT
  )`);

  await query(`CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    brand TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    condition_status TEXT NOT NULL DEFAULT 'good',
    last_maintenance DATE,
    next_maintenance DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);

  await query(`CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);

  await query(`CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
  )`);
}

async function seedData() {
  const existing = await query(`SELECT 1 FROM users LIMIT 1`);
  if (existing.rowCount > 0) return;
  if (!fs.existsSync(DATA_FILE)) return;

  const raw = fs.readFileSync(DATA_FILE, "utf8");
  const seed = JSON.parse(raw);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const user of seed.users) {
      await client.query(
        `INSERT INTO users (id, name, email, password, role, phone, is_active, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          user.id,
          user.name,
          user.email,
          user.password,
          user.role,
          user.phone || null,
          user.isActive !== false,
          user.createdAt || new Date().toISOString(),
        ],
      );
    }

    for (const plan of seed.membershipPlans) {
      await client.query(
        `INSERT INTO membership_plans (id, name, type, price, duration_days, features, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          plan.id,
          plan.name,
          plan.type,
          plan.price,
          plan.durationDays,
          JSON.stringify(plan.features || []),
          plan.isActive !== false,
        ],
      );
    }

    for (const member of seed.members) {
      await client.query(
        `INSERT INTO members (id, user_id, plan_name, plan_id, join_date, expiry_date, status, health_notes, emergency_contact)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          member.id,
          member.userId,
          member.planName,
          member.planId,
          member.joinDate,
          member.expiryDate,
          member.status,
          member.healthNotes || null,
          member.emergencyContact || null,
        ],
      );
    }

    for (const trainer of seed.trainers) {
      await client.query(
        `INSERT INTO trainers (id, user_id, speciality, experience_years, certification, hourly_rate, bio)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          trainer.id,
          trainer.userId,
          trainer.speciality || null,
          trainer.experienceYears || 0,
          trainer.certification || null,
          trainer.hourlyRate || 0,
          trainer.bio || null,
        ],
      );
    }

    for (const item of seed.equipment) {
      await client.query(
        `INSERT INTO equipment (id, name, type, brand, quantity, condition_status, last_maintenance, next_maintenance, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          item.id,
          item.name,
          item.type,
          item.brand,
          item.quantity,
          item.conditionStatus,
          item.lastMaintenance || null,
          item.nextMaintenance || null,
          item.createdAt || new Date().toISOString(),
        ],
      );
    }

    for (const session of seed.sessions || []) {
      await client.query(
        `INSERT INTO sessions (id, member_id, trainer_id, date, start_time, end_time, status, notes, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          session.id,
          session.memberId,
          session.trainerId,
          session.date,
          session.startTime || null,
          session.endTime || null,
          session.status || "scheduled",
          session.notes || null,
          session.createdAt || new Date().toISOString(),
        ],
      );
    }

    for (const attendance of seed.attendance || []) {
      await client.query(
        `INSERT INTO attendance (id, member_id, check_in, check_out, method)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          attendance.id,
          attendance.memberId,
          attendance.checkIn,
          attendance.checkOut || null,
          attendance.method || "manual",
        ],
      );
    }

    for (const payment of seed.payments || []) {
      await client.query(
        `INSERT INTO payments (id, member_id, amount, payment_date, payment_method, status, plan_name, receipt_number)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          payment.id,
          payment.memberId,
          payment.amount,
          payment.paymentDate,
          payment.paymentMethod,
          payment.status,
          payment.planName,
          payment.receiptNumber,
        ],
      );
    }

    await client.query(
      `SELECT setval(pg_get_serial_sequence('users','id'), GREATEST((SELECT MAX(id) FROM users), 1), true)`,
    );
    await client.query(
      `SELECT setval(pg_get_serial_sequence('membership_plans','id'), GREATEST((SELECT MAX(id) FROM membership_plans), 1), true)`,
    );
    await client.query(
      `SELECT setval(pg_get_serial_sequence('members','id'), GREATEST((SELECT MAX(id) FROM members), 1), true)`,
    );
    await client.query(
      `SELECT setval(pg_get_serial_sequence('trainers','id'), GREATEST((SELECT MAX(id) FROM trainers), 1), true)`,
    );
    await client.query(
      `SELECT setval(pg_get_serial_sequence('sessions','id'), GREATEST((SELECT MAX(id) FROM sessions), 1), true)`,
    );
    await client.query(
      `SELECT setval(pg_get_serial_sequence('attendance','id'), GREATEST((SELECT MAX(id) FROM attendance), 1), true)`,
    );
    await client.query(
      `SELECT setval(pg_get_serial_sequence('payments','id'), GREATEST((SELECT MAX(id) FROM payments), 1), true)`,
    );
    await client.query(
      `SELECT setval(pg_get_serial_sequence('equipment','id'), GREATEST((SELECT MAX(id) FROM equipment), 1), true)`,
    );
    await client.query(
      `SELECT setval(pg_get_serial_sequence('notifications','id'), GREATEST((SELECT MAX(id) FROM notifications), 1), true)`,
    );
    await client.query(
      `SELECT setval(pg_get_serial_sequence('password_resets','id'), GREATEST((SELECT MAX(id) FROM password_resets), 1), true)`,
    );

    await client.query("COMMIT");
    console.log("✅ PostgreSQL seed data loaded from backend/data/db.json");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getUserByEmail(email) {
  if (useJSON) {
    const user = jsonDB.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    return user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          phone: user.phone,
          isActive: user.isActive !== false,
          createdAt: user.createdAt,
        }
      : null;
  }
  const result = await query(
    `SELECT id, name, email, password, role, phone, is_active as "isActive", created_at as "createdAt"
     FROM users
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email],
  );
  return result.rows[0];
}

async function getUserById(id) {
  const result = await query(
    `SELECT id, name, email, role, phone, is_active as "isActive", created_at as "createdAt"
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id],
  );
  return result.rows[0];
}

async function createUser({ name, email, password, role, phone }) {
  const result = await query(
    `INSERT INTO users (name, email, password, role, phone, is_active, created_at)
     VALUES ($1, $2, $3, $4, $5, true, NOW())
     RETURNING id, name, email, role, phone, is_active as "isActive", created_at as "createdAt"`,
    [name, email, password, role, phone || null],
  );
  return result.rows[0];
}

async function updateUserPassword(userId, hashedPassword) {
  await query(`UPDATE users SET password = $1 WHERE id = $2`, [
    hashedPassword,
    userId,
  ]);
}

async function deactivateUser(userId) {
  await query(`UPDATE users SET is_active = false WHERE id = $1`, [userId]);
}

async function createMemberWithUser({
  name,
  email,
  password,
  phone,
  planName,
  planId,
  healthNotes,
  emergencyContact,
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `INSERT INTO users (name, email, password, role, phone, is_active, created_at)
       VALUES ($1, $2, $3, 'member', $4, true, NOW())
       RETURNING id, name, email, role, phone`,
      [name, email, password, phone || null],
    );
    const user = userResult.rows[0];
    const joinDate = new Date().toISOString().split("T")[0];
    const expiryDate = new Date(Date.now() + 30 * 86400000)
      .toISOString()
      .split("T")[0];

    const memberResult = await client.query(
      `INSERT INTO members (user_id, plan_name, plan_id, join_date, expiry_date, status, health_notes, emergency_contact)
       VALUES ($1, $2, $3, $4, $5, 'active', $6, $7)
       RETURNING id, user_id as "userId", plan_name as "planName", plan_id as "planId",
                 join_date as "joinDate", expiry_date as "expiryDate", status, health_notes as "healthNotes",
                 emergency_contact as "emergencyContact"`,
      [
        user.id,
        planName || "Basic Monthly",
        planId || 1,
        joinDate,
        expiryDate,
        healthNotes || null,
        emergencyContact || null,
      ],
    );
    await client.query("COMMIT");
    return { user, member: memberResult.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function createMemberForExistingUser({
  userId,
  planName,
  planId,
  healthNotes,
  emergencyContact,
}) {
  const joinDate = new Date().toISOString().split("T")[0];
  const expiryDate = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .split("T")[0];
  const result = await query(
    `INSERT INTO members (user_id, plan_name, plan_id, join_date, expiry_date, status, health_notes, emergency_contact)
     VALUES ($1, $2, $3, $4, $5, 'active', $6, $7)
     RETURNING id, user_id as "userId", plan_name as "planName", plan_id as "planId",
               join_date as "joinDate", expiry_date as "expiryDate", status, health_notes as "healthNotes",
               emergency_contact as "emergencyContact"`,
    [
      userId,
      planName || "Basic Monthly",
      planId || 1,
      joinDate,
      expiryDate,
      healthNotes || null,
      emergencyContact || null,
    ],
  );
  return result.rows[0];
}

async function getMembers() {
  if (useJSON) {
    return (jsonDB.members || []).map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name || "Unknown",
      email: m.email || "",
      phone: m.phone || "",
      planName: m.planName,
      planId: m.planId,
      joinDate: m.joinDate,
      expiryDate: m.expiryDate,
      status: m.status,
      healthNotes: m.healthNotes,
      emergencyContact: m.emergencyContact,
    }));
  }
  const result = await query(`
    SELECT m.id,
           m.user_id as "userId",
           u.name,
           u.email,
           u.phone,
           m.plan_name as "planName",
           m.plan_id as "planId",
           m.join_date as "joinDate",
           m.expiry_date as "expiryDate",
           m.status,
           m.health_notes as "healthNotes",
           m.emergency_contact as "emergencyContact"
    FROM members m
    LEFT JOIN users u ON u.id = m.user_id
    ORDER BY m.id
  `);
  return result.rows;
}

async function getMemberById(id) {
  const result = await query(
    `
    SELECT m.id,
           m.user_id as "userId",
           u.name,
           u.email,
           u.phone,
           m.plan_name as "planName",
           m.plan_id as "planId",
           m.join_date as "joinDate",
           m.expiry_date as "expiryDate",
           m.status,
           m.health_notes as "healthNotes",
           m.emergency_contact as "emergencyContact"
    FROM members m
    LEFT JOIN users u ON u.id = m.user_id
    WHERE m.id = $1
    LIMIT 1
  `,
    [id],
  );
  return result.rows[0];
}

async function updateMember(id, updates) {
  const fields = [];
  const values = [];
  const columns = {
    planName: "plan_name",
    planId: "plan_id",
    joinDate: "join_date",
    expiryDate: "expiry_date",
    status: "status",
    healthNotes: "health_notes",
    emergencyContact: "emergency_contact",
  };

  for (const [key, value] of Object.entries(updates)) {
    if (!columns[key]) continue;
    fields.push(`${columns[key]} = $${fields.length + 1}`);
    values.push(value);
  }
  if (!fields.length) return null;

  const result = await query(
    `UPDATE members SET ${fields.join(", ")} WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0];
}

async function updateUserNameAndPhone(userId, name, phone) {
  const fields = [];
  const values = [];
  if (name !== undefined) {
    fields.push(`name = $${fields.length + 1}`);
    values.push(name);
  }
  if (phone !== undefined) {
    fields.push(`phone = $${fields.length + 1}`);
    values.push(phone);
  }
  if (!fields.length) return;
  await query(
    `UPDATE users SET ${fields.join(", ")} WHERE id = $${fields.length + 1}`,
    [...values, userId],
  );
}

async function deleteMember(id) {
  const member = await getMemberById(id);
  if (!member) return null;
  await query("DELETE FROM members WHERE id = $1", [id]);
  await deactivateUser(member.userId);
  return member;
}

async function getTrainers() {
  if (useJSON) {
    return (jsonDB.trainers || []).map((t) => ({
      id: t.id,
      userId: t.userId,
      name: t.name || "Unknown",
      email: t.email || "",
      phone: t.phone || "",
      speciality: t.speciality,
      experienceYears: t.experienceYears || 0,
      certification: t.certification,
      hourlyRate: t.hourlyRate || 0,
      bio: t.bio,
    }));
  }
  const result = await query(`
    SELECT t.id,
           t.user_id as "userId",
           u.name,
           u.email,
           u.phone,
           t.speciality,
           t.experience_years as "experienceYears",
           t.certification,
           t.hourly_rate as "hourlyRate",
           t.bio
    FROM trainers t
    LEFT JOIN users u ON u.id = t.user_id
    ORDER BY t.id
  `);
  return result.rows;
}

async function createTrainerWithUser({
  name,
  email,
  password,
  phone,
  speciality,
  experienceYears,
  certification,
  hourlyRate,
  bio,
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `INSERT INTO users (name, email, password, role, phone, is_active, created_at)
       VALUES ($1, $2, $3, 'trainer', $4, true, NOW())
       RETURNING id, name, email, role, phone`,
      [name, email, password, phone || null],
    );
    const user = userResult.rows[0];
    const trainerResult = await client.query(
      `INSERT INTO trainers (user_id, speciality, experience_years, certification, hourly_rate, bio)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id as "userId", speciality, experience_years as "experienceYears", certification, hourly_rate as "hourlyRate", bio`,
      [
        user.id,
        speciality || null,
        experienceYears || 0,
        certification || null,
        hourlyRate || 0,
        bio || null,
      ],
    );
    await client.query("COMMIT");
    return { user, trainer: trainerResult.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function deleteTrainer(id) {
  const trainerRes = await query(
    `SELECT user_id FROM trainers WHERE id = $1 LIMIT 1`,
    [id],
  );
  if (!trainerRes.rowCount) return null;
  const userId = trainerRes.rows[0].user_id;
  await query(`DELETE FROM trainers WHERE id = $1`, [id]);
  await deactivateUser(userId);
  return { id, userId };
}

async function getPlans() {
  if (useJSON) {
    return (jsonDB.membershipPlans || []).map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      price: p.price,
      durationDays: p.durationDays,
      features: p.features || [],
      isActive: p.isActive !== false,
    }));
  }
  const result = await query(`
    SELECT id, name, type, price, duration_days as "durationDays", features, is_active as "isActive"
    FROM membership_plans
    ORDER BY id
  `);
  return result.rows;
}

async function getSessions() {
  if (useJSON) {
    return (jsonDB.sessions || []).map((s) => ({
      id: s.id,
      memberId: s.memberId,
      trainerId: s.trainerId,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
      notes: s.notes,
      createdAt: s.createdAt,
    }));
  }
  const result = await query(`
    SELECT id, member_id as "memberId", trainer_id as "trainerId", date, start_time as "startTime", end_time as "endTime",
           status, notes, created_at as "createdAt"
    FROM sessions
    ORDER BY id
  `);
  return result.rows;
}

async function createSession({
  memberId,
  trainerId,
  date,
  startTime,
  endTime,
  notes,
}) {
  const result = await query(
    `INSERT INTO sessions (member_id, trainer_id, date, start_time, end_time, status, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, NOW())
     RETURNING id, member_id as "memberId", trainer_id as "trainerId", date, start_time as "startTime", end_time as "endTime", status, notes`,
    [
      memberId,
      trainerId || null,
      date,
      startTime || null,
      endTime || null,
      notes || null,
    ],
  );
  return result.rows[0];
}

async function deleteSession(id) {
  const result = await query(
    `DELETE FROM sessions WHERE id = $1 RETURNING id`,
    [id],
  );
  return result.rows[0];
}

async function getAttendance() {
  if (useJSON) {
    return (jsonDB.attendance || []).map((a) => ({
      id: a.id,
      memberId: a.memberId,
      checkIn: a.checkIn,
      checkOut: a.checkOut,
      method: a.method,
    }));
  }
  const result = await query(`
    SELECT id, member_id as "memberId", check_in as "checkIn", check_out as "checkOut", method
    FROM attendance
    ORDER BY id
  `);
  return result.rows;
}

async function getOpenCheckIn(memberId) {
  const result = await query(
    `SELECT id, member_id as "memberId", check_in as "checkIn", check_out as "checkOut", method
     FROM attendance
     WHERE member_id = $1 AND check_out IS NULL
     LIMIT 1`,
    [memberId],
  );
  return result.rows[0];
}

async function checkIn(memberId, method) {
  const result = await query(
    `INSERT INTO attendance (member_id, check_in, check_out, method)
     VALUES ($1, NOW(), NULL, $2)
     RETURNING id, member_id as "memberId", check_in as "checkIn", check_out as "checkOut", method`,
    [memberId, method || "manual"],
  );
  return result.rows[0];
}

async function checkOut(memberId) {
  const result = await query(
    `UPDATE attendance
     SET check_out = NOW()
     WHERE member_id = $1 AND check_out IS NULL
     RETURNING id, member_id as "memberId", check_in as "checkIn", check_out as "checkOut", method`,
    [memberId],
  );
  return result.rows[0];
}

async function getPayments() {
  if (useJSON) {
    return (jsonDB.payments || []).map((p) => ({
      id: p.id,
      memberId: p.memberId,
      amount: p.amount,
      paymentDate: p.paymentDate,
      paymentMethod: p.paymentMethod,
      status: p.status,
      planName: p.planName,
      receiptNumber: p.receiptNumber,
    }));
  }
  const result = await query(`
    SELECT id, member_id as "memberId", amount, payment_date as "paymentDate", payment_method as "paymentMethod",
           status, plan_name as "planName", receipt_number as "receiptNumber"
    FROM payments
    ORDER BY id
  `);
  return result.rows;
}

async function createPayment({ memberId, amount, planName, paymentMethod }) {
  const insertResult = await query(
    `INSERT INTO payments (member_id, amount, payment_date, payment_method, status, plan_name)
     VALUES ($1, $2, NOW(), $3, 'completed', $4)
     RETURNING id, member_id as "memberId", amount, payment_date as "paymentDate", payment_method as "paymentMethod", status, plan_name as "planName"`,
    [memberId, amount || 0, paymentMethod || "cash", planName || ""],
  );
  const payment = insertResult.rows[0];
  const receipt = `RCP-${String(payment.id).padStart(4, "0")}`;
  await query(`UPDATE payments SET receipt_number = $1 WHERE id = $2`, [
    receipt,
    payment.id,
  ]);
  return { ...payment, receiptNumber: receipt };
}

async function getEquipment() {
  if (useJSON) {
    return (jsonDB.equipment || []).map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      brand: e.brand,
      quantity: e.quantity,
      conditionStatus: e.conditionStatus,
      lastMaintenance: e.lastMaintenance,
      nextMaintenance: e.nextMaintenance,
    }));
  }
  const result = await query(`
    SELECT id, name, type, brand, quantity, condition_status as "conditionStatus",
           last_maintenance as "lastMaintenance", next_maintenance as "nextMaintenance"
    FROM equipment
    ORDER BY id
  `);
  return result.rows;
}

async function createEquipment({
  name,
  type,
  brand,
  quantity,
  conditionStatus,
  nextMaintenance,
}) {
  const result = await query(
    `INSERT INTO equipment (name, type, brand, quantity, condition_status, next_maintenance, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING id, name, type, brand, quantity, condition_status as "conditionStatus", last_maintenance as "lastMaintenance", next_maintenance as "nextMaintenance"`,
    [
      name,
      type || null,
      brand || null,
      quantity || 1,
      conditionStatus || "good",
      nextMaintenance || null,
    ],
  );
  return result.rows[0];
}

async function updateEquipment(id, updates) {
  const fields = [];
  const values = [];
  const columns = {
    name: "name",
    type: "type",
    brand: "brand",
    quantity: "quantity",
    conditionStatus: "condition_status",
    nextMaintenance: "next_maintenance",
    lastMaintenance: "last_maintenance",
  };
  for (const [key, value] of Object.entries(updates)) {
    if (!columns[key]) continue;
    fields.push(`${columns[key]} = $${fields.length + 1}`);
    values.push(value);
  }
  if (!fields.length) return null;
  const result = await query(
    `UPDATE equipment SET ${fields.join(", ")} WHERE id = $${fields.length + 1} RETURNING id, name, type, brand, quantity, condition_status as "conditionStatus", last_maintenance as "lastMaintenance", next_maintenance as "nextMaintenance"`,
    [...values, id],
  );
  return result.rows[0];
}

async function deleteEquipment(id) {
  const result = await query(
    `DELETE FROM equipment WHERE id = $1 RETURNING id`,
    [id],
  );
  return result.rows[0];
}

async function getNotifications(userId) {
  const result = await query(
    `
    SELECT id, title, message, is_read as "isRead", created_at as "createdAt"
    FROM notifications
    WHERE user_id = $1
    ORDER BY id DESC
    LIMIT 20`,
    [userId],
  );
  return result.rows;
}

async function markNotificationRead(id) {
  await query(`UPDATE notifications SET is_read = true WHERE id = $1`, [id]);
}

async function createPasswordReset(userId, token, expiresAt) {
  await query(`DELETE FROM password_resets WHERE user_id = $1`, [userId]);
  await query(
    `INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt],
  );
}

async function getPasswordReset(userId, token) {
  const result = await query(
    `SELECT id, user_id as "userId", token, expires_at as "expiresAt"
     FROM password_resets
     WHERE user_id = $1 AND token = $2
     LIMIT 1`,
    [userId, token],
  );
  return result.rows[0];
}

async function deletePasswordResets(userId) {
  await query(`DELETE FROM password_resets WHERE user_id = $1`, [userId]);
}

async function getDashboardReport() {
  if (useJSON) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const members = jsonDB.members || [];
    const trainers = jsonDB.trainers || [];
    const attendance = jsonDB.attendance || [];
    const payments = jsonDB.payments || [];
    const sessions = jsonDB.sessions || [];
    const equipment = jsonDB.equipment || [];

    const activeMembers = members.filter((m) => m.status === "active").length;
    const todayAttendance = attendance.filter((a) => {
      const d = new Date(a.checkIn);
      return d.toDateString() === today.toDateString();
    }).length;

    const monthlyRevenue = payments
      .filter((p) => {
        const d = new Date(p.paymentDate);
        return d >= startOfMonth && p.status === "completed";
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalRevenue = payments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const activeSessions = sessions.filter((s) =>
      ["scheduled", "confirmed"].includes(s.status),
    ).length;

    const expiringMembers = members.filter((m) => {
      const expiry = new Date(m.expiryDate);
      const inSevenDays = new Date();
      inSevenDays.setDate(inSevenDays.getDate() + 7);
      return expiry <= inSevenDays && expiry >= today && m.status === "active";
    }).length;

    const recentMembers = members.slice(-5).map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name || "Unknown",
      email: m.email || "",
      planName: m.planName,
      status: m.status,
    }));

    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("default", { month: "short" });
      const monthRevenue = payments
        .filter((p) => {
          const pd = new Date(p.paymentDate);
          return (
            pd.getMonth() === d.getMonth() &&
            pd.getFullYear() === d.getFullYear() &&
            p.status === "completed"
          );
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      revenueByMonth.push({ month: label, revenue: monthRevenue });
    }

    return {
      totalMembers: activeMembers,
      totalTrainers: trainers.length,
      todayAttendance,
      monthlyRevenue,
      totalRevenue,
      activeSessions,
      expiringMemberships: expiringMembers,
      totalEquipment: equipment.length,
      recentMembers,
      revenueByMonth,
    };
  }

  const today = new Date();
  const startOfMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
  ).toISOString();

  const [
    totalMembersRes,
    totalTrainersRes,
    todayAttendanceRes,
    monthlyRevenueRes,
    totalRevenueRes,
    activeSessionsRes,
    expiringRes,
    equipmentRes,
    recentMembersRes,
  ] = await Promise.all([
    query(`SELECT COUNT(*) FROM members WHERE status = 'active'`),
    query(`SELECT COUNT(*) FROM trainers`),
    query(
      `SELECT COUNT(*) FROM attendance WHERE DATE(check_in) = CURRENT_DATE`,
    ),
    query(
      `SELECT COALESCE(SUM(amount),0) as sum FROM payments WHERE status = 'completed' AND DATE(payment_date) >= $1`,
      [startOfMonth],
    ),
    query(
      `SELECT COALESCE(SUM(amount),0) as sum FROM payments WHERE status = 'completed'`,
    ),
    query(
      `SELECT COUNT(*) FROM sessions WHERE status IN ('scheduled', 'confirmed')`,
    ),
    query(
      `SELECT COUNT(*) FROM members WHERE expiry_date <= CURRENT_DATE + INTERVAL '7 days' AND expiry_date >= CURRENT_DATE`,
    ),
    query(`SELECT COUNT(*) FROM equipment`),
    query(`
      SELECT m.id,
             m.user_id as "userId",
             u.name,
             u.email,
             m.plan_name as "planName",
             m.status
      FROM members m
      LEFT JOIN users u ON u.id = m.user_id
      ORDER BY m.id DESC
      LIMIT 5
    `),
  ]);

  const revenueByMonth = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString("default", { month: "short" });
    const res = await query(
      `SELECT COALESCE(SUM(amount),0) as sum FROM payments WHERE status = 'completed' AND EXTRACT(MONTH FROM payment_date) = $1 AND EXTRACT(YEAR FROM payment_date) = $2`,
      [d.getMonth() + 1, d.getFullYear()],
    );
    revenueByMonth.push({ month: label, revenue: Number(res.rows[0].sum) });
  }

  return {
    totalMembers: Number(totalMembersRes.rows[0].count),
    totalTrainers: Number(totalTrainersRes.rows[0].count),
    todayAttendance: Number(todayAttendanceRes.rows[0].count),
    monthlyRevenue: Number(monthlyRevenueRes.rows[0].sum),
    totalRevenue: Number(totalRevenueRes.rows[0].sum),
    activeSessions: Number(activeSessionsRes.rows[0].count),
    expiringMemberships: Number(expiringRes.rows[0].count),
    totalEquipment: Number(equipmentRes.rows[0].count),
    recentMembers: recentMembersRes.rows,
    revenueByMonth,
  };
}

module.exports = {
  init,
  getUserByEmail,
  getUserById,
  createUser,
  updateUserPassword,
  deactivateUser,
  createMemberWithUser,
  createMemberForExistingUser,
  getMembers,
  getMemberById,
  updateMember,
  updateUserNameAndPhone,
  deleteMember,
  getTrainers,
  createTrainerWithUser,
  deleteTrainer,
  getPlans,
  getSessions,
  createSession,
  deleteSession,
  getAttendance,
  getOpenCheckIn,
  checkIn,
  checkOut,
  getPayments,
  createPayment,
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getNotifications,
  markNotificationRead,
  createPasswordReset,
  getPasswordReset,
  deletePasswordResets,
  getDashboardReport,
};
