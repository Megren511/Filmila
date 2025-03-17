# Filmila - Discover & Support Local Filmmakers

A modern platform that connects film enthusiasts with talented local filmmakers, enabling direct support through a pay-per-view model.

## Features

- **Film Discovery**: Browse and watch curated short films from local filmmakers
- **Direct Support**: Pay-per-view model with 85% revenue share to filmmakers
- **Targeted Audience**: Connect with film enthusiasts interested in your genre
- **Analytics Dashboard**: Track views, earnings, and audience engagement
- **Advanced Search**: Find films by genre, duration, rating, and more
- **Modern UI**: Clean, responsive design with smooth animations

## Tech Stack

### Frontend
- React (Next.js)
- TailwindCSS for styling
- Framer Motion for animations
- Axios for API requests

### Backend
- Node.js with Express
- PostgreSQL database
- JWT authentication
- Stripe payment integration

### Infrastructure
- AWS S3 for video storage
- CloudFront for CDN
- Render for deployment

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL
- AWS Account (for S3 and CloudFront)
- Stripe Account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/filmila.git
cd filmila
```

2. Install dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables
```bash
# Frontend (.env)
cp frontend/.env.example frontend/.env

# Backend (.env)
cp backend/.env.example backend/.env
```

4. Start development servers
```bash
# Start frontend (in frontend directory)
npm run dev

# Start backend (in backend directory)
npm run dev
```

## Authentication System

### Features
- JWT-based authentication with access and refresh tokens
- Role-based access control (Admin, Filmmaker, Viewer)
- Secure password hashing with bcrypt
- Email verification for new accounts
- Password reset functionality
- Session management with refresh tokens
- Rate limiting for security
- Protected routes based on user roles

### User Roles
- **Admin**: Full platform management and moderation
- **Filmmaker**: Upload and manage films, access earnings dashboard
- **Viewer**: Watch films, manage watchlist, and purchase content

### Security Features
- Password strength requirements
- Email verification required
- Token-based authentication
- CORS protection
- Rate limiting on authentication endpoints
- Secure password reset flow
- Session management and invalidation
- Request sanitization and validation

### API Endpoints

#### Authentication
```
POST /api/auth/register     - Register new user
POST /api/auth/login        - User login
POST /api/auth/logout       - User logout
GET  /api/auth/verify-email - Verify email address
POST /api/auth/forgot-password    - Request password reset
POST /api/auth/reset-password     - Reset password
POST /api/auth/refresh-token      - Refresh access token
```

## Deployment

### Render Deployment (Recommended)

1. Create a Render account at https://render.com

2. Connect your GitHub repository to Render

3. Create a new Web Service for the backend:
   - Choose the repository
   - Select the `main` branch
   - Set name as `filmila-api`
   - Set build command: `cd backend && npm install && npm run build`
   - Set start command: `cd backend && npm start`
   - Add environment variables:
     ```
     NODE_ENV=production
     DATABASE_URL=your_postgres_url
     JWT_SECRET=your_jwt_secret
     AWS_ACCESS_KEY_ID=your_aws_key
     AWS_SECRET_ACCESS_KEY=your_aws_secret
     AWS_REGION=us-east-1
     S3_BUCKET_NAME=your_bucket_name
     CLOUDFRONT_URL=your_cloudfront_url
     STRIPE_SECRET_KEY=your_stripe_key
     STRIPE_WEBHOOK_SECRET=your_webhook_secret
     ```

4. Create a new Static Site for the frontend:
   - Choose the repository
   - Set name as `filmila-web`
   - Set build command: `cd frontend && npm install && npm run build`
   - Set publish directory: `frontend/build`
   - Add environment variables:
     ```
     REACT_APP_API_URL=https://filmila-api.onrender.com/api
     REACT_APP_CLOUDFRONT_URL=your_cloudfront_url
     ```

5. The deployment will start automatically. Your services will be available at:
   - Backend API: `https://filmila-api.onrender.com`
   - Frontend: `https://filmila-web.onrender.com`

### Alternative Deployment Options

1. **AWS (Alternative 1)**
   - Deploy backend to Elastic Beanstalk
   - Host frontend on S3 + CloudFront
   - Use RDS for PostgreSQL
   - Manage with AWS CodePipeline

2. **DigitalOcean (Alternative 2)**
   - Deploy using App Platform
   - Use Managed Databases for PostgreSQL
   - Set up automatic deployments from GitHub

### Important Notes

1. Always set up proper environment variables
2. Enable CORS for your domain
3. Set up SSL certificates
4. Configure proper security groups
5. Set up monitoring and logging
6. Configure auto-scaling if needed

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- All the amazing filmmakers who share their work on our platform
- The open-source community for their invaluable tools and libraries
- Our early users for their feedback and support
