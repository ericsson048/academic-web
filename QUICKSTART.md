# APAS Quick Start Guide

This guide will help you get APAS up and running in under 15 minutes.

## Prerequisites Check

Before starting, verify you have:

- ✅ Python 3.10+ installed (`python3 --version`)
- ✅ Node.js 18+ installed (`node --version`)
- ✅ PostgreSQL 14+ installed and running (`psql --version`)
- ✅ Git installed (`git --version`)

## Quick Setup (Automated)

### On macOS/Linux:

```bash
chmod +x setup.sh
./setup.sh
```

### On Windows:

```cmd
setup.bat
```

## Manual Setup

If you prefer manual setup or the automated script fails:

### 1. Backend Setup (5 minutes)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Create database
createdb apas_db

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start server
python manage.py runserver
```

Backend is now running at `http://localhost:8000`

### 2. Frontend Setup (3 minutes)

Open a new terminal:

```bash
# Install dependencies
npm install

# Configure environment
cp frontend/.env.example frontend/.env

# Start development server
npm run dev
```

Frontend is now running at `http://localhost:5173`

## Verify Installation

1. **Backend API**: Visit `http://localhost:8000/admin` and login with your superuser credentials
2. **Frontend**: Visit `http://localhost:5173` and you should see the APAS welcome page

## Common Issues

### Database Connection Error

**Problem**: `django.db.utils.OperationalError: could not connect to server`

**Solution**:
```bash
# Check if PostgreSQL is running
sudo service postgresql status  # Linux
brew services list              # macOS

# Start PostgreSQL if needed
sudo service postgresql start   # Linux
brew services start postgresql  # macOS
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5173`

**Solution**:
```bash
# Use a different port
npm run dev -- --port 5174
```

### Python Module Not Found

**Problem**: `ModuleNotFoundError: No module named 'django'`

**Solution**:
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

## Next Steps

Now that APAS is running:

1. **Explore the Admin Panel**: `http://localhost:8000/admin`
2. **Check API Documentation**: See README.md for available endpoints
3. **Start Development**: Refer to the implementation tasks in `.kiro/specs/apas-academic-analytics/tasks.md`

## Development Workflow

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
npm run test
```

### Making Changes

1. Backend changes: Edit files in `backend/` directory
2. Frontend changes: Edit files in `src/` directory
3. Both servers support hot-reload - changes appear automatically

## Getting Help

- **Documentation**: See README.md for detailed information
- **API Endpoints**: Check `backend/apas/urls.py` for available routes
- **Project Structure**: Refer to README.md for directory layout

## Stopping the Servers

- Press `Ctrl+C` in each terminal to stop the servers
- Deactivate Python virtual environment: `deactivate`

---

**Estimated Setup Time**: 10-15 minutes

**Ready to code!** 🚀
