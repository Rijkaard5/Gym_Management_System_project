/**
 * ╔══════════════════════════════════════════════╗
 * ║       🏋️  GYMPRO MANAGEMENT SYSTEM v2       ║
 * ║   Persistent JSON Storage — No MySQL needed  ║
 * ╚══════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');

// Load .env manually (no dotenv package required)
try {
    const envFile = path.join(__dirname, '.env');
    if (fs.existsSync(envFile)) {
        fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
            const [key, ...vals] = line.split('=');
            if (key && key.trim() && !key.startsWith('#')) {
                process.env[key.trim()] = vals.join('=').trim();
            }
        });
    }
} catch (e) {}

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'gympro-secret-2024';

// ============================================
// PERSISTENT JSON DATABASE
// ============================================
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'db.json');

function loadDB() {
    if (!fs.existsSync(DB_FILE)) return null;
    try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
    catch (e) { return null; }
}

function saveDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// Initialize or load database
let db = loadDB();
if (!db) {
    const adminPwd   = bcrypt.hashSync('admin123',   10);
    const trainerPwd = bcrypt.hashSync('trainer123', 10);
    const memberPwd  = bcrypt.hashSync('member123',  10);

    db = {
        users: [
            { id: 1, name: 'Admin User',  email: 'admin@gympro.com',   password: adminPwd,   role: 'admin',   phone: '1234567890', isActive: true, createdAt: new Date().toISOString() },
            { id: 2, name: 'Mike Johnson',email: 'trainer@gympro.com', password: trainerPwd, role: 'trainer', phone: '1234567891', isActive: true, createdAt: new Date().toISOString() },
            { id: 3, name: 'John Doe',    email: 'member@gympro.com',  password: memberPwd,  role: 'member',  phone: '1234567892', isActive: true, createdAt: new Date().toISOString() }
        ],
        members: [
            { id: 1, userId: 3, planName: 'Premium Monthly', planId: 2, joinDate: '2024-01-01', expiryDate: '2026-12-31', status: 'active', healthNotes: '', emergencyContact: '' }
        ],
        trainers: [
            { id: 1, userId: 2, speciality: 'Strength Training', experienceYears: 5, certification: 'NASM-CPT', hourlyRate: 50, bio: 'Experienced strength and conditioning coach' }
        ],
        membershipPlans: [
            { id: 1, name: 'Basic Monthly',   type: 'monthly',   price: 29.99,  durationDays: 30,  features: ['Gym Access','Locker Room'], isActive: true },
            { id: 2, name: 'Premium Monthly', type: 'monthly',   price: 49.99,  durationDays: 30,  features: ['Gym Access','Classes','Locker Room','Pool Access'], isActive: true },
            { id: 3, name: 'Quarterly Plan',  type: 'quarterly', price: 79.99,  durationDays: 90,  features: ['Gym Access','Classes','Locker Room','Pool Access','1 PT Session/month'], isActive: true },
            { id: 4, name: 'Annual Premium',  type: 'annual',    price: 499.99, durationDays: 365, features: ['Gym Access','Unlimited Classes','Locker Room','Pool Access','4 PT Sessions/month','Nutrition Plan'], isActive: true }
        ],
        equipment: [
            { id: 1, name: 'Treadmill',    type: 'Cardio',       brand: 'LifeFitness', quantity: 5,  conditionStatus: 'good',      lastMaintenance: '2025-01-10', nextMaintenance: '2026-07-10' },
            { id: 2, name: 'Bench Press',  type: 'Strength',     brand: 'Rogue',       quantity: 3,  conditionStatus: 'excellent',  lastMaintenance: '2025-02-15', nextMaintenance: '2026-08-15' },
            { id: 3, name: 'Dumbbell Set', type: 'Free Weights', brand: 'Bowflex',     quantity: 10, conditionStatus: 'good',      lastMaintenance: '2025-01-20', nextMaintenance: '2026-07-20' },
            { id: 4, name: 'Squat Rack',   type: 'Strength',     brand: 'Rogue',       quantity: 2,  conditionStatus: 'good',      lastMaintenance: '2025-03-01', nextMaintenance: '2026-09-01' },
            { id: 5, name: 'Rowing Machine',type:'Cardio',       brand: 'Concept2',    quantity: 4,  conditionStatus: 'excellent',  lastMaintenance: '2025-04-01', nextMaintenance: '2026-10-01' }
        ],
        attendance: [],
        sessions: [],
        payments: [
            { id: 1, memberId: 1, amount: 49.99, paymentDate: new Date(Date.now()-7*86400000).toISOString(), paymentMethod: 'cash', status: 'completed', planName: 'Premium Monthly', receiptNumber: 'RCP-001' },
            { id: 2, memberId: 1, amount: 49.99, paymentDate: new Date(Date.now()-37*86400000).toISOString(), paymentMethod: 'credit_card', status: 'completed', planName: 'Premium Monthly', receiptNumber: 'RCP-002' }
        ],
        notifications: [],
        passwordResets: [],
        nextId: { user: 4, member: 2, trainer: 2, session: 1, payment: 3, attendance: 1, equipment: 6, notification: 1 }
    };
    saveDB(db);
    console.log('✅ Fresh database created at backend/data/db.json');
}

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
    origin: ['http://localhost:8080','http://127.0.0.1:8080','http://localhost:3000','http://127.0.0.1:3000','null'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Request logger
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    }
    next();
});

// ============================================
// AUTH MIDDLEWARE
// ============================================
const auth = (req, res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : header;
    if (!token) return res.status(401).json({ success: false, error: 'Authentication required' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = db.users.find(u => u.id === decoded.id);
        if (!user || !user.isActive) return res.status(401).json({ success: false, error: 'User not found or deactivated' });
        req.user = user;
        next();
    } catch {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
};

const role = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role))
        return res.status(403).json({ success: false, error: `Access denied. Requires: ${roles.join(' or ')}` });
    next();
};

// ============================================
// AUTH ROUTES
// ============================================
// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });

        const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user || !user.isActive) return res.status(401).json({ success: false, error: 'Invalid email or password' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ success: false, error: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        console.log(`✅ Login: ${user.name} (${user.role})`);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }
        });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role: userRole, phone } = req.body;
        if (!name || !email || !password) return res.status(400).json({ success: false, error: 'Name, email, password required' });
        if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase()))
            return res.status(400).json({ success: false, error: 'Email already registered' });

        const newUser = {
            id: db.nextId.user++,
            name, email,
            password: await bcrypt.hash(password, 10),
            role: userRole || 'member',
            phone: phone || '',
            isActive: true,
            createdAt: new Date().toISOString()
        };
        db.users.push(newUser);

        if (newUser.role === 'member') {
            db.members.push({
                id: db.nextId.member++,
                userId: newUser.id,
                planName: 'Basic Monthly',
                planId: 1,
                joinDate: new Date().toISOString().split('T')[0],
                expiryDate: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
                status: 'active',
                healthNotes: '',
                emergencyContact: ''
            });
        }

        saveDB(db);
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
        console.log(`✅ Registered: ${name} (${email}) as ${newUser.role}`);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: { id: newUser.id, name, email, role: newUser.role }
        });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Get current user
app.get('/api/auth/me', auth, (req, res) => {
    const { password, ...u } = req.user;
    res.json({ success: true, user: u });
});

// Forgot password — generates reset token
app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    // Always return same response for security
    const response = { success: true, message: 'If this email exists, a reset token has been generated. Check the server console for the token (email disabled).' };

    if (user) {
        const token = Math.random().toString(36).slice(2, 10).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
        // Remove any existing resets for this user
        db.passwordResets = db.passwordResets.filter(r => r.userId !== user.id);
        db.passwordResets.push({
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + 60*60000).toISOString() // 1 hour
        });
        saveDB(db);
        console.log(`\n🔑 PASSWORD RESET TOKEN for ${email}: ${token}\n   (Use this token in the reset form)\n`);
    }
    res.json(response);
});

// Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;
        if (!email || !token || !newPassword) return res.status(400).json({ success: false, error: 'Email, token, and new password required' });

        const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return res.status(400).json({ success: false, error: 'Invalid reset attempt' });

        const reset = db.passwordResets.find(r => r.userId === user.id && r.token === token.toUpperCase());
        if (!reset) return res.status(400).json({ success: false, error: 'Invalid or already-used reset token' });
        if (new Date(reset.expiresAt) < new Date()) return res.status(400).json({ success: false, error: 'Reset token has expired' });

        user.password = await bcrypt.hash(newPassword, 10);
        db.passwordResets = db.passwordResets.filter(r => r.userId !== user.id);
        saveDB(db);
        console.log(`✅ Password reset for: ${email}`);
        res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Change own password
app.post('/api/auth/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = db.users.find(u => u.id === req.user.id);
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) return res.status(400).json({ success: false, error: 'Current password is incorrect' });
        user.password = await bcrypt.hash(newPassword, 10);
        saveDB(db);
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ============================================
// MEMBER ROUTES
// ============================================
app.get('/api/members', auth, (req, res) => {
    const list = db.members.map(m => {
        const u = db.users.find(u => u.id === m.userId);
        return { ...m, name: u?.name, email: u?.email, phone: u?.phone };
    });
    res.json({ success: true, data: list, total: list.length });
});

app.get('/api/members/:id', auth, (req, res) => {
    const m = db.members.find(m => m.id === parseInt(req.params.id));
    if (!m) return res.status(404).json({ success: false, error: 'Member not found' });
    const u = db.users.find(u => u.id === m.userId);
    res.json({ success: true, data: { ...m, name: u?.name, email: u?.email, phone: u?.phone } });
});

app.post('/api/members', auth, role('admin','receptionist'), async (req, res) => {
    try {
        const { name, email, password, phone, planName, planId, healthNotes, emergencyContact } = req.body;
        if (!name || !email || !password) return res.status(400).json({ success: false, error: 'Name, email and password required' });
        if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase()))
            return res.status(400).json({ success: false, error: 'Email already exists' });

        const newUser = { id: db.nextId.user++, name, email, password: await bcrypt.hash(password, 10), role: 'member', phone: phone || '', isActive: true, createdAt: new Date().toISOString() };
        db.users.push(newUser);

        const plan = db.membershipPlans.find(p => p.id === (planId || 1));
        const newMember = {
            id: db.nextId.member++,
            userId: newUser.id,
            planName: planName || plan?.name || 'Basic Monthly',
            planId: planId || 1,
            joinDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + (plan?.durationDays || 30)*86400000).toISOString().split('T')[0],
            status: 'active',
            healthNotes: healthNotes || '',
            emergencyContact: emergencyContact || ''
        };
        db.members.push(newMember);
        saveDB(db);
        console.log(`✅ Member added: ${name}`);
        res.status(201).json({ success: true, message: 'Member added successfully', data: { ...newMember, name, email, phone } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/members/:id', auth, role('admin','receptionist'), (req, res) => {
    const idx = db.members.findIndex(m => m.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, error: 'Member not found' });
    db.members[idx] = { ...db.members[idx], ...req.body };
    // also update user fields if provided
    if (req.body.name || req.body.phone) {
        const u = db.users.find(u => u.id === db.members[idx].userId);
        if (u) {
            if (req.body.name) u.name = req.body.name;
            if (req.body.phone) u.phone = req.body.phone;
        }
    }
    saveDB(db);
    res.json({ success: true, message: 'Member updated', data: db.members[idx] });
});

app.delete('/api/members/:id', auth, role('admin'), (req, res) => {
    const idx = db.members.findIndex(m => m.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, error: 'Member not found' });
    const userId = db.members[idx].userId;
    db.members.splice(idx, 1);
    const uidx = db.users.findIndex(u => u.id === userId);
    if (uidx !== -1) db.users[uidx].isActive = false;
    saveDB(db);
    res.json({ success: true, message: 'Member removed' });
});

// ============================================
// TRAINER ROUTES
// ============================================
app.get('/api/trainers', auth, (req, res) => {
    const list = db.trainers.map(t => {
        const u = db.users.find(u => u.id === t.userId);
        return { ...t, name: u?.name, email: u?.email, phone: u?.phone };
    });
    res.json({ success: true, data: list, total: list.length });
});

app.post('/api/trainers', auth, role('admin'), async (req, res) => {
    try {
        const { name, email, password, phone, speciality, experienceYears, certification, hourlyRate, bio } = req.body;
        if (!name || !email || !password) return res.status(400).json({ success: false, error: 'Name, email and password required' });
        if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase()))
            return res.status(400).json({ success: false, error: 'Email already exists' });

        const newUser = { id: db.nextId.user++, name, email, password: await bcrypt.hash(password, 10), role: 'trainer', phone: phone || '', isActive: true, createdAt: new Date().toISOString() };
        db.users.push(newUser);
        const newTrainer = { id: db.nextId.trainer++, userId: newUser.id, speciality, experienceYears: experienceYears || 0, certification, hourlyRate: hourlyRate || 0, bio };
        db.trainers.push(newTrainer);
        saveDB(db);
        res.status(201).json({ success: true, message: 'Trainer added', data: { ...newTrainer, name, email } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete('/api/trainers/:id', auth, role('admin'), (req, res) => {
    const idx = db.trainers.findIndex(t => t.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, error: 'Trainer not found' });
    const userId = db.trainers[idx].userId;
    db.trainers.splice(idx, 1);
    const uidx = db.users.findIndex(u => u.id === userId);
    if (uidx !== -1) db.users[uidx].isActive = false;
    saveDB(db);
    res.json({ success: true, message: 'Trainer removed' });
});

// ============================================
// MEMBERSHIP PLAN ROUTES
// ============================================
app.get('/api/plans', (req, res) => {
    res.json({ success: true, data: db.membershipPlans });
});

// ============================================
// SESSION ROUTES
// ============================================
app.get('/api/sessions', auth, (req, res) => {
    res.json({ success: true, data: db.sessions, total: db.sessions.length });
});

app.post('/api/sessions', auth, (req, res) => {
    const session = {
        id: db.nextId.session++,
        memberId: req.body.memberId,
        trainerId: req.body.trainerId,
        date: req.body.date,
        startTime: req.body.startTime || req.body.time,
        endTime: req.body.endTime,
        status: 'scheduled',
        notes: req.body.notes || '',
        createdAt: new Date().toISOString()
    };
    db.sessions.push(session);
    saveDB(db);
    console.log(`✅ Session booked: Member #${session.memberId}`);
    res.status(201).json({ success: true, message: 'Session booked', data: session });
});

app.put('/api/sessions/:id', auth, (req, res) => {
    const idx = db.sessions.findIndex(s => s.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, error: 'Session not found' });
    db.sessions[idx] = { ...db.sessions[idx], ...req.body };
    saveDB(db);
    res.json({ success: true, message: 'Session updated', data: db.sessions[idx] });
});

app.delete('/api/sessions/:id', auth, (req, res) => {
    const idx = db.sessions.findIndex(s => s.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, error: 'Session not found' });
    db.sessions.splice(idx, 1);
    saveDB(db);
    res.json({ success: true, message: 'Session cancelled' });
});

// ============================================
// ATTENDANCE ROUTES
// ============================================
app.get('/api/attendance', auth, (req, res) => {
    res.json({ success: true, data: db.attendance, total: db.attendance.length });
});

app.post('/api/attendance/check-in', auth, (req, res) => {
    const existing = db.attendance.find(a => a.memberId === req.body.memberId && !a.checkOut);
    if (existing) return res.status(400).json({ success: false, error: 'Member already checked in' });
    const record = { id: db.nextId.attendance++, memberId: req.body.memberId, checkIn: new Date().toISOString(), checkOut: null, method: req.body.method || 'manual' };
    db.attendance.push(record);
    saveDB(db);
    res.json({ success: true, message: 'Checked in', data: record });
});

app.post('/api/attendance/check-out', auth, (req, res) => {
    const record = db.attendance.find(a => a.memberId === req.body.memberId && !a.checkOut);
    if (!record) return res.status(404).json({ success: false, error: 'No active check-in found' });
    record.checkOut = new Date().toISOString();
    saveDB(db);
    res.json({ success: true, message: 'Checked out', data: record });
});

// ============================================
// PAYMENT ROUTES
// ============================================
app.get('/api/payments', auth, (req, res) => {
    res.json({ success: true, data: db.payments, total: db.payments.length });
});

app.post('/api/payments', auth, (req, res) => {
    const payment = {
        id: db.nextId.payment++,
        memberId: req.body.memberId,
        amount: req.body.amount,
        paymentDate: new Date().toISOString(),
        paymentMethod: req.body.paymentMethod || 'cash',
        status: 'completed',
        planName: req.body.planName || '',
        receiptNumber: 'RCP-' + String(db.nextId.payment).padStart(4, '0')
    };
    db.payments.push(payment);
    saveDB(db);
    console.log(`✅ Payment: $${payment.amount} from Member #${payment.memberId}`);
    res.status(201).json({ success: true, message: 'Payment recorded', data: payment });
});

// ============================================
// EQUIPMENT ROUTES
// ============================================
app.get('/api/equipment', auth, (req, res) => {
    res.json({ success: true, data: db.equipment, total: db.equipment.length });
});

app.post('/api/equipment', auth, role('admin'), (req, res) => {
    const item = { id: db.nextId.equipment++, ...req.body, createdAt: new Date().toISOString() };
    db.equipment.push(item);
    saveDB(db);
    res.status(201).json({ success: true, message: 'Equipment added', data: item });
});

app.put('/api/equipment/:id', auth, role('admin'), (req, res) => {
    const idx = db.equipment.findIndex(e => e.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, error: 'Equipment not found' });
    db.equipment[idx] = { ...db.equipment[idx], ...req.body };
    saveDB(db);
    res.json({ success: true, message: 'Equipment updated', data: db.equipment[idx] });
});

app.delete('/api/equipment/:id', auth, role('admin'), (req, res) => {
    const idx = db.equipment.findIndex(e => e.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, error: 'Equipment not found' });
    db.equipment.splice(idx, 1);
    saveDB(db);
    res.json({ success: true, message: 'Equipment removed' });
});

// ============================================
// NOTIFICATIONS
// ============================================
app.get('/api/notifications', auth, (req, res) => {
    const mine = db.notifications.filter(n => n.userId === req.user.id).slice(-20).reverse();
    res.json({ success: true, data: mine });
});

app.put('/api/notifications/:id/read', auth, (req, res) => {
    const n = db.notifications.find(n => n.id === parseInt(req.params.id));
    if (n) { n.isRead = true; saveDB(db); }
    res.json({ success: true });
});

// ============================================
// DASHBOARD / REPORTS
// ============================================
app.get('/api/reports/dashboard', auth, (req, res) => {
    const today = new Date().toDateString();
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    const monthlyRevenue = db.payments
        .filter(p => {
            const d = new Date(p.paymentDate);
            return p.status === 'completed' && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        })
        .reduce((s, p) => s + (p.amount || 0), 0);

    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const m = d.getMonth(); const y = d.getFullYear();
        const rev = db.payments.filter(p => {
            const pd = new Date(p.paymentDate);
            return p.status === 'completed' && pd.getMonth() === m && pd.getFullYear() === y;
        }).reduce((s, p) => s + (p.amount || 0), 0);
        revenueByMonth.push({ month: d.toLocaleString('default', { month: 'short' }), revenue: Math.round(rev * 100) / 100 });
    }

    res.json({
        success: true,
        data: {
            totalMembers: db.members.filter(m => m.status === 'active').length,
            totalTrainers: db.trainers.length,
            todayAttendance: db.attendance.filter(a => new Date(a.checkIn).toDateString() === today).length,
            monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
            totalRevenue: Math.round(db.payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0) * 100) / 100,
            activeSessions: db.sessions.filter(s => s.status === 'scheduled' || s.status === 'confirmed').length,
            expiringMemberships: db.members.filter(m => {
                const days = Math.ceil((new Date(m.expiryDate) - new Date()) / 86400000);
                return days <= 7 && days > 0;
            }).length,
            totalEquipment: db.equipment.length,
            recentMembers: db.members.slice(-5).map(m => {
                const u = db.users.find(u => u.id === m.userId);
                return { ...m, name: u?.name, email: u?.email };
            }).reverse(),
            revenueByMonth
        }
    });
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), counts: { users: db.users.length, members: db.members.length, trainers: db.trainers.length, payments: db.payments.length } });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║       🏋️  GYMPRO MANAGEMENT SYSTEM v2       ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Open browser: http://localhost:${PORT}          ║`);
    console.log(`║  Health:       http://localhost:${PORT}/health    ║`);
    console.log('╠══════════════════════════════════════════════╣');
    console.log('║  TEST ACCOUNTS:                              ║');
    console.log('║  admin@gympro.com   /  admin123             ║');
    console.log('║  trainer@gympro.com /  trainer123           ║');
    console.log('║  member@gympro.com  /  member123            ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log('║  Data saved to: backend/data/db.json        ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
});
