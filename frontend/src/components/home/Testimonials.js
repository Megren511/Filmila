import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TestimonialCard = ({ testimonial }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="rounded-lg bg-gray-800 p-6"
  >
    <div className="mb-4 flex items-center">
      <img
        src={testimonial.avatar}
        alt={testimonial.name}
        className="h-12 w-12 rounded-full object-cover"
      />
      <div className="ml-4">
        <h4 className="text-lg font-semibold text-white">{testimonial.name}</h4>
        <p className="text-sm text-gray-400">{testimonial.role}</p>
      </div>
    </div>
    <div className="mb-4">
      {[...Array(5)].map((_, index) => (
        <span key={index} className="mr-1">
          <svg
            className={`h-5 w-5 ${
              index < testimonial.rating
                ? 'text-yellow-400'
                : 'text-gray-600'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </span>
      ))}
    </div>
    <p className="text-gray-300">{testimonial.content}</p>
    {testimonial.filmTitle && (
      <div className="mt-4 text-sm text-gray-400">
        Film: {testimonial.filmTitle}
      </div>
    )}
  </motion.div>
);

const SuccessMetric = ({ label, value, prefix = '', suffix = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="text-center"
  >
    <div className="mb-2 text-3xl font-bold text-white">
      {prefix}
      {value}
      {suffix}
    </div>
    <div className="text-sm text-gray-400">{label}</div>
  </motion.div>
);

const Testimonials = () => {
  const [activeTestimonials, setActiveTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  const metrics = [
    { label: 'Active Filmmakers', value: '500', suffix: '+' },
    { label: 'Short Films', value: '2.5', suffix: 'K+' },
    { label: 'Monthly Views', value: '100', suffix: 'K+' },
    { label: 'Paid to Filmmakers', value: '250', prefix: '$', suffix: 'K+' },
  ];

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        // Using the API service pattern from memories
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/testimonials`);
        const data = await response.json();
        setActiveTestimonials(data);
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        // Fallback data in case API fails
        setActiveTestimonials([
          {
            id: 1,
            name: 'Sarah Chen',
            role: 'Filmmaker',
            avatar: '/images/testimonials/sarah.jpg',
            rating: 5,
            content: 'Filmila has been a game-changer for independent filmmakers like me. The platform's pay-per-view model ensures fair compensation while connecting us with a passionate audience.',
            filmTitle: 'Urban Dreams'
          },
          {
            id: 2,
            name: 'Michael Rodriguez',
            role: 'Film Enthusiast',
            avatar: '/images/testimonials/michael.jpg',
            rating: 5,
            content: 'I love discovering unique short films here. The quality of content is exceptional, and knowing my views directly support the creators makes the experience even better.',
          },
          {
            id: 3,
            name: 'Emma Thompson',
            role: 'Film Festival Curator',
            avatar: '/images/testimonials/emma.jpg',
            rating: 5,
            content: 'Filmila is revolutionizing how we consume and support short films. The platform's curation and filmmaker support system is impressive.',
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-lg bg-gray-800"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-gray-900 py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            What Our Community Says
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            Join thousands of filmmakers and film enthusiasts who are part of our growing community.
          </p>
        </motion.div>

        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          <AnimatePresence>
            {activeTestimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4">
          {metrics.map((metric, index) => (
            <SuccessMetric
              key={index}
              label={metric.label}
              value={metric.value}
              prefix={metric.prefix}
              suffix={metric.suffix}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
