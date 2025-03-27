require('dotenv').config();
const bcrypt = require('bcrypt');
const { db } = require('./index');

async function seed() {
  try {
    // Create admin user if it doesn't exist
    const adminExists = await db.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@filmila.com']
    );

    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await db.query(`
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4)
      `, ['admin@filmila.com', hashedPassword, 'Admin User', 'admin']);
      console.log('Admin user created successfully');
    }

    // Add some sample films
    const filmerExists = await db.query(
      'SELECT * FROM users WHERE email = $1',
      ['filmmaker@filmila.com']
    );

    let filmerId;
    if (filmerExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('Filmmaker@123', 10);
      const filmerResult = await db.query(`
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, ['filmmaker@filmila.com', hashedPassword, 'Sample Filmmaker', 'filmmaker']);
      filmerId = filmerResult.rows[0].id;
      console.log('Filmmaker user created successfully');
    } else {
      filmerId = filmerExists.rows[0].id;
    }

    // Add some sample films
    const sampleFilms = [
      {
        title: 'Sample Film 1',
        description: 'A beautiful documentary about nature',
        video_url: 'https://example.com/video1.mp4',
        thumbnail_url: 'https://example.com/thumb1.jpg',
        price: 4.99,
        status: 'approved'
      },
      {
        title: 'Sample Film 2',
        description: 'An exciting adventure film',
        video_url: 'https://example.com/video2.mp4',
        thumbnail_url: 'https://example.com/thumb2.jpg',
        price: 5.99,
        status: 'pending'
      }
    ];

    for (const film of sampleFilms) {
      const filmExists = await db.query(
        'SELECT * FROM films WHERE title = $1 AND filmer_id = $2',
        [film.title, filmerId]
      );

      if (filmExists.rows.length === 0) {
        await db.query(`
          INSERT INTO films (
            title, description, filmer_id, video_url, 
            thumbnail_url, price, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          film.title,
          film.description,
          filmerId,
          film.video_url,
          film.thumbnail_url,
          film.price,
          film.status
        ]);
        console.log(`Film "${film.title}" created successfully`);
      }
    }

    // Add some sample views and revenue
    const approvedFilms = await db.query('SELECT id FROM films WHERE status = $1', ['approved']);
    
    // Create a sample viewer if none exists
    const viewerExists = await db.query(
      'SELECT * FROM users WHERE email = $1',
      ['viewer@filmila.com']
    );

    let viewerId;
    if (viewerExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('Viewer@123', 10);
      const viewerResult = await db.query(`
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, ['viewer@filmila.com', hashedPassword, 'Sample Viewer', 'viewer']);
      viewerId = viewerResult.rows[0].id;
      console.log('Viewer user created successfully');
    } else {
      viewerId = viewerExists.rows[0].id;
    }

    if (approvedFilms.rows.length > 0) {
      const dates = Array.from({length: 30}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date;
      });

      for (const date of dates) {
        const viewCount = Math.floor(Math.random() * 5) + 1; // 1-5 views per day
        for (let i = 0; i < viewCount; i++) {
          const filmId = approvedFilms.rows[Math.floor(Math.random() * approvedFilms.rows.length)].id;
          const price = Math.random() * 10; // Random price between 0-10

          await db.query(`
            INSERT INTO views (film_id, viewer_id, viewed_at, price)
            VALUES ($1, $2, $3, $4)
          `, [filmId, viewerId, date, price.toFixed(2)]);
        }
      }
      console.log('Sample views and revenue data created successfully');
    }

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await db.end();
  }
}

seed();
