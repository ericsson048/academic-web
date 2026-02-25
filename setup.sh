#!/bin/bash

# APAS Setup Script
# This script helps set up the APAS development environment

echo "=========================================="
echo "APAS Setup Script"
echo "=========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Check Node.js version
echo "Checking Node.js version..."
node_version=$(node --version 2>&1)
echo "Node.js version: $node_version"

# Check PostgreSQL
echo "Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    psql_version=$(psql --version 2>&1 | awk '{print $3}')
    echo "PostgreSQL version: $psql_version"
else
    echo "WARNING: PostgreSQL not found. Please install PostgreSQL 14+"
fi

echo ""
echo "=========================================="
echo "Setting up Backend..."
echo "=========================================="

# Backend setup
cd backend

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment file
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit backend/.env with your database credentials"
fi

# Create logs directory
mkdir -p logs

cd ..

echo ""
echo "=========================================="
echo "Setting up Frontend..."
echo "=========================================="

# Frontend setup
echo "Installing Node.js dependencies..."
npm install

# Copy environment file
if [ ! -f frontend/.env ]; then
    echo "Creating frontend/.env file from template..."
    cp frontend/.env.example frontend/.env
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your PostgreSQL credentials"
echo "2. Create PostgreSQL database: createdb apas_db"
echo "3. Run migrations: cd backend && python manage.py migrate"
echo "4. Create superuser: cd backend && python manage.py createsuperuser"
echo "5. Start backend: cd backend && python manage.py runserver"
echo "6. Start frontend: npm run dev"
echo ""
echo "Backend will run on: http://localhost:8000"
echo "Frontend will run on: http://localhost:5173"
echo ""
