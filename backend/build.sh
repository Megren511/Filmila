#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
npm install

# Run database migrations if needed
npm run migrate

# Create production build
npm run build
