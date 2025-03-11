import React from 'react';
import { Helmet } from 'react-helmet-async';
import HeroSection from '../components/home/HeroSection';
import FeaturedFilms from '../components/home/FeaturedFilms';
import HowItWorks from '../components/home/HowItWorks';
import Testimonials from '../components/home/Testimonials';
import FilmmakerCTA from '../components/home/FilmmakerCTA';
import Footer from '../components/home/Footer';

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>Filmila - Discover & Support Local Filmmakers</title>
        <meta
          name="description"
          content="Watch amazing short films and directly support their creators. Join our community of film enthusiasts and filmmakers."
        />
        {/* Open Graph tags for better social sharing */}
        <meta property="og:title" content="Filmila - Discover & Support Local Filmmakers" />
        <meta
          property="og:description"
          content="Watch amazing short films and directly support their creators. Join our community of film enthusiasts and filmmakers."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={process.env.REACT_APP_WEBSITE_URL} />
        <meta property="og:image" content={`${process.env.REACT_APP_WEBSITE_URL}/images/og-image.jpg`} />
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@filmila" />
        <meta name="twitter:title" content="Filmila - Discover & Support Local Filmmakers" />
        <meta
          name="twitter:description"
          content="Watch amazing short films and directly support their creators. Join our community of film enthusiasts and filmmakers."
        />
        <meta name="twitter:image" content={`${process.env.REACT_APP_WEBSITE_URL}/images/twitter-card.jpg`} />
      </Helmet>

      <main className="min-h-screen bg-gray-900">
        {/* Hero Section */}
        <HeroSection />

        {/* Featured Films */}
        <FeaturedFilms />

        {/* How It Works */}
        <HowItWorks />

        {/* Testimonials */}
        <Testimonials />

        {/* Filmmaker CTA */}
        <FilmmakerCTA />

        {/* Footer */}
        <Footer />
      </main>
    </>
  );
};

export default HomePage;
