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
