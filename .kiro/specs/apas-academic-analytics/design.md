# Design Document - APAS (Academic Performance Analytics System)

## Overview

APAS (Academic Performance Analytics System) est une application web full-stack conçue pour analyser et visualiser les performances académiques des étudiants. Le système suit une architecture client-serveur moderne avec une séparation claire entre le frontend React, le backend Django REST Framework, et la base de données PostgreSQL.

### System Purpose

Le système centralise les données académiques (étudiants, notes, matières, classes) et automatise les calculs statistiques (moyennes, écarts-types, progressions) pour fournir aux enseignants et administrateurs des insights analytiques via des tableaux de bord interactifs et des rapports PDF.

### Key Features

- Authentification sécurisée avec gestion de rôles (administrateur/enseignant)
- Gestion CRUD complète des étudiants
- Enregistrement et historisation des notes
- Calculs automatiques de performances (moyennes, écarts-types, progressions)
- Dashboard analytique avec graphiques interactifs (Chart.js/Recharts)
- Génération de rapports académiques en PDF
- Filtrage et recherche avancés
- Interface responsive et accessible

### Technology Stack

- **Frontend**: React 18+ (Vite), JavaScript, Tailwind CSS
- **Backend**: Django 4.2+, Django REST Framework 3.14+
- **Database**: PostgreSQL 14+
- **Charting**: Chart.js ou Recharts
- **PDF Generation**: jsPDF ou React-PDF
- **Authentication**: JWT (JSON Web Tokens)


## Architecture

### System Architecture

APAS suit une architecture three-tier classique avec séparation des responsabilités:

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           React Frontend (Vite + Tailwind)            │  │
│  │                                                         │  │
│  │  • Authentication UI      • Dashboard Charts          │  │
│  │  • Student Management     • Report Generation         │  │
│  │  • Grade Entry Forms      • Filtering & Search        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST (JSON)
                              │ JWT Authentication
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │        Django REST Framework Backend                  │  │
│  │                                                         │  │
│  │  • Authentication API     • Performance Calculations  │  │
│  │  • Student CRUD API       • Data Aggregation          │  │
│  │  • Grade Management API   • Business Logic            │  │
│  │  • Analytics API          • Validation & Serialization│  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ ORM (Django Models)
                              │ SQL Queries
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         DATA LAYER                           │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                      │  │
│  │                                                         │  │
│  │  • Users & Authentication  • Performance Indicators   │  │
│  │  • Students & Classes      • Grade History            │  │
│  │  • Subjects & Grades       • Audit Logs               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Authentication Flow:**
```
User → Login Form → POST /api/auth/login → Validate Credentials
→ Generate JWT → Return Token → Store in LocalStorage → Authenticated Requests
```

**Grade Entry Flow:**
```
Teacher → Grade Form → POST /api/grades/ → Validate Grade
→ Save to DB → Trigger Calculation → Update Performance Indicators
→ Broadcast Update → Refresh Dashboard
```

**Dashboard Loading Flow:**
```
User → Dashboard Page → GET /api/analytics/summary → Aggregate Data
→ Calculate Statistics → Return JSON → Render Charts → Display Metrics
```

### Design Patterns

- **Repository Pattern**: Django models act as repositories for data access
- **Service Layer**: Business logic separated in service modules (calculations, aggregations)
- **Serializer Pattern**: DRF serializers handle data transformation and validation
- **Component-Based UI**: React components for reusable UI elements
- **State Management**: React Context API for global state (auth, filters)
- **API Gateway Pattern**: Single REST API entry point with versioned endpoints


## Components and Interfaces

### Backend Components

#### 1. Authentication Module

**Responsibilities:**
- User authentication and session management
- JWT token generation and validation
- Role-based access control (RBAC)

**Key Classes:**
```python
# models.py
class User(AbstractUser):
    role = models.CharField(choices=[('admin', 'Administrator'), ('teacher', 'Teacher')])
    created_at = models.DateTimeField(auto_now_add=True)

# views.py
class LoginView(APIView):
    def post(request) -> JWT Token

class LogoutView(APIView):
    def post(request) -> Success Response

# permissions.py
class IsAdministrator(BasePermission):
    def has_permission(request, view) -> bool

class IsTeacherOrAdmin(BasePermission):
    def has_permission(request, view) -> bool
```

#### 2. Student Management Module

**Responsibilities:**
- CRUD operations for student records
- Student search and filtering
- Data validation and uniqueness checks

**Key Classes:**
```python
# models.py
class Class(models.Model):
    name = models.CharField(max_length=100)
    level = models.CharField(max_length=50)
    academic_year = models.CharField(max_length=9)

class Student(models.Model):
    student_id = models.CharField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    class_assigned = models.ForeignKey(Class)
    enrollment_date = models.DateField()
    photo = models.ImageField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

# serializers.py
class StudentSerializer(ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'
    
    def validate_student_id(value) -> str

# views.py
class StudentViewSet(ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAdministrator]
    filterset_fields = ['class_assigned', 'is_active']
    search_fields = ['student_id', 'first_name', 'last_name']
```

#### 3. Grade Management Module

**Responsibilities:**
- Grade entry and updates
- Grade validation (range checking)
- Grade history tracking
- Bulk grade operations

**Key Classes:**
```python
# models.py
class Subject(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    coefficient = models.DecimalField(default=1.0)

class Semester(models.Model):
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    academic_year = models.CharField(max_length=9)

class Grade(models.Model):
    student = models.ForeignKey(Student)
    subject = models.ForeignKey(Subject)
    semester = models.ForeignKey(Semester)
    value = models.DecimalField(max_digits=5, decimal_places=2)
    entered_by = models.ForeignKey(User)
    entered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['student', 'subject', 'semester']

class GradeHistory(models.Model):
    grade = models.ForeignKey(Grade)
    old_value = models.DecimalField()
    new_value = models.DecimalField()
    modified_by = models.ForeignKey(User)
    modified_at = models.DateTimeField(auto_now_add=True)

# views.py
class GradeViewSet(ModelViewSet):
    def create(request) -> Grade
    def update(request, pk) -> Grade
    def bulk_create(request) -> List[Grade]
```


#### 4. Performance Calculation Module

**Responsibilities:**
- Automatic calculation of averages (subject, overall)
- Standard deviation calculation for classes
- Progression calculation between semesters
- Performance indicator storage and retrieval

**Key Classes:**
```python
# models.py
class PerformanceIndicator(models.Model):
    student = models.ForeignKey(Student)
    semester = models.ForeignKey(Semester)
    subject = models.ForeignKey(Subject, null=True, blank=True)
    
    # Calculated metrics
    average = models.DecimalField(max_digits=5, decimal_places=2)
    standard_deviation = models.DecimalField(null=True)
    progression_percentage = models.DecimalField(null=True)
    class_rank = models.IntegerField(null=True)
    
    calculated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['student', 'semester', 'subject']

# services/calculations.py
class PerformanceCalculator:
    @staticmethod
    def calculate_subject_average(student_id, subject_id, semester_id) -> Decimal:
        """Calculate average for a specific subject"""
        
    @staticmethod
    def calculate_overall_average(student_id, semester_id) -> Decimal:
        """Calculate weighted average across all subjects"""
        
    @staticmethod
    def calculate_progression(student_id, current_semester_id, previous_semester_id) -> Decimal:
        """Calculate percentage change between semesters"""
        
    @staticmethod
    def calculate_class_statistics(class_id, semester_id) -> Dict:
        """Calculate mean and standard deviation for entire class"""
        
    @staticmethod
    def recalculate_all_indicators(student_id, semester_id) -> None:
        """Trigger recalculation of all performance indicators"""

# signals.py
@receiver(post_save, sender=Grade)
def trigger_performance_calculation(sender, instance, **kwargs):
    """Automatically recalculate when grade is saved"""
    PerformanceCalculator.recalculate_all_indicators(
        instance.student.id, 
        instance.semester.id
    )
```

#### 5. Analytics API Module

**Responsibilities:**
- Data aggregation for dashboard
- Filtering and search operations
- Performance data serialization

**Key Classes:**
```python
# views.py
class AnalyticsSummaryView(APIView):
    def get(request) -> {
        'total_students': int,
        'overall_average': float,
        'progression_rate': float,
        'performance_distribution': {...}
    }

class PerformanceBySubjectView(APIView):
    def get(request) -> List[{
        'subject': str,
        'average': float,
        'student_count': int
    }]

class PerformanceEvolutionView(APIView):
    def get(request) -> List[{
        'semester': str,
        'average': float,
        'date': str
    }]

class StudentPerformanceDetailView(APIView):
    def get(request, student_id) -> {
        'student': {...},
        'grades': [...],
        'indicators': {...},
        'charts_data': {...}
    }
```

### Frontend Components

#### 1. Authentication Components

```javascript
// components/auth/LoginForm.jsx
export function LoginForm() {
  // Handles login form submission
  // Stores JWT in localStorage
  // Redirects to dashboard on success
}

// components/auth/ProtectedRoute.jsx
export function ProtectedRoute({ children, requiredRole }) {
  // Checks authentication status
  // Validates user role
  // Redirects to login if unauthorized
}

// contexts/AuthContext.jsx
export const AuthContext = createContext();
export function AuthProvider({ children }) {
  // Manages authentication state
  // Provides login/logout functions
  // Stores user info and token
}
```


#### 2. Student Management Components

```javascript
// components/students/StudentList.jsx
export function StudentList() {
  // Displays paginated student list
  // Supports search and filtering
  // Provides edit/delete actions (admin only)
}

// components/students/StudentForm.jsx
export function StudentForm({ studentId, onSuccess }) {
  // Create/Edit student form
  // Client-side validation
  // Image upload for student photo
}

// components/students/StudentCard.jsx
export function StudentCard({ student }) {
  // Displays student summary
  // Shows key metrics (average, rank)
  // Links to detailed view
}
```

#### 3. Grade Management Components

```javascript
// components/grades/GradeEntryForm.jsx
export function GradeEntryForm({ studentId, subjectId, semesterId }) {
  // Single grade entry
  // Range validation (0-20)
  // Real-time feedback
}

// components/grades/BulkGradeEntry.jsx
export function BulkGradeEntry({ classId, subjectId, semesterId }) {
  // Table-based bulk entry
  // Inline editing
  // Batch submission
}

// components/grades/GradeHistory.jsx
export function GradeHistory({ gradeId }) {
  // Displays modification history
  // Shows who changed what and when
  // Audit trail visualization
}
```

#### 4. Dashboard Components

```javascript
// components/dashboard/Dashboard.jsx
export function Dashboard() {
  // Main analytics view
  // Orchestrates all dashboard components
  // Manages filter state
}

// components/dashboard/SummaryCards.jsx
export function SummaryCards({ data }) {
  // Displays KPI cards
  // Total students, average, progression
  // Color-coded indicators
}

// components/dashboard/PerformanceBySubjectChart.jsx
export function PerformanceBySubjectChart({ data }) {
  // Bar chart using Chart.js/Recharts
  // Shows average per subject
  // Interactive tooltips
}

// components/dashboard/PerformanceEvolutionChart.jsx
export function PerformanceEvolutionChart({ data }) {
  // Line chart showing trends over time
  // Multiple series (overall, by class)
  // Responsive design
}

// components/dashboard/PerformanceDistributionChart.jsx
export function PerformanceDistributionChart({ data }) {
  // Pie chart showing student distribution
  // Categories: excellent (16-20), good (14-16), average (10-14), poor (<10)
  // Legend with percentages
}

// components/dashboard/FilterPanel.jsx
export function FilterPanel({ filters, onFilterChange }) {
  // Class selector
  // Semester selector
  // Student search
  // Clear filters button
}
```

#### 5. Report Generation Components

```javascript
// components/reports/ReportGenerator.jsx
export function ReportGenerator({ studentId }) {
  // Triggers PDF generation
  // Shows loading state
  // Downloads generated PDF
}

// components/reports/ReportPreview.jsx
export function ReportPreview({ studentId }) {
  // Shows report content before generation
  // Allows customization options
  // Preview mode
}

// services/pdfService.js
export class PDFService {
  static async generateStudentReport(studentData) {
    // Uses jsPDF or React-PDF
    // Formats student info, grades table
    // Embeds performance chart
    // Returns PDF blob
  }
}
```

### API Interfaces

#### REST API Endpoints

**Authentication:**
```
POST   /api/auth/login/          - Login and get JWT token
POST   /api/auth/logout/         - Logout (invalidate token)
POST   /api/auth/refresh/        - Refresh JWT token
GET    /api/auth/me/             - Get current user info
```

**Students:**
```
GET    /api/students/            - List students (paginated, filterable)
POST   /api/students/            - Create student (admin only)
GET    /api/students/{id}/       - Get student details
PUT    /api/students/{id}/       - Update student (admin only)
DELETE /api/students/{id}/       - Delete student (admin only)
GET    /api/students/search/     - Search students by name/ID
```

**Grades:**
```
GET    /api/grades/              - List grades (filterable by student/subject/semester)
POST   /api/grades/              - Create single grade
POST   /api/grades/bulk/         - Create multiple grades
GET    /api/grades/{id}/         - Get grade details
PUT    /api/grades/{id}/         - Update grade
DELETE /api/grades/{id}/         - Delete grade
GET    /api/grades/{id}/history/ - Get grade modification history
```

**Subjects & Classes:**
```
GET    /api/subjects/            - List all subjects
GET    /api/classes/             - List all classes
GET    /api/semesters/           - List all semesters
```

**Analytics:**
```
GET    /api/analytics/summary/                    - Dashboard summary metrics
GET    /api/analytics/performance-by-subject/     - Average per subject
GET    /api/analytics/performance-evolution/      - Performance over time
GET    /api/analytics/performance-distribution/   - Student distribution by category
GET    /api/analytics/student/{id}/               - Detailed student analytics
GET    /api/analytics/class/{id}/statistics/      - Class-level statistics
```

**Reports:**
```
POST   /api/reports/generate/    - Generate PDF report for student
GET    /api/reports/{id}/        - Download generated report
```


## Data Models

### Database Schema (PostgreSQL)

Le schéma de base de données suit la troisième forme normale (3NF) pour garantir l'intégrité des données et minimiser la redondance.

#### Entity-Relationship Diagram

```
┌─────────────────┐
│      User       │
├─────────────────┤
│ id (PK)         │
│ username        │
│ password_hash   │
│ email           │
│ role            │
│ created_at      │
└─────────────────┘
        │
        │ entered_by (FK)
        ▼
┌─────────────────┐         ┌─────────────────┐
│     Class       │         │    Semester     │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ name            │         │ name            │
│ level           │         │ start_date      │
│ academic_year   │         │ end_date        │
└─────────────────┘         │ academic_year   │
        │                   └─────────────────┘
        │ class_assigned_id (FK)      │
        ▼                             │
┌─────────────────┐                   │
│    Student      │                   │
├─────────────────┤                   │
│ id (PK)         │                   │
│ student_id (UK) │                   │
│ first_name      │                   │
│ last_name       │                   │
│ class_id (FK)   │                   │
│ enrollment_date │                   │
│ photo           │                   │
│ is_active       │                   │
└─────────────────┘                   │
        │                             │
        │ student_id (FK)             │ semester_id (FK)
        ▼                             ▼
┌──────────────────────────────────────────┐
│                 Grade                     │
├──────────────────────────────────────────┤
│ id (PK)                                   │
│ student_id (FK)                           │
│ subject_id (FK)                           │
│ semester_id (FK)                          │
│ value                                     │
│ entered_by (FK → User)                    │
│ entered_at                                │
│ updated_at                                │
│ UNIQUE(student_id, subject_id, semester_id)│
└──────────────────────────────────────────┘
        │                             ▲
        │ grade_id (FK)               │ subject_id (FK)
        ▼                             │
┌─────────────────┐         ┌─────────────────┐
│  GradeHistory   │         │    Subject      │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ grade_id (FK)   │         │ name            │
│ old_value       │         │ code (UK)       │
│ new_value       │         │ coefficient     │
│ modified_by (FK)│         └─────────────────┘
│ modified_at     │
└─────────────────┘
        
        ┌─────────────────────────────────────┐
        │      PerformanceIndicator           │
        ├─────────────────────────────────────┤
        │ id (PK)                             │
        │ student_id (FK)                     │
        │ semester_id (FK)                    │
        │ subject_id (FK, nullable)           │
        │ average                             │
        │ standard_deviation                  │
        │ progression_percentage              │
        │ class_rank                          │
        │ calculated_at                       │
        │ UNIQUE(student_id, semester_id, subject_id)│
        └─────────────────────────────────────┘
```

### Table Definitions

#### 1. User Table

```sql
CREATE TABLE auth_user (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(128) NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher')),
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_user_role ON auth_user(role);
CREATE INDEX idx_user_username ON auth_user(username);
```

#### 2. Class Table

```sql
CREATE TABLE academic_class (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    academic_year VARCHAR(9) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_class_academic_year ON academic_class(academic_year);
CREATE UNIQUE INDEX idx_class_name_year ON academic_class(name, academic_year);
```

#### 3. Student Table

```sql
CREATE TABLE academic_student (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    class_id INTEGER NOT NULL REFERENCES academic_class(id) ON DELETE RESTRICT,
    enrollment_date DATE NOT NULL,
    photo VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_class ON academic_student(class_id);
CREATE INDEX idx_student_active ON academic_student(is_active);
CREATE INDEX idx_student_name ON academic_student(last_name, first_name);
```

#### 4. Subject Table

```sql
CREATE TABLE academic_subject (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    coefficient DECIMAL(3, 2) DEFAULT 1.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subject_code ON academic_subject(code);
```

#### 5. Semester Table

```sql
CREATE TABLE academic_semester (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    academic_year VARCHAR(9) NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_semester_year ON academic_semester(academic_year);
CREATE INDEX idx_semester_current ON academic_semester(is_current);
```


#### 6. Grade Table

```sql
CREATE TABLE academic_grade (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES academic_student(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES academic_subject(id) ON DELETE RESTRICT,
    semester_id INTEGER NOT NULL REFERENCES academic_semester(id) ON DELETE RESTRICT,
    value DECIMAL(5, 2) NOT NULL CHECK (value >= 0 AND value <= 20),
    entered_by INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE RESTRICT,
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_grade UNIQUE (student_id, subject_id, semester_id)
);

CREATE INDEX idx_grade_student ON academic_grade(student_id);
CREATE INDEX idx_grade_subject ON academic_grade(subject_id);
CREATE INDEX idx_grade_semester ON academic_grade(semester_id);
CREATE INDEX idx_grade_entered_by ON academic_grade(entered_by);
```

#### 7. GradeHistory Table

```sql
CREATE TABLE academic_grade_history (
    id SERIAL PRIMARY KEY,
    grade_id INTEGER NOT NULL REFERENCES academic_grade(id) ON DELETE CASCADE,
    old_value DECIMAL(5, 2) NOT NULL,
    new_value DECIMAL(5, 2) NOT NULL,
    modified_by INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE RESTRICT,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

CREATE INDEX idx_grade_history_grade ON academic_grade_history(grade_id);
CREATE INDEX idx_grade_history_modified_at ON academic_grade_history(modified_at);
```

#### 8. PerformanceIndicator Table

```sql
CREATE TABLE academic_performance_indicator (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES academic_student(id) ON DELETE CASCADE,
    semester_id INTEGER NOT NULL REFERENCES academic_semester(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES academic_subject(id) ON DELETE CASCADE,
    average DECIMAL(5, 2) NOT NULL,
    standard_deviation DECIMAL(5, 2),
    progression_percentage DECIMAL(6, 2),
    class_rank INTEGER,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_performance UNIQUE (student_id, semester_id, subject_id)
);

CREATE INDEX idx_performance_student ON academic_performance_indicator(student_id);
CREATE INDEX idx_performance_semester ON academic_performance_indicator(semester_id);
CREATE INDEX idx_performance_subject ON academic_performance_indicator(subject_id);
```

### Data Normalization

**First Normal Form (1NF):**
- Toutes les tables ont une clé primaire
- Toutes les colonnes contiennent des valeurs atomiques
- Pas de groupes répétitifs

**Second Normal Form (2NF):**
- Respecte 1NF
- Tous les attributs non-clés dépendent entièrement de la clé primaire
- Exemple: `Grade.value` dépend de la combinaison (student_id, subject_id, semester_id)

**Third Normal Form (3NF):**
- Respecte 2NF
- Aucune dépendance transitive entre attributs non-clés
- Exemple: Les informations de classe sont dans une table séparée, pas dupliquées dans Student

### Data Integrity Constraints

**Foreign Key Constraints:**
- `ON DELETE CASCADE`: Pour Grade et PerformanceIndicator (si étudiant supprimé, supprimer ses données)
- `ON DELETE RESTRICT`: Pour Subject et Semester (empêcher suppression si utilisé)

**Unique Constraints:**
- `student_id`: Identifiant unique par étudiant
- `(student_id, subject_id, semester_id)`: Une seule note par étudiant/matière/semestre
- `subject.code`: Code matière unique

**Check Constraints:**
- `Grade.value`: Entre 0 et 20
- `Semester.end_date > start_date`: Dates cohérentes

**Indexes:**
- Index sur les clés étrangères pour optimiser les jointures
- Index sur les champs de recherche (student_id, name)
- Index sur les champs de filtrage (class_id, semester_id, is_active)

### Sample Data Structure

**Example Student Record:**
```json
{
  "id": 1,
  "student_id": "STU2024001",
  "first_name": "Marie",
  "last_name": "Dupont",
  "class_id": 1,
  "enrollment_date": "2024-09-01",
  "photo": "/media/students/marie_dupont.jpg",
  "is_active": true
}
```

**Example Grade Record:**
```json
{
  "id": 1,
  "student_id": 1,
  "subject_id": 3,
  "semester_id": 1,
  "value": 15.50,
  "entered_by": 2,
  "entered_at": "2024-10-15T14:30:00Z",
  "updated_at": "2024-10-15T14:30:00Z"
}
```

**Example PerformanceIndicator Record:**
```json
{
  "id": 1,
  "student_id": 1,
  "semester_id": 1,
  "subject_id": null,
  "average": 14.75,
  "standard_deviation": 2.34,
  "progression_percentage": 8.5,
  "class_rank": 5,
  "calculated_at": "2024-10-15T14:30:05Z"
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication Round Trip

*For any* valid username and password combination, logging in should return a valid JWT token, and using that token should successfully authenticate subsequent requests. *For any* invalid credentials, login should fail with an appropriate error message.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Role-Based Access Control

*For any* user with administrator role, all administrative endpoints (student CRUD, user management) should be accessible. *For any* user with teacher role, only teaching-related endpoints (grade entry, report generation) should be accessible.

**Validates: Requirements 1.4**

### Property 3: Token Expiration Enforcement

*For any* expired JWT token, API requests should be rejected with 401 Unauthorized status, regardless of the endpoint being accessed.

**Validates: Requirements 1.5**

### Property 4: Student CRUD Integrity

*For any* valid student data, creating a student should succeed and the student should be retrievable with identical data. *For any* student, updating their information should persist the changes. *For any* deleted student, subsequent retrieval attempts should fail, but associated grade data should remain in the database (soft delete).

**Validates: Requirements 2.1, 2.3, 2.4, 2.5**

### Property 5: Student ID Uniqueness

*For any* two student creation requests with the same student_id, the second request should be rejected with a uniqueness constraint error.

**Validates: Requirements 2.6, 8.3**

### Property 6: Student Filtering Correctness

*For any* combination of filters (class, semester, search term), the returned students should match all applied filter criteria, and the result count should equal the number of returned records.

**Validates: Requirements 2.7, 7.1, 7.2, 7.4, 7.5**

### Property 7: Grade Value Validation

*For any* grade value outside the range [0, 20], the grade creation or update should be rejected with a validation error. *For any* grade value within [0, 20], the operation should succeed.

**Validates: Requirements 3.2**

### Property 8: Grade Audit Trail

*For any* grade creation, the system should record the entering user and timestamp. *For any* grade update, the system should create a history record containing the old value, new value, modifier, and timestamp.

**Validates: Requirements 3.3, 3.5**

### Property 9: Grade Uniqueness Constraint

*For any* combination of (student, subject, semester), only one grade record should exist. Attempting to create a duplicate should fail with a uniqueness constraint error.

**Validates: Requirements 8.2**

### Property 10: Automatic Performance Calculation Trigger

*For any* grade creation or update, the system should automatically recalculate and update the affected student's performance indicators (subject average, overall average, progression) within the same transaction.

**Validates: Requirements 3.7, 4.7**

### Property 11: Subject Average Calculation Correctness

*For any* student and subject with multiple grades across semesters, the calculated subject average should equal the arithmetic mean of all grade values for that subject.

**Validates: Requirements 4.1**

### Property 12: Overall Average Calculation Correctness

*For any* student with grades in multiple subjects, the calculated overall average should equal the weighted mean of subject averages, where weights are the subject coefficients.

**Validates: Requirements 4.2**

### Property 13: Progression Calculation Correctness

*For any* student with grades in two consecutive semesters, the progression percentage should equal ((current_average - previous_average) / previous_average) × 100.

**Validates: Requirements 4.3**

### Property 14: Standard Deviation Calculation Correctness

*For any* class with multiple students, the calculated standard deviation should match the statistical formula: σ = sqrt(Σ(xi - μ)² / N), where xi are individual averages, μ is the class mean, and N is the number of students.

**Validates: Requirements 4.4**

### Property 15: Performance Indicator Persistence

*For any* calculated performance indicator, the values should be stored in the database and remain retrievable even after the underlying grades are modified (historical tracking).

**Validates: Requirements 4.6**

### Property 16: Performance Categorization

*For any* student with an average in [16, 20], they should be categorized as "excellent". *For any* average in [14, 16), categorize as "good". *For any* average in [10, 14), categorize as "average". *For any* average below 10, categorize as "poor".

**Validates: Requirements 5.3**

### Property 17: Dashboard Filter Application

*For any* applied filters (class, semester, student), all returned analytics data (charts, summaries, indicators) should reflect only the filtered subset of data.

**Validates: Requirements 5.4**

### Property 18: PDF Report Completeness

*For any* student, a generated PDF report should contain: student identification (name, ID, class), all grades organized by subject and semester, calculated performance indicators (averages, progression, rank), at least one visualization chart, generation metadata (date, generator user).

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8**

### Property 19: PDF Format Validity

*For any* generated report, the output should be a valid PDF file that can be opened by standard PDF readers without errors.

**Validates: Requirements 12.7**

### Property 20: PDF Content Embedding

*For any* student report with grades and performance data, the generated PDF should contain embedded tables (grades) and at least one embedded chart image (performance visualization).

**Validates: Requirements 12.3**

### Property 21: Foreign Key Constraint Enforcement

*For any* attempt to create a grade with a non-existent student_id, subject_id, or semester_id, the database should reject the operation with a foreign key constraint error.

**Validates: Requirements 8.2**

### Property 22: Data Integrity Error Handling

*For any* database constraint violation (unique, foreign key, check constraint), the system should reject the operation, rollback any partial changes, and return a descriptive error message indicating which constraint was violated.

**Validates: Requirements 8.6**

### Property 23: API JSON Response Format

*For any* API endpoint, the response should be valid JSON format. *For any* successful operation, the status code should be 2xx. *For any* client error, the status code should be 4xx. *For any* server error, the status code should be 5xx.

**Validates: Requirements 9.2, 9.3**

### Property 24: Authentication Requirement Enforcement

*For any* protected API endpoint, requests without a valid JWT token should be rejected with 401 Unauthorized status.

**Validates: Requirements 9.4**

### Property 25: API Validation and Error Messages

*For any* invalid request payload (missing required fields, wrong data types, constraint violations), the API should return a 400 Bad Request with a descriptive error message indicating which field(s) failed validation.

**Validates: Requirements 9.7**

### Property 26: Pagination Correctness

*For any* list endpoint with pagination parameters (page, page_size), the response should contain exactly page_size items (or fewer on the last page), and requesting different pages should return non-overlapping subsets of the total dataset.

**Validates: Requirements 2.2, 9.8**

### Property 27: Client-Side Form Validation

*For any* form input that violates validation rules (empty required fields, invalid formats, out-of-range values), the frontend should prevent submission and display validation errors before making an API request.

**Validates: Requirements 10.6**


## Error Handling

### Error Handling Strategy

APAS implémente une stratégie d'error handling en couches avec des messages d'erreur descriptifs à chaque niveau de l'architecture.

### Backend Error Handling

#### 1. Database Layer Errors

**Constraint Violations:**
```python
try:
    student.save()
except IntegrityError as e:
    if 'unique constraint' in str(e):
        raise ValidationError({
            'student_id': 'A student with this ID already exists.'
        })
    elif 'foreign key constraint' in str(e):
        raise ValidationError({
            'class_id': 'The specified class does not exist.'
        })
    else:
        raise ValidationError('Database integrity error occurred.')
```

**Transaction Rollback:**
```python
from django.db import transaction

@transaction.atomic
def bulk_create_grades(grades_data):
    try:
        for grade_data in grades_data:
            Grade.objects.create(**grade_data)
        # Trigger performance calculation
        recalculate_performance()
    except Exception as e:
        # Automatic rollback on any error
        logger.error(f"Bulk grade creation failed: {e}")
        raise
```

#### 2. API Layer Errors

**Validation Errors (400 Bad Request):**
```python
class GradeSerializer(serializers.ModelSerializer):
    def validate_value(self, value):
        if value < 0 or value > 20:
            raise serializers.ValidationError(
                "Grade value must be between 0 and 20."
            )
        return value
    
    def validate(self, data):
        # Check for duplicate grade
        if Grade.objects.filter(
            student=data['student'],
            subject=data['subject'],
            semester=data['semester']
        ).exists():
            raise serializers.ValidationError(
                "A grade already exists for this student, subject, and semester."
            )
        return data
```

**Authentication Errors (401 Unauthorized):**
```python
class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            raise AuthenticationFailed('Authentication token is required.')
        
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired.')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid authentication token.')
        
        return (user, token)
```

**Permission Errors (403 Forbidden):**
```python
class IsAdministrator(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.role != 'admin':
            raise PermissionDenied(
                'Only administrators can perform this action.'
            )
        
        return True
```

**Not Found Errors (404 Not Found):**
```python
class StudentViewSet(ModelViewSet):
    def retrieve(self, request, pk=None):
        try:
            student = Student.objects.get(pk=pk)
        except Student.DoesNotExist:
            raise NotFound(f'Student with ID {pk} does not exist.')
        
        serializer = StudentSerializer(student)
        return Response(serializer.data)
```

**Server Errors (500 Internal Server Error):**
```python
# Global exception handler
def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is None:
        # Unhandled exception
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return Response(
            {'error': 'An internal server error occurred. Please try again later.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return response
```

#### 3. Business Logic Errors

**Calculation Errors:**
```python
class PerformanceCalculator:
    @staticmethod
    def calculate_progression(student_id, current_semester_id, previous_semester_id):
        try:
            current_avg = PerformanceIndicator.objects.get(
                student_id=student_id,
                semester_id=current_semester_id,
                subject_id=None
            ).average
            
            previous_avg = PerformanceIndicator.objects.get(
                student_id=student_id,
                semester_id=previous_semester_id,
                subject_id=None
            ).average
            
            if previous_avg == 0:
                logger.warning(f"Cannot calculate progression: previous average is 0")
                return None
            
            progression = ((current_avg - previous_avg) / previous_avg) * 100
            return round(progression, 2)
            
        except PerformanceIndicator.DoesNotExist:
            logger.warning(f"Missing performance data for progression calculation")
            return None
        except Exception as e:
            logger.error(f"Progression calculation error: {e}")
            raise CalculationError("Failed to calculate progression percentage.")
```

### Frontend Error Handling

#### 1. API Error Handling

**Centralized Error Handler:**
```javascript
// services/apiClient.js
export async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      switch (response.status) {
        case 400:
          throw new ValidationError(errorData);
        case 401:
          // Token expired, redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new AuthenticationError('Session expired. Please login again.');
        case 403:
          throw new PermissionError('You do not have permission to perform this action.');
        case 404:
          throw new NotFoundError(errorData.error || 'Resource not found.');
        case 500:
          throw new ServerError('Server error occurred. Please try again later.');
        default:
          throw new APIError(`Request failed with status ${response.status}`);
      }
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    // Network error
    throw new NetworkError('Network error. Please check your connection.');
  }
}
```

#### 2. Form Validation Errors

**Client-Side Validation:**
```javascript
// components/students/StudentForm.jsx
export function StudentForm({ onSubmit }) {
  const [errors, setErrors] = useState({});
  
  const validate = (formData) => {
    const newErrors = {};
    
    if (!formData.student_id || formData.student_id.trim() === '') {
      newErrors.student_id = 'Student ID is required';
    }
    
    if (!formData.first_name || formData.first_name.trim() === '') {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.enrollment_date) {
      newErrors.enrollment_date = 'Enrollment date is required';
    }
    
    return newErrors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Client-side validation
    const validationErrors = validate(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      await onSubmit(data);
      // Success handling
    } catch (error) {
      if (error instanceof ValidationError) {
        // Display server-side validation errors
        setErrors(error.errors);
      } else {
        // Display generic error message
        toast.error(error.message);
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields with error display */}
      {errors.student_id && <span className="text-red-500">{errors.student_id}</span>}
    </form>
  );
}
```

#### 3. Loading and Error States

**Component Error Boundaries:**
```javascript
// components/ErrorBoundary.jsx
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

**Loading States:**
```javascript
// components/dashboard/Dashboard.jsx
export function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await apiRequest('/api/analytics/summary/');
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => window.location.reload()} 
      />
    );
  }
  
  return <DashboardContent data={data} />;
}
```

### Error Logging and Monitoring

**Backend Logging:**
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': 'logs/errors.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'apas': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
```

**Frontend Error Tracking:**
```javascript
// services/errorTracking.js
export function logError(error, context = {}) {
  console.error('Error:', error, 'Context:', context);
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, LogRocket, etc.
    // errorTrackingService.captureException(error, context);
  }
}
```


## Testing Strategy

### Dual Testing Approach

APAS utilise une approche de test duale combinant les tests unitaires et les tests basés sur les propriétés (property-based testing) pour assurer une couverture complète:

- **Unit tests**: Vérifient des exemples spécifiques, des cas limites, et des conditions d'erreur
- **Property tests**: Vérifient les propriétés universelles à travers tous les inputs possibles
- Les deux approches sont complémentaires et nécessaires pour une couverture complète

### Property-Based Testing Configuration

**Library Selection:**
- **Backend (Python)**: Hypothesis - bibliothèque mature pour property-based testing en Python
- **Frontend (JavaScript)**: fast-check - bibliothèque de property-based testing pour JavaScript/TypeScript

**Configuration Requirements:**
- Minimum 100 itérations par test de propriété (en raison de la randomisation)
- Chaque test de propriété doit référencer sa propriété du document de conception
- Format de tag: `Feature: apas-academic-analytics, Property {number}: {property_text}`

**Example Property Test (Backend):**
```python
# tests/test_properties.py
from hypothesis import given, strategies as st
from hypothesis.extra.django import TestCase
import pytest

class TestAuthenticationProperties(TestCase):
    """
    Feature: apas-academic-analytics
    Property 1: Authentication Round Trip
    """
    
    @given(
        username=st.text(min_size=3, max_size=150, alphabet=st.characters(blacklist_characters='\x00')),
        password=st.text(min_size=8, max_size=128)
    )
    @pytest.mark.property_test
    def test_valid_credentials_return_valid_token(self, username, password):
        """
        For any valid username and password, logging in should return a valid JWT token
        """
        # Create user with generated credentials
        user = User.objects.create_user(username=username, password=password)
        
        # Attempt login
        response = self.client.post('/api/auth/login/', {
            'username': username,
            'password': password
        })
        
        # Should return 200 with token
        assert response.status_code == 200
        assert 'token' in response.json()
        
        # Token should be valid for subsequent requests
        token = response.json()['token']
        auth_response = self.client.get(
            '/api/auth/me/',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        assert auth_response.status_code == 200
        assert auth_response.json()['username'] == username

class TestGradeValidationProperties(TestCase):
    """
    Feature: apas-academic-analytics
    Property 7: Grade Value Validation
    """
    
    @given(grade_value=st.floats(min_value=-100, max_value=100))
    @pytest.mark.property_test
    def test_grade_value_validation(self, grade_value):
        """
        For any grade value, it should be accepted if in [0, 20] and rejected otherwise
        """
        student = Student.objects.create(student_id="TEST001", first_name="Test", last_name="Student")
        subject = Subject.objects.create(name="Math", code="MATH101")
        semester = Semester.objects.create(name="S1", start_date="2024-01-01", end_date="2024-06-30")
        
        response = self.client.post('/api/grades/', {
            'student': student.id,
            'subject': subject.id,
            'semester': semester.id,
            'value': grade_value
        })
        
        if 0 <= grade_value <= 20:
            assert response.status_code == 201
        else:
            assert response.status_code == 400
            assert 'value' in response.json()

class TestPerformanceCalculationProperties(TestCase):
    """
    Feature: apas-academic-analytics
    Property 11: Subject Average Calculation Correctness
    """
    
    @given(
        grades=st.lists(
            st.floats(min_value=0, max_value=20, allow_nan=False, allow_infinity=False),
            min_size=1,
            max_size=10
        )
    )
    @pytest.mark.property_test
    def test_subject_average_calculation(self, grades):
        """
        For any list of grades, the calculated average should equal the arithmetic mean
        """
        student = Student.objects.create(student_id="TEST001", first_name="Test", last_name="Student")
        subject = Subject.objects.create(name="Math", code="MATH101")
        
        # Create grades across different semesters
        for i, grade_value in enumerate(grades):
            semester = Semester.objects.create(
                name=f"S{i+1}",
                start_date=f"2024-{i+1:02d}-01",
                end_date=f"2024-{i+1:02d}-28"
            )
            Grade.objects.create(
                student=student,
                subject=subject,
                semester=semester,
                value=grade_value
            )
        
        # Calculate expected average
        expected_average = sum(grades) / len(grades)
        
        # Get calculated average from system
        indicator = PerformanceIndicator.objects.get(
            student=student,
            subject=subject
        )
        
        # Should match within floating point precision
        assert abs(float(indicator.average) - expected_average) < 0.01
```

**Example Property Test (Frontend):**
```javascript
// tests/properties.test.js
import fc from 'fast-check';
import { validateStudentForm, calculateProgression } from '../utils';

describe('Property Tests - apas-academic-analytics', () => {
  /**
   * Feature: apas-academic-analytics
   * Property 27: Client-Side Form Validation
   */
  test('Property 27: Invalid form inputs should be caught before submission', () => {
    fc.assert(
      fc.property(
        fc.record({
          student_id: fc.string(),
          first_name: fc.string(),
          last_name: fc.string(),
          enrollment_date: fc.option(fc.date(), { nil: null }),
        }),
        (formData) => {
          const errors = validateStudentForm(formData);
          
          // If any required field is empty, there should be errors
          const hasEmptyRequired = 
            !formData.student_id.trim() ||
            !formData.first_name.trim() ||
            !formData.last_name.trim() ||
            !formData.enrollment_date;
          
          if (hasEmptyRequired) {
            expect(Object.keys(errors).length).toBeGreaterThan(0);
          } else {
            expect(Object.keys(errors).length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: apas-academic-analytics
   * Property 13: Progression Calculation Correctness
   */
  test('Property 13: Progression percentage should be calculated correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 20, noNaN: true }),
        fc.float({ min: 0.01, max: 20, noNaN: true }), // Avoid division by zero
        (currentAvg, previousAvg) => {
          const progression = calculateProgression(currentAvg, previousAvg);
          const expected = ((currentAvg - previousAvg) / previousAvg) * 100;
          
          expect(Math.abs(progression - expected)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Strategy

Les tests unitaires se concentrent sur des exemples spécifiques, des cas limites, et des points d'intégration entre composants.

**Backend Unit Tests:**

```python
# tests/test_students.py
import pytest
from django.test import TestCase
from apas.models import Student, Class

class TestStudentManagement(TestCase):
    """Unit tests for student CRUD operations"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            password='admin123',
            role='admin'
        )
        self.client.force_authenticate(user=self.admin_user)
        
        self.test_class = Class.objects.create(
            name='Class A',
            level='Level 1',
            academic_year='2024-2025'
        )
    
    def test_create_student_with_valid_data(self):
        """Example: Creating a student with all required fields should succeed"""
        response = self.client.post('/api/students/', {
            'student_id': 'STU2024001',
            'first_name': 'John',
            'last_name': 'Doe',
            'class_id': self.test_class.id,
            'enrollment_date': '2024-09-01'
        })
        
        assert response.status_code == 201
        assert Student.objects.filter(student_id='STU2024001').exists()
    
    def test_create_student_with_duplicate_id_fails(self):
        """Edge case: Duplicate student ID should be rejected"""
        Student.objects.create(
            student_id='STU2024001',
            first_name='Jane',
            last_name='Smith',
            class_assigned=self.test_class,
            enrollment_date='2024-09-01'
        )
        
        response = self.client.post('/api/students/', {
            'student_id': 'STU2024001',
            'first_name': 'John',
            'last_name': 'Doe',
            'class_id': self.test_class.id,
            'enrollment_date': '2024-09-01'
        })
        
        assert response.status_code == 400
        assert 'student_id' in response.json()
    
    def test_delete_student_preserves_grades(self):
        """Example: Deleting a student should preserve their grade data"""
        student = Student.objects.create(
            student_id='STU2024001',
            first_name='John',
            last_name='Doe',
            class_assigned=self.test_class,
            enrollment_date='2024-09-01'
        )
        
        subject = Subject.objects.create(name='Math', code='MATH101')
        semester = Semester.objects.create(
            name='S1',
            start_date='2024-01-01',
            end_date='2024-06-30'
        )
        
        grade = Grade.objects.create(
            student=student,
            subject=subject,
            semester=semester,
            value=15.0
        )
        
        # Delete student
        response = self.client.delete(f'/api/students/{student.id}/')
        assert response.status_code == 204
        
        # Grade should still exist
        assert Grade.objects.filter(id=grade.id).exists()
```

**Frontend Unit Tests:**

```javascript
// tests/components/StudentForm.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudentForm } from '../components/students/StudentForm';

describe('StudentForm Component', () => {
  test('Example: Displays validation errors for empty required fields', async () => {
    render(<StudentForm onSubmit={jest.fn()} />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/student id is required/i)).toBeInTheDocument();
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
  });
  
  test('Example: Successful submission calls onSubmit with form data', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue({});
    render(<StudentForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/student id/i), {
      target: { value: 'STU2024001' }
    });
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' }
    });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: 'STU2024001',
          first_name: 'John',
          last_name: 'Doe'
        })
      );
    });
  });
  
  test('Edge case: Handles API errors gracefully', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(
      new Error('Network error')
    );
    render(<StudentForm onSubmit={mockOnSubmit} />);
    
    // Fill form and submit
    fireEvent.change(screen.getByLabelText(/student id/i), {
      target: { value: 'STU2024001' }
    });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
```

### Integration Testing

**API Integration Tests:**
```python
# tests/test_integration.py
class TestGradeToPerformanceFlow(TestCase):
    """Integration test: Grade entry triggers performance calculation"""
    
    def test_grade_entry_triggers_performance_calculation(self):
        # Setup
        student = Student.objects.create(...)
        subject = Subject.objects.create(...)
        semester = Semester.objects.create(...)
        
        # Enter grade
        response = self.client.post('/api/grades/', {
            'student': student.id,
            'subject': subject.id,
            'semester': semester.id,
            'value': 15.0
        })
        
        assert response.status_code == 201
        
        # Verify performance indicator was created
        indicator = PerformanceIndicator.objects.get(
            student=student,
            semester=semester,
            subject=subject
        )
        assert indicator.average == 15.0
```

### Test Coverage Goals

- **Backend**: Minimum 80% code coverage
- **Frontend**: Minimum 70% code coverage
- **Property Tests**: All 27 correctness properties implemented
- **Unit Tests**: All edge cases and error conditions covered
- **Integration Tests**: All critical user flows tested

### Running Tests

**Backend:**
```bash
# Run all tests
pytest

# Run property tests only
pytest -m property_test

# Run with coverage
pytest --cov=apas --cov-report=html

# Run specific test file
pytest tests/test_properties.py
```

**Frontend:**
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run property tests only
npm test -- tests/properties.test.js

# Run in watch mode
npm test -- --watch
```


## Deployment Considerations

### Development Environment

**Prerequisites:**
- Node.js 18+ and npm/yarn
- Python 3.10+
- PostgreSQL 14+
- Git

**Setup Steps:**
```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_data  # Generate sample data

# Frontend setup
cd frontend
npm install
npm run dev

# Database setup
createdb apas_db
psql apas_db < schema.sql
```

**Environment Variables:**
```bash
# Backend (.env)
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/apas_db
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Frontend (.env)
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=APAS
```

### Production Deployment

**Backend Deployment (Django):**
- Use Gunicorn or uWSGI as WSGI server
- Configure Nginx as reverse proxy
- Enable HTTPS with SSL certificates
- Set DEBUG=False
- Use environment-specific settings
- Configure static file serving
- Set up database connection pooling
- Enable logging and monitoring

**Frontend Deployment (React):**
- Build production bundle: `npm run build`
- Serve static files via CDN or Nginx
- Configure environment variables for production API
- Enable gzip compression
- Implement caching strategies
- Use code splitting for optimal loading

**Database:**
- Regular backups (daily recommended)
- Connection pooling configuration
- Index optimization for performance
- Query performance monitoring
- Replication for high availability

**Security Considerations:**
- HTTPS enforcement
- CSRF protection enabled
- SQL injection prevention (ORM usage)
- XSS protection (React escaping)
- Rate limiting on API endpoints
- Secure password hashing (Django default)
- JWT token expiration and refresh
- Input validation on all endpoints

### Performance Optimization

**Backend:**
- Database query optimization (select_related, prefetch_related)
- Caching with Redis for frequently accessed data
- Pagination for large datasets
- Async task processing for heavy calculations (Celery)
- Database indexing on foreign keys and search fields

**Frontend:**
- Code splitting and lazy loading
- Memoization of expensive calculations
- Virtual scrolling for large lists
- Debouncing for search inputs
- Image optimization and lazy loading
- Bundle size optimization

### Monitoring and Maintenance

**Logging:**
- Application logs (errors, warnings, info)
- Access logs (API requests)
- Performance logs (slow queries)
- Security logs (authentication attempts)

**Monitoring:**
- Server health monitoring
- Database performance metrics
- API response times
- Error rate tracking
- User activity analytics

**Backup Strategy:**
- Daily automated database backups
- Weekly full system backups
- Backup retention policy (30 days)
- Disaster recovery plan
- Backup restoration testing

## Architecture Diagram (Mermaid)

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end
    
    subgraph "Frontend - React"
        UI[UI Components]
        Auth[Auth Context]
        API[API Client]
        Charts[Chart.js/Recharts]
        PDF[PDF Generator]
    end
    
    subgraph "Backend - Django REST"
        AuthAPI[Authentication API]
        StudentAPI[Student API]
        GradeAPI[Grade API]
        AnalyticsAPI[Analytics API]
        Calc[Performance Calculator]
        Serializers[DRF Serializers]
    end
    
    subgraph "Database - PostgreSQL"
        Users[(Users)]
        Students[(Students)]
        Grades[(Grades)]
        Performance[(Performance Indicators)]
        Classes[(Classes)]
        Subjects[(Subjects)]
    end
    
    Browser --> UI
    UI --> Auth
    UI --> API
    UI --> Charts
    UI --> PDF
    
    API --> AuthAPI
    API --> StudentAPI
    API --> GradeAPI
    API --> AnalyticsAPI
    
    AuthAPI --> Serializers
    StudentAPI --> Serializers
    GradeAPI --> Serializers
    AnalyticsAPI --> Calc
    
    GradeAPI --> Calc
    
    Serializers --> Users
    Serializers --> Students
    Serializers --> Grades
    Calc --> Performance
    
    Students --> Classes
    Grades --> Students
    Grades --> Subjects
    Performance --> Students
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant Teacher
    participant Frontend
    participant API
    participant Calculator
    participant Database
    
    Teacher->>Frontend: Enter grade for student
    Frontend->>Frontend: Validate input (0-20)
    Frontend->>API: POST /api/grades/
    API->>API: Authenticate & authorize
    API->>Database: Save grade
    Database-->>API: Grade saved
    API->>Calculator: Trigger calculation
    Calculator->>Database: Fetch all student grades
    Database-->>Calculator: Return grades
    Calculator->>Calculator: Calculate averages, std dev, progression
    Calculator->>Database: Save performance indicators
    Database-->>Calculator: Indicators saved
    Calculator-->>API: Calculation complete
    API-->>Frontend: Grade created (201)
    Frontend->>Frontend: Update UI
    Frontend->>API: GET /api/analytics/summary/
    API->>Database: Fetch updated analytics
    Database-->>API: Return data
    API-->>Frontend: Analytics data
    Frontend->>Frontend: Render updated charts
    Frontend-->>Teacher: Display updated dashboard
```

## Summary

Ce document de conception fournit une architecture complète pour le système APAS, incluant:

- **Architecture three-tier** avec séparation claire des responsabilités
- **Schéma de base de données normalisé (3NF)** avec contraintes d'intégrité
- **27 propriétés de correction** testables via property-based testing
- **API REST complète** avec authentification JWT et gestion d'erreurs robuste
- **Stratégie de test duale** combinant tests unitaires et tests de propriétés
- **Considérations de déploiement** pour environnements de développement et production

Le système est conçu pour être maintenable, extensible, et performant, avec une attention particulière portée à la qualité du code, la sécurité, et l'expérience utilisateur.

