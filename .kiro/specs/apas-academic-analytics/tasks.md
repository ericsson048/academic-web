# Implementation Plan: APAS (Academic Performance Analytics System)

## Overview

This implementation plan breaks down the APAS system into discrete, incremental coding tasks. The system uses Django REST Framework for the backend, React (Vite) with Tailwind CSS for the frontend, and PostgreSQL for the database. Each task builds on previous steps, with property-based tests integrated throughout to validate correctness properties early.

## Tasks

- [x] 1. Project setup and environment configuration
  - Create Django project structure with apps (authentication, students, grades, analytics)
  - Create React project with Vite and configure Tailwind CSS
  - Set up PostgreSQL database and configure Django database connection
  - Create requirements.txt with all Python dependencies (Django 4.2+, DRF 3.14+, Hypothesis, psycopg2)
  - Create package.json with all JavaScript dependencies (React 18+, Chart.js/Recharts, jsPDF, fast-check)
  - Configure CORS settings for development
  - Create .env.example files for both backend and frontend
  - _Requirements: 15.1, 15.2, 15.6_

- [x] 2. Database schema and migrations
  - [x] 2.1 Create Django models for core entities
    - Create User model extending AbstractUser with role field (admin/teacher)
    - Create Class model with name, level, academic_year fields
    - Create Student model with student_id (unique), names, class FK, enrollment_date, photo, is_active
    - Create Subject model with name, code (unique), coefficient
    - Create Semester model with name, start_date, end_date, academic_year, is_current
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 2.2 Create Django models for grades and performance
    - Create Grade model with student FK, subject FK, semester FK, value, entered_by FK, timestamps
    - Add unique constraint on (student, subject, semester)
    - Add check constraint for value range (0-20)
    - Create GradeHistory model for audit trail
    - Create PerformanceIndicator model with student FK, semester FK, subject FK (nullable), calculated metrics
    - _Requirements: 3.2, 3.3, 8.2, 8.4_

  - [x] 2.3 Create database indexes and constraints
    - Add indexes on foreign keys (student_id, subject_id, semester_id, class_id)
    - Add indexes on search fields (student.last_name, student.first_name, student.student_id)
    - Add indexes on filter fields (is_active, academic_year, is_current)
    - Verify all foreign key ON DELETE behaviors (CASCADE for grades, RESTRICT for subjects)
    - _Requirements: 8.5, 8.6_

  - [x] 2.4 Generate and apply database migrations
    - Run makemigrations for all models
    - Review generated migration files for correctness
    - Apply migrations to create database schema
    - Verify schema matches design document specifications
    - _Requirements: 15.3_

  - [ ]* 2.5 Write property test for database constraints
    - **Property 21: Foreign Key Constraint Enforcement**
    - **Validates: Requirements 8.2**

- [x] 3. Authentication system implementation
  - [x] 3.1 Implement JWT authentication backend
    - Create custom JWT authentication class using djangorestframework-simplejwt
    - Implement login view that validates credentials and returns JWT token
    - Implement logout view that invalidates token
    - Implement token refresh endpoint
    - Implement "get current user" endpoint
    - _Requirements: 1.1, 1.2, 1.6_

  - [x] 3.2 Implement role-based permissions
    - Create IsAdministrator permission class
    - Create IsTeacherOrAdmin permission class
    - Apply permissions to appropriate viewsets
    - _Requirements: 1.4_

  - [x] 3.3 Create authentication serializers
    - Create LoginSerializer with username and password validation
    - Create UserSerializer for user profile data
    - Add password hashing in user creation
    - _Requirements: 1.6_

  - [-] 3.4 Write property tests for authentication
    - **Property 1: Authentication Round Trip**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [ ]* 3.5 Write property test for role-based access
    - **Property 2: Role-Based Access Control**
    - **Validates: Requirements 1.4**

  - [ ]* 3.6 Write property test for token expiration
    - **Property 3: Token Expiration Enforcement**
    - **Validates: Requirements 1.5**

- [x] 4. Student management API implementation
  - [x] 4.1 Create student serializers and viewsets
    - Create StudentSerializer with all fields and validation
    - Implement student_id uniqueness validation
    - Create StudentViewSet with CRUD operations
    - Add pagination support (default page size: 20)
    - Add search functionality on student_id, first_name, last_name
    - Add filtering by class_id and is_active
    - Apply IsAdministrator permission to create/update/delete
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 7.1, 7.2_

  - [x] 4.2 Implement soft delete for students
    - Override delete method to set is_active=False instead of deleting
    - Ensure grades are preserved when student is deactivated
    - _Requirements: 2.5_

  - [ ]* 4.3 Write property tests for student CRUD
    - **Property 4: Student CRUD Integrity**
    - **Validates: Requirements 2.1, 2.3, 2.4, 2.5**

  - [ ]* 4.4 Write property test for student ID uniqueness
    - **Property 5: Student ID Uniqueness**
    - **Validates: Requirements 2.6, 8.3**

  - [ ]* 4.5 Write property test for student filtering
    - **Property 6: Student Filtering Correctness**
    - **Validates: Requirements 2.7, 7.1, 7.2, 7.4, 7.5**

- [x] 5. Subject, class, and semester API implementation
  - [x] 5.1 Create serializers and viewsets for supporting entities
    - Create SubjectSerializer and SubjectViewSet (read-only for teachers)
    - Create ClassSerializer and ClassViewSet (read-only for teachers)
    - Create SemesterSerializer and SemesterViewSet (read-only for teachers)
    - Add appropriate permissions (admin can create/edit, teachers can read)
    - _Requirements: 9.5_

- [ ] 6. Checkpoint - Verify basic API structure
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 7. Grade management API implementation
  - [ ] 7.1 Create grade serializers and viewsets
    - Create GradeSerializer with nested student, subject, semester data
    - Implement value range validation (0-20)
    - Implement uniqueness validation for (student, subject, semester)
    - Create GradeViewSet with CRUD operations
    - Add filtering by student_id, subject_id, semester_id
    - Apply IsTeacherOrAdmin permission
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 7.2 Implement grade history tracking
    - Create GradeHistorySerializer
    - Create signal handler to log grade modifications
    - Store old_value, new_value, modified_by, modified_at
    - Create endpoint to retrieve grade history
    - _Requirements: 3.3, 3.5_

  - [ ] 7.3 Implement bulk grade entry
    - Create bulk_create endpoint accepting list of grade objects
    - Validate all grades before creating any (atomic transaction)
    - Return detailed error messages for validation failures
    - _Requirements: 3.6_

  - [ ]* 7.4 Write property test for grade validation
    - **Property 7: Grade Value Validation**
    - **Validates: Requirements 3.2**

  - [ ]* 7.5 Write property test for grade audit trail
    - **Property 8: Grade Audit Trail**
    - **Validates: Requirements 3.3, 3.5**

  - [ ]* 7.6 Write property test for grade uniqueness
    - **Property 9: Grade Uniqueness Constraint**
    - **Validates: Requirements 8.2**

- [ ] 8. Performance calculation service implementation
  - [ ] 8.1 Create PerformanceCalculator service class
    - Implement calculate_subject_average(student_id, subject_id, semester_id) method
    - Implement calculate_overall_average(student_id, semester_id) with coefficient weighting
    - Implement calculate_progression(student_id, current_semester_id, previous_semester_id) method
    - Implement calculate_class_statistics(class_id, semester_id) for mean and standard deviation
    - Implement recalculate_all_indicators(student_id, semester_id) orchestration method
    - Add error handling for edge cases (no grades, division by zero)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 8.2 Create signal handlers for automatic calculation
    - Create post_save signal handler on Grade model
    - Trigger recalculate_all_indicators when grade is created or updated
    - Ensure calculations complete within 3 seconds
    - Use database transactions to ensure atomicity
    - _Requirements: 3.7, 4.5, 4.7_

  - [ ] 8.3 Create PerformanceIndicator serializers and viewsets
    - Create PerformanceIndicatorSerializer
    - Create read-only viewset for retrieving performance indicators
    - Add filtering by student_id, semester_id, subject_id
    - _Requirements: 4.6, 9.6_

  - [ ]* 8.4 Write property test for automatic calculation trigger
    - **Property 10: Automatic Performance Calculation Trigger**
    - **Validates: Requirements 3.7, 4.7**

  - [ ]* 8.5 Write property test for subject average calculation
    - **Property 11: Subject Average Calculation Correctness**
    - **Validates: Requirements 4.1**

  - [ ]* 8.6 Write property test for overall average calculation
    - **Property 12: Overall Average Calculation Correctness**
    - **Validates: Requirements 4.2**

  - [ ]* 8.7 Write property test for progression calculation
    - **Property 13: Progression Calculation Correctness**
    - **Validates: Requirements 4.3**

  - [ ]* 8.8 Write property test for standard deviation calculation
    - **Property 14: Standard Deviation Calculation Correctness**
    - **Validates: Requirements 4.4**

  - [ ]* 8.9 Write property test for performance indicator persistence
    - **Property 15: Performance Indicator Persistence**
    - **Validates: Requirements 4.6**

- [ ] 9. Analytics API implementation
  - [ ] 9.1 Create analytics summary endpoint
    - Implement GET /api/analytics/summary/ endpoint
    - Calculate total_students, overall_average, progression_rate
    - Calculate performance_distribution (excellent/good/average/poor counts)
    - Support filtering by class_id, semester_id
    - Optimize queries using aggregation
    - _Requirements: 5.6_

  - [ ] 9.2 Create performance by subject endpoint
    - Implement GET /api/analytics/performance-by-subject/ endpoint
    - Return list of subjects with average and student count
    - Support filtering by class_id, semester_id
    - _Requirements: 5.1_

  - [ ] 9.3 Create performance evolution endpoint
    - Implement GET /api/analytics/performance-evolution/ endpoint
    - Return time series data of averages by semester
    - Support filtering by class_id, student_id
    - _Requirements: 5.2_

  - [ ] 9.4 Create student performance detail endpoint
    - Implement GET /api/analytics/student/{id}/ endpoint
    - Return comprehensive student data with grades and indicators
    - Include chart-ready data structures
    - _Requirements: 5.4_

  - [ ]* 9.5 Write property test for performance categorization
    - **Property 16: Performance Categorization**
    - **Validates: Requirements 5.3**

  - [ ]* 9.6 Write property test for dashboard filter application
    - **Property 17: Dashboard Filter Application**
    - **Validates: Requirements 5.4**

- [ ] 10. Checkpoint - Verify backend functionality
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 11. Frontend authentication implementation
  - [ ] 11.1 Create authentication context and API client
    - Create AuthContext with login, logout, user state management
    - Create apiClient utility with JWT token handling
    - Implement automatic token attachment to requests
    - Implement token refresh logic
    - Store token in localStorage
    - _Requirements: 1.1, 1.2, 9.4_

  - [ ] 11.2 Create login page and form
    - Create LoginForm component with username and password fields
    - Implement client-side validation
    - Handle login errors and display messages
    - Redirect to dashboard on successful login
    - _Requirements: 1.1, 1.3_

  - [ ] 11.3 Create protected route component
    - Create ProtectedRoute component that checks authentication
    - Redirect to login if not authenticated
    - Check user role for role-based routes
    - _Requirements: 1.4, 1.5_

  - [ ] 11.4 Implement error handling for authentication
    - Handle 401 errors globally (token expiration)
    - Redirect to login on authentication failure
    - Clear token from localStorage on logout
    - _Requirements: 1.5_

- [ ] 12. Frontend student management implementation
  - [ ] 12.1 Create student list page
    - Create StudentList component displaying paginated students
    - Implement search functionality (student_id, name)
    - Implement filtering by class and active status
    - Add edit and delete buttons (admin only)
    - Display loading states and error messages
    - _Requirements: 2.2, 2.7, 7.1, 7.2, 10.4, 10.5_

  - [ ] 12.2 Create student form component
    - Create StudentForm component for create/edit
    - Implement all required fields with validation
    - Add image upload for student photo
    - Handle form submission and API errors
    - Display validation errors inline
    - _Requirements: 2.1, 2.3, 10.6, 10.7_

  - [ ] 12.3 Create student detail/card component
    - Create StudentCard component showing student summary
    - Display key metrics (average, rank, progression)
    - Link to detailed student view
    - _Requirements: 10.3_

  - [ ]* 12.4 Write property test for client-side form validation
    - **Property 27: Client-Side Form Validation**
    - **Validates: Requirements 10.6**

- [ ] 13. Frontend grade management implementation
  - [ ] 13.1 Create grade entry form
    - Create GradeEntryForm component for single grade entry
    - Implement value validation (0-20 range)
    - Display real-time validation feedback
    - Handle submission and display success/error messages
    - _Requirements: 3.1, 3.2, 10.6_

  - [ ] 13.2 Create bulk grade entry component
    - Create BulkGradeEntry component with table-based interface
    - Support inline editing for multiple students
    - Implement batch submission with validation
    - Display progress and error states
    - _Requirements: 3.6_

  - [ ] 13.3 Create grade history component
    - Create GradeHistory component displaying modification timeline
    - Show who changed what and when
    - Format dates and values clearly
    - _Requirements: 3.5_

- [ ] 14. Frontend dashboard implementation
  - [ ] 14.1 Create dashboard layout and summary cards
    - Create Dashboard main component
    - Create SummaryCards component displaying KPIs
    - Show total students, overall average, progression rate
    - Use color-coded indicators for metrics
    - _Requirements: 5.6, 10.2_

  - [ ] 14.2 Create performance by subject chart
    - Create PerformanceBySubjectChart component using Chart.js or Recharts
    - Implement bar chart showing average per subject
    - Add interactive tooltips and legends
    - Ensure responsive design
    - _Requirements: 5.1, 11.1, 11.2, 11.3, 11.4, 11.6_

  - [ ] 14.3 Create performance evolution chart
    - Create PerformanceEvolutionChart component
    - Implement line chart showing trends over semesters
    - Support multiple series (overall, by class)
    - Add smooth animations on data load
    - _Requirements: 5.2, 11.1, 11.2, 11.5_

  - [ ] 14.4 Create performance distribution chart
    - Create PerformanceDistributionChart component
    - Implement pie chart showing student categories
    - Display legend with percentages
    - Use consistent color scheme
    - _Requirements: 5.3, 11.1, 11.6_

  - [ ] 14.5 Create filter panel component
    - Create FilterPanel component with class, semester, student selectors
    - Implement clear filters button
    - Persist filter state during session
    - Trigger dashboard refresh on filter change
    - _Requirements: 5.4, 5.5, 7.3, 7.4, 7.6, 7.7_

  - [ ] 14.6 Implement dashboard data fetching and state management
    - Fetch analytics data from API endpoints
    - Handle loading states with spinners
    - Handle errors with user-friendly messages
    - Implement auto-refresh when new data is available
    - Ensure all charts update within 2 seconds of filter change
    - _Requirements: 5.5, 5.8, 10.4, 10.5_

- [ ] 15. Checkpoint - Verify frontend core functionality
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 16. PDF report generation implementation
  - [ ] 16.1 Create PDF service module
    - Create PDFService class using jsPDF or React-PDF
    - Implement generateStudentReport(studentData) method
    - Configure PDF formatting (margins, headers, footers)
    - Support custom fonts and styling
    - _Requirements: 12.1, 12.2, 12.4_

  - [ ] 16.2 Implement PDF content generation
    - Add student identification section (name, ID, class, photo)
    - Add grades table organized by subject and semester
    - Add performance indicators section (averages, progression, rank)
    - Embed performance chart as image
    - Add generation metadata (date, generator user)
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.8, 12.3_

  - [ ] 16.3 Create report generator component
    - Create ReportGenerator component with generate button
    - Show loading state during PDF generation
    - Trigger download on completion
    - Handle generation errors gracefully
    - Ensure generation completes within 5-10 seconds
    - _Requirements: 6.1, 6.6, 6.7, 12.5, 12.6_

  - [ ]* 16.4 Write property test for PDF report completeness
    - **Property 18: PDF Report Completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 6.8**

  - [ ]* 16.5 Write unit tests for PDF format validity
    - Test that generated PDFs are valid and openable
    - Test that content is properly embedded
    - _Requirements: 12.7_

- [ ] 17. Frontend navigation and layout
  - [ ] 17.1 Create main navigation component
    - Create Navigation component with links to Dashboard, Students, Grades, Reports
    - Implement responsive navigation (desktop and tablet)
    - Show current user info and logout button
    - Apply role-based visibility (admin vs teacher)
    - _Requirements: 10.1, 10.3, 10.8_

  - [ ] 17.2 Create main layout component
    - Create Layout component wrapping all pages
    - Implement consistent header and navigation
    - Ensure responsive design (1024px minimum width)
    - Apply consistent color scheme and typography
    - _Requirements: 10.1, 10.2_

  - [ ] 17.3 Implement routing
    - Set up React Router with all routes
    - Apply ProtectedRoute to authenticated pages
    - Implement 404 page for unknown routes
    - _Requirements: 10.3_

- [ ] 18. API error handling and validation
  - [ ] 18.1 Implement centralized API error handler
    - Create custom exception handler in Django
    - Return consistent JSON error format
    - Use appropriate HTTP status codes
    - Log errors for monitoring
    - _Requirements: 9.2, 9.3, 9.7_

  - [ ] 18.2 Implement request validation
    - Add validation to all serializers
    - Return descriptive error messages
    - Validate data types, required fields, constraints
    - _Requirements: 9.7_

  - [ ] 18.3 Implement frontend error handling
    - Create centralized API client error handler
    - Display user-friendly error messages
    - Handle network errors gracefully
    - Implement error boundaries for React components
    - _Requirements: 10.5_

  - [ ]* 18.4 Write property test for API JSON response format
    - **Property 23: API JSON Response Format**
    - **Validates: Requirements 9.2, 9.3**

  - [ ]* 18.5 Write property test for authentication requirement enforcement
    - **Property 24: Authentication Requirement Enforcement**
    - **Validates: Requirements 9.4**

  - [ ]* 18.6 Write property test for API validation
    - **Property 25: API Validation and Error Messages**
    - **Validates: Requirements 9.7**

  - [ ]* 18.7 Write property test for pagination correctness
    - **Property 26: Pagination Correctness**
    - **Validates: Requirements 2.2, 9.8**

  - [ ]* 18.8 Write property test for data integrity error handling
    - **Property 22: Data Integrity Error Handling**
    - **Validates: Requirements 8.6**

- [ ] 19. Sample data generation
  - [ ] 19.1 Create data seeding management command
    - Create Django management command seed_data
    - Generate 3 classes with 20-30 students each
    - Generate 5 subjects with realistic names and coefficients
    - Generate 2 semesters for current academic year
    - Generate realistic grade distributions (normal distribution around 12/20)
    - Use realistic student ID format
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.7_

  - [ ] 19.2 Create data clearing command
    - Create Django management command clear_sample_data
    - Remove all sample data without affecting schema
    - Provide confirmation prompt
    - _Requirements: 13.6_

  - [ ] 19.3 Optimize seeding performance
    - Use bulk_create for efficient data insertion
    - Ensure seeding completes within 30 seconds
    - Display progress during seeding
    - _Requirements: 13.5_

- [ ] 20. Checkpoint - Verify complete system integration
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 21. Documentation and code quality
  - [ ] 21.1 Write backend code documentation
    - Add docstrings to all Python functions and classes (PEP 257)
    - Add inline comments for complex logic and algorithms
    - Document statistical calculations (mean, std dev, progression formulas)
    - _Requirements: 14.1, 14.2, 14.8_

  - [ ] 21.2 Write frontend code documentation
    - Add JSDoc comments to all JavaScript functions and components
    - Document component props and state
    - Add inline comments for complex logic
    - _Requirements: 14.1, 14.3_

  - [ ] 21.3 Create README documentation
    - Write comprehensive README with project overview
    - Document installation steps for all dependencies
    - Provide setup instructions for development environment
    - Include commands to run frontend and backend servers
    - Add troubleshooting section for common issues
    - Document minimum version requirements
    - _Requirements: 14.4, 15.1, 15.4, 15.6, 15.7_

  - [ ] 21.4 Create API documentation
    - Document all API endpoints with descriptions
    - Provide request/response examples for each endpoint
    - Document authentication requirements
    - Document query parameters and filters
    - _Requirements: 14.7, 9.1_

  - [ ] 21.5 Create architecture documentation
    - Document system architecture and design decisions
    - Create or include database schema diagram
    - Explain data flow between components
    - Document technology stack choices
    - _Requirements: 14.5, 14.6_

  - [ ] 21.6 Create environment configuration templates
    - Create .env.example for backend with all required variables
    - Create .env.example for frontend with all required variables
    - Document each environment variable
    - _Requirements: 15.2_

- [ ] 22. Testing infrastructure and execution
  - [ ] 22.1 Configure backend testing framework
    - Set up pytest configuration
    - Configure Hypothesis for property-based testing
    - Set up test database configuration
    - Configure coverage reporting
    - _Requirements: Testing Strategy_

  - [ ] 22.2 Configure frontend testing framework
    - Set up Jest and React Testing Library
    - Configure fast-check for property-based testing
    - Set up coverage reporting
    - Configure test environment
    - _Requirements: Testing Strategy_

  - [ ]* 22.3 Write remaining unit tests for backend
    - Test edge cases for student management
    - Test error conditions for grade entry
    - Test calculation edge cases (no grades, single grade, etc.)
    - Test API authentication and permissions
    - Test database constraints and transactions
    - _Requirements: Testing Strategy_

  - [ ]* 22.4 Write remaining unit tests for frontend
    - Test form validation edge cases
    - Test error handling in components
    - Test loading states and error boundaries
    - Test chart rendering with empty data
    - Test navigation and routing
    - _Requirements: Testing Strategy_

  - [ ]* 22.5 Write integration tests
    - Test grade entry to performance calculation flow
    - Test authentication to protected resource access flow
    - Test filter application to dashboard update flow
    - Test student creation to listing flow
    - _Requirements: Testing Strategy_

- [ ] 23. Performance optimization
  - [ ] 23.1 Optimize backend queries
    - Add select_related and prefetch_related to reduce queries
    - Verify database indexes are used effectively
    - Optimize analytics aggregation queries
    - Test query performance with large datasets
    - _Requirements: 8.5_

  - [ ] 23.2 Optimize frontend performance
    - Implement code splitting for routes
    - Add memoization for expensive calculations
    - Implement debouncing for search inputs
    - Optimize chart re-rendering
    - Minimize bundle size
    - _Requirements: 10.1, 11.5_

- [ ] 24. Accessibility and responsive design
  - [ ] 24.1 Implement accessibility features
    - Add alt text to all images
    - Add labels to all form inputs
    - Implement keyboard navigation
    - Ensure color is not the only indicator
    - Test with screen readers
    - _Requirements: 10.8_

  - [ ] 24.2 Verify responsive design
    - Test layout at 1024px, 1280px, 1440px, 1920px widths
    - Ensure charts resize properly
    - Verify navigation works on tablets
    - Test forms on different screen sizes
    - _Requirements: 5.7, 10.1_

- [ ] 25. Final integration and deployment preparation
  - [ ] 25.1 Configure CORS for production
    - Update CORS settings for production domains
    - Configure allowed origins
    - Set secure cookie settings
    - _Requirements: 9.9_

  - [ ] 25.2 Configure production settings
    - Set DEBUG=False for production
    - Configure static file serving
    - Set up environment-specific settings
    - Configure logging
    - _Requirements: Deployment Considerations_

  - [ ] 25.3 Create deployment scripts
    - Create script to build frontend production bundle
    - Create script to collect static files
    - Create script to run database migrations
    - Document deployment process
    - _Requirements: 15.5_

  - [ ] 25.4 Verify all requirements are met
    - Review all 15 requirements and verify implementation
    - Test all acceptance criteria
    - Verify all 27 correctness properties are tested
    - Ensure all documentation is complete
    - _Requirements: All_

- [ ] 26. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and error conditions
- Checkpoints ensure incremental validation throughout implementation
- The implementation follows a bottom-up approach: database → backend API → frontend UI
- All property tests should run with minimum 100 iterations due to randomization
- Integration tests verify critical user flows work end-to-end
