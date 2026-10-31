-- =========================================================
-- MIGRATION SKEMA PROYEK 2 - DECKO KANBAN PLATFORM
-- (FONDASI BERSAMA UNTUK MODUL ZAKKY & MODUL IZAT)
-- =========================================================

-- 1. Perluasan Tabel users (Profil, Verifikasi Surel, & Preferensi Tema)
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(20) NOT NULL DEFAULT 'auto';

-- 2. Tabel Baru auth_tokens (Modul Zakky: OTP Email & Reset Password 5 Menit)
CREATE TABLE IF NOT EXISTS auth_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255),
    otp_code VARCHAR(10),
    token_type VARCHAR(30) NOT NULL, -- 'email_verification', 'password_reset'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_type_otp ON auth_tokens(token_type, otp_code);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_type_hash ON auth_tokens(token_type, token_hash);

-- 3. Tabel Baru card_attachments (Modul Zakky: Tautan Sumber Daya Eksternal Kartu)
CREATE TABLE IF NOT EXISTS card_attachments (
    id SERIAL PRIMARY KEY,
    card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    url TEXT NOT NULL,
    provider VARCHAR(50) DEFAULT 'link', -- 'gdrive', 'figma', 'github', 'dropbox', 'link'
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_card_attachments_card_id ON card_attachments(card_id);

-- 4. Tabel Baru notifications (Modul Izat: In-App Notification Center)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'assignment', 'comment', 'deadline_alert', 'recurring_task'
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- 5. Tabel Baru recurring_tasks (Modul Izat: Automasi Tugas Berkala)
CREATE TABLE IF NOT EXISTS recurring_tasks (
    id SERIAL PRIMARY KEY,
    board_id INTEGER REFERENCES boards(id) ON DELETE CASCADE,
    list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    frequency VARCHAR(20) NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_generated_at TIMESTAMP WITH TIME ZONE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recurring_tasks_board_id ON recurring_tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_active ON recurring_tasks(is_active);
