-- Add role field to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'viewer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Create admin user with hashed password (default password: Admin@123)
INSERT INTO users (
    full_name,
    email,
    password_hash,
    role,
    status,
    created_at
) VALUES (
    'Admin User',
    'admin@filmila.com',
    '$2a$10$uvLC0DFVaFKccOwuS6oPqe5tGakoBT.uDzR5p59wqEegoghlF7bem',
    'admin',
    'active',
    NOW()
) ON CONFLICT (email) DO NOTHING;
