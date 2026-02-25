# APAS - Academic Performance Analytics System

APAS (Academic Performance Analytics System) is a full-stack web application designed to analyze and visualize student academic performance. The system tracks student grades, calculates performance metrics, and provides interactive analytics dashboards for teachers and administrators.

## Features

- **User Authentication**: Secure JWT-based authentication with role-based access control (Administrator/Teacher)
- **Student Management**: Complete CRUD operations for student records
- **Grade Management**: Record and track student grades with audit history
- **Performance Analytics**: Automatic calculation of averages, standard deviations, and progression metrics
- **Interactive Dashboard**: Visual analytics with charts (bar, line, pie) using Recharts
- **PDF Report Generation**: Generate comprehensive academic reports for students
- **Advanced Filtering**: Search and filter students, grades, and analytics by multiple criteria

## Technology Stack

### Backend
- **Framework**: Django 4.2+ with Django REST Framework 3.14+
- **Database**: PostgreSQL 14+
- **Authentication**: JWT (JSON Web Tokens) via djangorestframework-simplejwt
- **Testing**: pytest, Hypothesis (property-based testing)

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **PDF Generation**: jsPDF
- **Testing**: Vitest, fast-check (property-based testing)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher
- **PostgreSQL**: 14.0 or higher
- **npm** or **yarn**: Latest version

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd apas
```

### 2. Backend Setup

#### Create Virtual Environment

```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure your database credentials:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=apas_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
```

#### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE apas_db;

# Exit psql
\q
```

#### Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

#### Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

#### Start Backend Server

```bash
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Install Dependencies

```bash
# From project root
npm install
```

#### Configure Environment Variables

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_ENV=development
```

#### Start Frontend Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Project Structure

```
apas/
├── backend/                    # Django backend
│   ├── apas/                  # Main Django project
│   │   ├── settings.py        # Django settings
│   │   ├── urls.py            # URL configuration
│   │   └── exceptions.py      # Custom exception handlers
│   ├── authentication/        # Authentication app
│   ├── students/              # Student management app
│   ├── grades/                # Grade management app
│   ├── analytics/             # Analytics app
│   ├── manage.py              # Django management script
│   └── requirements.txt       # Python dependencies
├── src/                       # React frontend
│   ├── components/            # React components
│   ├── services/              # API services
│   ├── contexts/              # React contexts
│   ├── utils/                 # Utility functions
│   ├── types/                 # TypeScript types
│   └── main.tsx               # Entry point
├── package.json               # Node.js dependencies
├── vite.config.ts             # Vite configuration
└── README.md                  # This file
```

## Development Workflow

### Running Tests

#### Backend Tests

```bash
cd backend
pytest
```

#### Frontend Tests

```bash
npm run test
```

### Code Quality

#### Backend Linting

```bash
cd backend
flake8 .
black . --check
```

#### Frontend Linting

```bash
npm run lint
```

## API Documentation

The API follows RESTful conventions. Key endpoints:

### Authentication
- `POST /api/auth/login/` - Login and get JWT token
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Get current user info

### Students
- `GET /api/students/` - List students (paginated)
- `POST /api/students/` - Create student (admin only)
- `GET /api/students/{id}/` - Get student details
- `PUT /api/students/{id}/` - Update student (admin only)
- `DELETE /api/students/{id}/` - Delete student (admin only)

### Grades
- `GET /api/grades/` - List grades
- `POST /api/grades/` - Create grade
- `PUT /api/grades/{id}/` - Update grade
- `GET /api/grades/{id}/history/` - Get grade history

### Analytics
- `GET /api/analytics/summary/` - Dashboard summary
- `GET /api/analytics/performance-by-subject/` - Performance by subject
- `GET /api/analytics/performance-evolution/` - Performance over time
- `GET /api/analytics/student/{id}/` - Student performance details

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | - |
| `DEBUG` | Debug mode | `True` |
| `DB_NAME` | Database name | `apas_db` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `JWT_ACCESS_TOKEN_LIFETIME` | JWT access token lifetime (minutes) | `60` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000/api` |
| `VITE_ENV` | Environment | `development` |

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Ensure PostgreSQL is running
2. Verify database credentials in `.env`
3. Check if the database exists: `psql -U postgres -l`

### Port Already in Use

If port 8000 or 5173 is already in use:

```bash
# Backend - use different port
python manage.py runserver 8001

# Frontend - use different port
npm run dev -- --port 5174
```

### Migration Issues

If migrations fail:

```bash
# Reset migrations (development only)
python manage.py migrate --fake-initial
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Run linting and tests
5. Submit a pull request

## License

This project is developed for academic purposes.

## Support

For issues and questions, please refer to the project documentation or contact the development team.
