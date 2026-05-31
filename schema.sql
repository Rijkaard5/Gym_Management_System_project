-- database/schema.sql

CREATE DATABASE gym_management;
USE gym_management;

-- Users table (base)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'trainer', 'member', 'receptionist') NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    profile_image VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Members
CREATE TABLE members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    membership_plan_id INT,
    join_date DATE NOT NULL,
    expiry_date DATE,
    status ENUM('active', 'inactive', 'frozen') DEFAULT 'active',
    emergency_contact VARCHAR(100),
    health_notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Trainers
CREATE TABLE trainers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    speciality VARCHAR(100),
    experience_years INT,
    certification VARCHAR(255),
    hourly_rate DECIMAL(10,2),
    bio TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Membership Plans
CREATE TABLE membership_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type ENUM('monthly', 'quarterly', 'annual') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_days INT NOT NULL,
    features JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workout Plans
CREATE TABLE workout_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT,
    trainer_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
);

-- Exercises
CREATE TABLE exercises (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workout_plan_id INT,
    name VARCHAR(100) NOT NULL,
    sets INT NOT NULL,
    reps INT NOT NULL,
    weight DECIMAL(10,2),
    rest_time_seconds INT,
    notes TEXT,
    day_of_week INT,
    order_index INT,
    FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
);

-- Sessions
CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT,
    trainer_id INT,
    workout_plan_id INT,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL,
    FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id) ON DELETE SET NULL
);

-- Attendance
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT,
    check_in TIMESTAMP NOT NULL,
    check_out TIMESTAMP,
    check_in_method ENUM('card', 'fingerprint', 'manual'),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Payments
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT,
    membership_plan_id INT,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('cash', 'credit_card', 'debit_card', 'online', 'bank_transfer'),
    transaction_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    due_date DATE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (membership_plan_id) REFERENCES membership_plans(id) ON DELETE SET NULL
);

-- Receipts
CREATE TABLE receipts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id INT UNIQUE,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

-- Equipment
CREATE TABLE equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    condition_status ENUM('excellent', 'good', 'fair', 'poor', 'out_of_order') DEFAULT 'good',
    quantity INT DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Maintenance Log
CREATE TABLE equipment_maintenance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT,
    maintenance_date DATE NOT NULL,
    description TEXT,
    cost DECIMAL(10,2),
    performed_by VARCHAR(100),
    next_due_date DATE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- Trainer-Member Assignment
CREATE TABLE trainer_member_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    trainer_id INT,
    member_id INT,
    assigned_date DATE DEFAULT CURRENT_DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (trainer_id, member_id)
);

-- Notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type ENUM('payment', 'session', 'membership', 'attendance', 'system', 'equipment'),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_members_user ON members(user_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_attendance_member ON attendance(member_id);
CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_workout_member ON workout_plans(member_id);

-- Seed data for testing

-- Membership Plans
INSERT INTO membership_plans (name, type, price, duration_days, features) VALUES
('Basic Monthly', 'monthly', 29.99, 30, '["Gym Access", "Locker Room"]'),
('Premium Monthly', 'monthly', 49.99, 30, '["Gym Access", "Classes", "Locker Room", "Pool Access"]'),
('Quarterly Plan', 'quarterly', 79.99, 90, '["Gym Access", "Classes", "Locker Room", "Pool Access", "1 PT Session/month"]'),
('Annual Premium', 'annual', 499.99, 365, '["Gym Access", "Unlimited Classes", "Locker Room", "Pool Access", "4 PT Sessions/month", "Nutrition Plan"]');

-- Admin User (password: admin123)
INSERT INTO users (name, email, password, role, phone) VALUES
('Admin User', 'admin@gympro.com', '$2a$10$YourHashedPasswordHere', 'admin', '1234567890');

-- Trainer (password: trainer123)
INSERT INTO users (name, email, password, role, phone, address) VALUES
('Mike Johnson', 'trainer@gympro.com', '$2a$10$YourHashedPasswordHere', 'trainer', '1234567891', '123 Fitness St');

INSERT INTO trainers (user_id, speciality, experience_years, certification, hourly_rate, bio) VALUES
(2, 'Strength Training', 5, 'NASM-CPT', 50.00, 'Experienced strength and conditioning coach');

-- Member (password: member123)
INSERT INTO users (name, email, password, role, phone) VALUES
('John Doe', 'member@gympro.com', '$2a$10$YourHashedPasswordHere', 'member', '1234567892');

INSERT INTO members (user_id, membership_plan_id, join_date, expiry_date, status) VALUES
(3, 1, '2024-01-01', '2024-12-31', 'active');

-- Sample Equipment
INSERT INTO equipment (name, type, brand, quantity, condition_status) VALUES
('Treadmill', 'Cardio', 'LifeFitness', 5, 'good'),
('Bench Press', 'Strength', 'Rogue', 3, 'excellent'),
('Dumbbell Set', 'Free Weights', 'Bowflex', 10, 'good'),
('Squat Rack', 'Strength', 'Rogue', 2, 'good');

-- Assign trainer to member
INSERT INTO trainer_member_assignments (trainer_id, member_id) VALUES (1, 1);