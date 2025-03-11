import React from 'react';
import { motion } from 'framer-motion';

const StepCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="flex flex-col items-center text-center"
  >
    <div className="mb-6 rounded-full bg-primary/10 p-6">
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className="text-primary"
      >
        {icon}
      </motion.div>
    </div>
    <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
);

const HowItWorks = () => {
  const steps = [
    {
      icon: (
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path
            fillRule="evenodd"
            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
      title: "Browse",
      description: "Explore our curated collection of amazing short films from talented local filmmakers.",
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      title: "Pay-Per-View",
      description: "Only pay for what you watch. No subscriptions, no commitments. Support filmmakers directly.",
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
        </svg>
      ),
      title: "Support Filmmakers",
      description: "Your payment goes directly to supporting local talent. Help creators continue making amazing content.",
    },
  ];

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
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-gray-400">
            Join our community of film enthusiasts and creators. It's simple to get started.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              delay={index * 0.2}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex rounded-full bg-primary/10 px-4 py-1.5">
            <span className="text-sm font-medium text-primary">
              Join thousands of satisfied viewers and filmmakers
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
