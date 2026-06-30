-- Committee Management System - Database Schema
-- Database: PostgreSQL (Neon)

-- =============================================
-- 1. COMMITTEE SETTINGS (Single committee app)
-- =============================================
CREATE TABLE committee_settings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    monthly_instalment DECIMAL(12, 2) NOT NULL DEFAULT 0,
    default_interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 2.00, -- monthly %
    late_fine_per_day DECIMAL(10, 2) DEFAULT 0,
    late_fine_per_month DECIMAL(10, 2) DEFAULT 0,
    grace_period_days INTEGER DEFAULT 0,
    payment_due_day INTEGER DEFAULT 5, -- har month ki kitni tarikh tak payment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. USERS (Login/Auth - App Management Roles)
-- =============================================
CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'subadmin', 'manager');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'manager',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. MEMBERS (Committee Members)
-- =============================================
CREATE TYPE committee_role AS ENUM ('president', 'secretary', 'treasurer', 'member');

CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    committee_role committee_role NOT NULL DEFAULT 'member',
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. MONTHLY INSTALMENTS (Member contributions)
-- =============================================
CREATE TYPE payment_status AS ENUM ('paid', 'partial', 'unpaid', 'late');

CREATE TABLE instalments (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    due_date DATE NOT NULL,
    paid_date DATE,
    status payment_status DEFAULT 'unpaid',
    late_fine DECIMAL(10, 2) DEFAULT 0,
    month INTEGER NOT NULL, -- 1-12
    year INTEGER NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. LOANS
-- =============================================
CREATE TYPE loan_status AS ENUM ('active', 'closed', 'foreclosed');

CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    principal_amount DECIMAL(12, 2) NOT NULL,
    remaining_principal DECIMAL(12, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL, -- monthly % (reducing balance)
    monthly_payment_amount DECIMAL(12, 2) NOT NULL, -- fixed set amount per month
    tenure_months INTEGER, -- NULL = open-ended
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE, -- NULL = open-ended, calculated for fixed tenure
    status loan_status DEFAULT 'active',
    total_interest_paid DECIMAL(12, 2) DEFAULT 0,
    total_principal_paid DECIMAL(12, 2) DEFAULT 0,
    closed_date DATE,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 6. LOAN PAYMENTS (EMI / Partial / Interest-only / Foreclosure)
-- =============================================
CREATE TYPE loan_payment_type AS ENUM ('emi', 'interest_only', 'partial', 'foreclosure');

CREATE TABLE loan_payments (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    payment_amount DECIMAL(12, 2) NOT NULL,
    principal_component DECIMAL(12, 2) DEFAULT 0,
    interest_component DECIMAL(12, 2) DEFAULT 0,
    remaining_principal_after DECIMAL(12, 2) NOT NULL,
    payment_type loan_payment_type NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 7. LOAN INTEREST LOG (Monthly interest tracking & compounding)
-- =============================================
CREATE TABLE loan_interest_log (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    principal_at_start DECIMAL(12, 2) NOT NULL,
    interest_amount DECIMAL(12, 2) NOT NULL,
    is_compounded BOOLEAN DEFAULT FALSE, -- TRUE if unpaid & added to principal
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 8. FUND TRACKER (Total available fund)
-- =============================================
CREATE TABLE fund_transactions (
    id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL, -- 'instalment_received', 'loan_disbursed', 'loan_payment_received', 'fine_received'
    amount DECIMAL(12, 2) NOT NULL,
    reference_id INTEGER, -- instalment_id, loan_id, or loan_payment_id
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_instalments_member ON instalments(member_id);
CREATE INDEX idx_instalments_month_year ON instalments(month, year);
CREATE INDEX idx_loans_member ON loans(member_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loan_payments_loan ON loan_payments(loan_id);
CREATE INDEX idx_loan_payments_member ON loan_payments(member_id);
CREATE INDEX idx_loan_interest_log_loan ON loan_interest_log(loan_id);
CREATE INDEX idx_fund_transactions_date ON fund_transactions(transaction_date);

-- =============================================
-- SEED: Default committee settings
-- =============================================
INSERT INTO committee_settings (name, description, monthly_instalment, default_interest_rate, late_fine_per_day, grace_period_days, payment_due_day)
VALUES ('My Committee', 'Committee Management System', 1000.00, 2.00, 50.00, 5, 5);

-- SEED: Default Super Admin user (password: admin123 - change after first login)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (name, email, password, phone, role)
VALUES ('Super Admin', 'admin@committee.com', '$2b$10$placeholder_hash_change_this', '9999999999', 'superadmin');
