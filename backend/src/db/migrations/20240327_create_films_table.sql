-- Create films table
CREATE TABLE IF NOT EXISTS films (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    filmer_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    category VARCHAR(50),
    tags TEXT[],
    price DECIMAL(10,2) DEFAULT 0.00,
    CONSTRAINT valid_price CHECK (price >= 0)
);
