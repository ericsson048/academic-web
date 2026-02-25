# APAS Architecture Documentation

## System Overview

APAS follows a three-tier architecture with clear separation between presentation, application, and data layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                   React Frontend (Vite)                      │
│                                                               │
│  • Authentication UI      • Dashboard Charts                │
│  • Student Management     • Report Generation               │
│  • Grade Entry Forms      • Filtering & Search              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST (JSON)
                              │ JWT Authentication
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│              Django REST Framework Backend                   │
│                                                               │
│  • Authentication API     • Performance Calculations        │
│  • Student CRUD API       • Data Aggregation                │
│  • Grade Management API   • Business Logic                  │
│  • Analytics API          • Validation & Serialization      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ ORM (Django Models)
                              │ SQL Queries
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         DATA LAYER                           │
│                    PostgreSQL Database                       │
│                                                               │
│  • Users & Authentication  • Performance Indicators         │
│  • Students & Classes      • Grade History                  │
│  • Subjects & Grades       • Audit Logs                     │
└─────────────────────────────────────────────────────────────┘
```

## Backend Architecture

### Django Apps Structure

The backend is organized into four Django apps, each with specific responsibilities:

#### 1. Authentication App
- **Purpose**: User authentication and authorization
- **Models**: User (extends AbstractUser)
- **Key Features**:
  - JWT token generation and validation
  - Role-based access control (Admin/Teacher)
  - Session management

#### 2. Students App
- **Purpose**: Student record management
- **Models**: Student, Class
- **Key Features**:
  - CRUD operations for students
  - Soft delete functionality
  - Search and filtering
  - Photo upload support

#### 3. Grades App
- **Purpose**: Grade entry and tracking
- **Models**: Grade, GradeHistory, Subject, Semester
- **Key Features**:
  - Grade validation (0-20 range)
  - Audit trail for modifications
  - Bulk grade entry
  - Automatic performance calculation triggers

#### 4. Analytics App
- **Purpose**: Performance calculations and analytics
- **Models**: PerformanceIndicator
- **Key Features**:
  - Automatic metric calculations
  - Data aggregation for dashboards
  - Statistical computations (mean, std dev, progression)

### Design Patterns

#### Repository Pattern
Django models act as repositories for data access, providing a clean abstraction over database operations.

#### Service Layer
Business logic is separated into service modules:
- `PerformanceCalculator`: Handles all performance metric calculations
- Keeps views thin and focused on HTTP concerns

#### Serializer Pattern
DRF serializers handle:
- Data transformation (Model ↔ JSON)
- Input validation
- Nested relationships

### API Design

#### RESTful Conventions
- Resources are nouns (students, grades, analytics)
- HTTP methods indicate actions (GET, POST, PUT, DELETE)
- Proper status codes (200, 201, 400, 401, 404, 500)

#### Authentication Flow
```
Client → POST /api/auth/login/ → Validate Credentials
       → Generate JWT Token → Return Token
       → Store in LocalStorage

Client → GET /api/students/ (with Bearer Token)
       → Validate Token → Return Data
```

#### Error Handling
- Custom exception handler in `apas/exceptions.py`
- Consistent error response format
- Detailed validation error messages

## Frontend Architecture

### Component Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── students/       # Student management components
│   ├── grades/         # Grade entry components
│   ├── dashboard/      # Dashboard and charts
│   └── reports/        # Report generation components
├── contexts/           # React Context providers
│   └── AuthContext     # Authentication state
├── services/           # API client and services
│   ├── apiClient       # HTTP client with JWT handling
│   └── pdfService      # PDF generation service
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── main.tsx            # Application entry point
```

### State Management

#### Local State
- Component-level state using `useState`
- Form state management

#### Global State
- Authentication state via Context API
- User information and JWT token

#### Server State
- API data fetched on-demand
- No complex client-side caching (future enhancement)

### Routing

React Router handles navigation:
- Public routes: `/login`
- Protected routes: `/dashboard`, `/students`, `/grades`, `/reports`
- Role-based route guards

## Data Flow

### Grade Entry Flow
```
1. Teacher enters grade in form
2. Frontend validates input (0-20 range)
3. POST /api/grades/ with grade data
4. Backend validates and saves grade
5. Django signal triggers performance calculation
6. PerformanceCalculator updates indicators
7. Response returned to frontend
8. Dashboard auto-refreshes with new data
```

### Dashboard Loading Flow
```
1. User navigates to dashboard
2. Frontend fetches analytics data
   - GET /api/analytics/summary/
   - GET /api/analytics/performance-by-subject/
   - GET /api/analytics/performance-evolution/
3. Backend aggregates data from database
4. Calculations performed (if needed)
5. JSON response returned
6. Frontend renders charts with Recharts
7. User can apply filters → repeat from step 2
```

## Database Schema

### Key Tables

#### auth_user
- Primary authentication table
- Extends Django's AbstractUser
- Adds `role` field for RBAC

#### academic_student
- Student records
- Foreign key to academic_class
- Soft delete via `is_active` flag

#### academic_grade
- Grade records
- Foreign keys: student, subject, semester
- Unique constraint: (student, subject, semester)
- Check constraint: value BETWEEN 0 AND 20

#### academic_performance_indicator
- Calculated metrics
- Foreign keys: student, semester, subject (nullable)
- Stores: average, std_dev, progression, rank

### Relationships

```
User (1) ─── enters ──→ (N) Grade
Class (1) ─── contains ──→ (N) Student
Student (1) ─── has ──→ (N) Grade
Subject (1) ─── has ──→ (N) Grade
Semester (1) ─── has ──→ (N) Grade
Grade (1) ─── triggers ──→ (1) PerformanceIndicator calculation
```

## Security

### Authentication
- JWT tokens with configurable expiration
- Tokens stored in localStorage (frontend)
- Bearer token authentication on all protected endpoints

### Authorization
- Role-based permissions (Admin/Teacher)
- Permission classes on viewsets
- Admin-only operations: student CRUD, user management
- Teacher operations: grade entry, report generation

### Data Validation
- Client-side validation (immediate feedback)
- Server-side validation (security)
- Database constraints (data integrity)

### CORS
- Configured for development (localhost:5173)
- Should be restricted in production

## Performance Considerations

### Database Optimization
- Indexes on foreign keys
- Indexes on search fields (student_id, name)
- Indexes on filter fields (is_active, academic_year)

### Query Optimization
- Use `select_related()` for foreign keys
- Use `prefetch_related()` for reverse relationships
- Aggregate queries for analytics

### Frontend Optimization
- Code splitting by route (future)
- Lazy loading of charts
- Debounced search inputs
- Memoization of expensive calculations

## Testing Strategy

### Backend Testing
- **Unit Tests**: Test individual functions and methods
- **Property Tests**: Hypothesis for universal properties
- **Integration Tests**: Test API endpoints end-to-end

### Frontend Testing
- **Unit Tests**: Test components in isolation
- **Property Tests**: fast-check for form validation
- **Integration Tests**: Test user flows

## Deployment Considerations

### Backend Deployment
- Set `DEBUG=False` in production
- Use environment variables for secrets
- Configure static file serving
- Set up proper logging
- Use production-grade WSGI server (Gunicorn)

### Frontend Deployment
- Build production bundle: `npm run build`
- Serve static files via CDN or web server
- Configure API base URL for production

### Database
- Regular backups
- Connection pooling
- Read replicas for scaling (future)

## Future Enhancements

### Potential Improvements
1. **Real-time Updates**: WebSocket for live dashboard updates
2. **Caching**: Redis for frequently accessed data
3. **File Storage**: S3 for student photos and reports
4. **Email Notifications**: Alert teachers of grade changes
5. **Advanced Analytics**: ML-based predictions
6. **Mobile App**: React Native version
7. **Internationalization**: Multi-language support
8. **Audit Logging**: Comprehensive activity logs

## Technology Decisions

### Why Django?
- Mature ORM for complex relationships
- Built-in admin panel
- Strong security features
- Excellent documentation

### Why React?
- Component-based architecture
- Large ecosystem
- TypeScript support
- Good performance

### Why PostgreSQL?
- ACID compliance
- Complex query support
- JSON field support (future use)
- Excellent performance

### Why JWT?
- Stateless authentication
- Scalable (no server-side sessions)
- Works well with SPA architecture

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and rotate secrets quarterly
- Database maintenance (VACUUM, ANALYZE)
- Monitor error logs
- Review and optimize slow queries

### Monitoring
- Application logs (Django logging)
- Error tracking (future: Sentry)
- Performance monitoring (future: New Relic)
- Database monitoring (pg_stat_statements)

---

This architecture is designed to be maintainable, scalable, and follows industry best practices for full-stack web applications.
