@echo off
REM APAS Setup Script for Windows

echo ==========================================
echo APAS Setup Script
echo ==========================================
echo.

REM Check Python version
echo Checking Python version...
python --version
echo.

REM Check Node.js version
echo Checking Node.js version...
node --version
echo.

echo ==========================================
echo Setting up Backend...
echo ==========================================

REM Backend setup
cd backend

REM Create virtual environment
echo Creating Python virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Copy environment file
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo Please edit backend\.env with your database credentials
)

REM Create logs directory
if not exist logs mkdir logs

cd ..

echo.
echo ==========================================
echo Setting up Frontend...
echo ==========================================

REM Frontend setup
echo Installing Node.js dependencies...
call npm install

REM Copy environment file
if not exist frontend\.env (
    echo Creating frontend\.env file from template...
    copy frontend\.env.example frontend\.env
)

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Edit backend\.env with your PostgreSQL credentials
echo 2. Create PostgreSQL database: createdb apas_db
echo 3. Run migrations: cd backend ^&^& python manage.py migrate
echo 4. Create superuser: cd backend ^&^& python manage.py createsuperuser
echo 5. Start backend: cd backend ^&^& python manage.py runserver
echo 6. Start frontend: npm run dev
echo.
echo Backend will run on: http://localhost:8000
echo Frontend will run on: http://localhost:5173
echo.

pause
