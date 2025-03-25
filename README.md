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
- React 18
- React Router v6
- Axios for API requests
- Chart.js for analytics

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
- Node.js (v18 or higher)
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
# Install all dependencies
npm run install-all
```

3. Set up environment variables
```bash
# Backend (.env)
PORT=8080
DATABASE_URL=postgresql://username:password@localhost:5432/filmila
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
S3_BUCKET=your_s3_bucket
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Frontend (.env)
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

4. Run database migrations
```bash
cd backend
npm run migrate
```

5. Start development servers
```bash
# Start both frontend and backend in development mode
npm run dev
```

## Deployment

The application is configured for deployment on Render:

1. Create a new Web Service on Render
2. Link your GitHub repository
3. Set the following:
   - Build Command: `npm run install-all && npm run build`
   - Start Command: `npm start`
   - Node Version: 18.x or higher

4. Add environment variables in Render dashboard
5. Set up PostgreSQL database in Render
6. Configure AWS S3 and CloudFront
7. Set up Stripe webhooks

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. See the LICENSE file for details.
