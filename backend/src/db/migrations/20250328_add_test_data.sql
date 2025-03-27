-- Add test data for users
INSERT INTO users (username, email, password_hash, role, status)
VALUES 
    ('admin', 'admin@filmila.com', '$2a$10$mj1OMFvVmGAR4gEEXZGtA.R5wYtQelXrlfMxnBhXL1dRWE9YxwqEy', 'admin', 'active'),
    ('filmmaker1', 'filmmaker1@test.com', '$2a$10$mj1OMFvVmGAR4gEEXZGtA.R5wYtQelXrlfMxnBhXL1dRWE9YxwqEy', 'filmmaker', 'active'),
    ('viewer1', 'viewer1@test.com', '$2a$10$mj1OMFvVmGAR4gEEXZGtA.R5wYtQelXrlfMxnBhXL1dRWE9YxwqEy', 'viewer', 'active')
ON CONFLICT (email) DO NOTHING;

-- Add test data for films
INSERT INTO films (title, description, genre, price, poster_url, film_url, filmer_id, status)
SELECT 
    'Test Film 1',
    'A test film description',
    'Drama',
    9.99,
    'https://example.com/poster1.jpg',
    'https://example.com/film1.mp4',
    u.id,
    'approved'
FROM users u
WHERE u.email = 'filmmaker1@test.com'
ON CONFLICT DO NOTHING;

-- Add test data for views
INSERT INTO views (film_id, viewer_id, price)
SELECT 
    f.id,
    u.id,
    f.price
FROM films f
CROSS JOIN users u
WHERE u.email = 'viewer1@test.com'
AND NOT EXISTS (
    SELECT 1 FROM views v 
    WHERE v.film_id = f.id 
    AND v.viewer_id = u.id
);
