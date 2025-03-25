-- Create films table
CREATE TABLE IF NOT EXISTS films (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    tags JSONB DEFAULT '[]',
    poster_url TEXT NOT NULL,
    film_url TEXT NOT NULL,
    filmer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    views_count INTEGER DEFAULT 0,
    earnings DECIMAL(10,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create views table for tracking views and purchases
CREATE TABLE IF NOT EXISTS views (
    id SERIAL PRIMARY KEY,
    film_id INTEGER REFERENCES films(id) ON DELETE CASCADE,
    viewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    film_id INTEGER REFERENCES films(id) ON DELETE CASCADE,
    viewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_films_filmer_id ON films(filmer_id);
CREATE INDEX IF NOT EXISTS idx_films_status ON films(status);
CREATE INDEX IF NOT EXISTS idx_views_film_id ON views(film_id);
CREATE INDEX IF NOT EXISTS idx_views_viewer_id ON views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_film_id ON reviews(film_id);
