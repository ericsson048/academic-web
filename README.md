# APAS - Academic Performance Analytics System

APAS (Academic Performance Analytics System) is a full-stack web application designed to analyze and visualize student academic performance. The system tracks student grades, calculates performance metrics, and provides interactive analytics dashboards for teachers and administrators.

## Features

- **User Authentication**: Secure JWT-based authentication with access/refresh token rotation and role-based access control (Administrator/Teacher)
- **Student Management**: Complete CRUD operations for student records with photo upload support
- **Grade Management**: Record and track student grades with audit history
- **Performance Analytics**: Automatic calculation of averages, standard deviations, and progression metrics
- **Interactive Dashboard**: Visual analytics with charts (bar, line, pie) using Recharts
- **PDF Report Generation**: Generate comprehensive academic reports for students
- **Advanced Filtering**: Search and filter students, grades, and analytics by multiple criteria
- **Form Validation**: Client-side and server-side validation with inline error messages
- **Image Upload**: Student photo upload with preview, file type and size validation

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
- **Icons**: Lucide React
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
│   │   ├── ProtectedRoute.tsx # Route protection component
│   │   └── students/          # Student management components
│   │       └── StudentForm.tsx # Student create/edit form
│   ├── services/              # API services
│   │   └── apiClient.ts       # API client with JWT handling
│   ├── context/               # React contexts
│   │   └── AuthContext.tsx    # Authentication context
│   ├── utils/                 # Utility functions
│   ├── types/                 # TypeScript types
│   │   ├── student.ts         # Student-related type definitions
│   │   └── grade.ts           # Grade-related type definitions
│   └── main.tsx               # Entry point
├── package.json               # Node.js dependencies
├── vite.config.ts             # Vite configuration
└── README.md                  # This file
```

## Authentication Architecture

APAS uses a dual-token JWT authentication system for enhanced security:

### Token Types

1. **Access Token**: Short-lived token (60 minutes default) used for API requests
2. **Refresh Token**: Long-lived token (24 hours default) used to obtain new access tokens

### Authentication Flow

```
1. User Login
   ├─> POST /api/auth/login/ with credentials
   ├─> Backend validates and returns access + refresh tokens
   └─> Frontend stores both tokens in localStorage

2. API Requests
   ├─> Include access token in Authorization header
   ├─> If access token expired (401 response)
   ├─> Automatically call /api/auth/refresh/ with refresh token
   ├─> Get new access token
   └─> Retry original request

3. User Logout
   ├─> POST /api/auth/logout/ with refresh token
   ├─> Backend blacklists refresh token
   └─> Frontend clears all tokens from localStorage
```

### Security Features

- **Token Rotation**: Access tokens expire after 60 minutes, requiring refresh
- **Token Blacklisting**: Refresh tokens are blacklisted on logout to prevent reuse
- **Automatic Refresh**: Frontend automatically refreshes expired access tokens
- **Secure Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
- **Role-Based Access**: Endpoints protected by user role (admin/teacher)

### Frontend Implementation

#### API Client (`src/services/apiClient.ts`)

The API client provides a robust HTTP client with comprehensive error handling, automatic token refresh, and type-safe error classes.

**Core Features:**
- Automatic JWT token attachment to requests
- Automatic token refresh on 401 responses
- Comprehensive error handling with custom error classes
- Type-safe error responses
- Network error detection and handling
- User-friendly error messages

**Error Classes:**

The API client exports specialized error classes for different error scenarios:

```typescript
// Base error class
class APIError extends Error {
  constructor(message: string, status: number, data?: any)
}

// Validation errors (400)
class ValidationError extends APIError {
  fieldErrors: Record<string, string[]>
  getUserMessage(): string  // Returns user-friendly error message
}

// Authentication errors (401)
class AuthenticationError extends APIError

// Permission errors (403)
class PermissionError extends APIError

// Not found errors (404)
class NotFoundError extends APIError

// Server errors (500, 502, 503)
class ServerError extends APIError

// Network/connection errors
class NetworkError extends Error
```

**Usage Examples:**

```typescript
import { api, ValidationError, getErrorMessage } from './services/apiClient';

// Basic GET request
try {
  const students = await api.get('/students/');
  console.log(students);
} catch (error) {
  console.error(getErrorMessage(error));
}

// POST request with validation error handling
try {
  const newStudent = await api.post('/students/', {
    student_id: 'STU2024001',
    first_name: 'Marie',
    last_name: 'Dupont',
    class_assigned: 1,
    enrollment_date: '2024-09-01'
  });
} catch (error) {
  if (error instanceof ValidationError) {
    // Access field-specific errors
    console.log(error.fieldErrors);
    // Get user-friendly message
    console.log(error.getUserMessage());
  }
}

// PUT request
await api.put('/students/1/', updatedData);

// DELETE request
await api.delete('/students/1/');
```

**Error Response Parsing:**

The API client intelligently parses error responses from various formats:
- JSON responses with `error`, `detail`, or `message` fields
- Plain text responses
- Malformed responses (uses status text as fallback)

**Automatic Token Refresh Flow:**

```
1. Request fails with 401 Unauthorized
   ↓
2. Automatically call /api/auth/refresh/ with refresh token
   ↓
3. If refresh succeeds:
   - Store new access token
   - Retry original request with new token
   - Return successful response
   ↓
4. If refresh fails:
   - Clear all tokens from localStorage
   - Redirect to login page
   - Throw AuthenticationError
```

**Helper Functions:**

```typescript
// Get user-friendly error message from any error type
function getErrorMessage(error: unknown): string

// Example usage
try {
  await api.post('/grades/', gradeData);
} catch (error) {
  const message = getErrorMessage(error);
  setErrorMessage(message);  // Display to user
}
```

**Network Error Handling:**

The client detects network failures and connection issues:
- Fetch API errors (network disconnected)
- CORS errors
- DNS resolution failures
- Timeout errors

All network errors are wrapped in a `NetworkError` with a user-friendly message.

**Best Practices:**

1. **Always use try-catch blocks** when making API calls
2. **Use getErrorMessage()** for displaying errors to users
3. **Check error types** for specific handling (ValidationError, AuthenticationError, etc.)
4. **Handle ValidationError field errors** for form validation feedback
5. **Don't catch and ignore errors** - always provide user feedback

#### AuthContext

The `AuthContext` provides:
- `user`: Current user object with role information
- `accessToken`: Current access token for API requests
- `refreshToken`: Refresh token for obtaining new access tokens
- `isAuthenticated`: Boolean indicating authentication status
- `login(accessToken, refreshToken, user)`: Store authentication data
- `logout()`: Clear authentication and blacklist refresh token
- `refreshAccessToken()`: Obtain new access token using refresh token

#### ProtectedRoute Component

The `ProtectedRoute` component provides route-level authentication and authorization:

**Features:**
- Redirects unauthenticated users to login page
- Preserves intended destination for post-login redirect
- Enforces role-based access control (admin/teacher)
- Displays user-friendly access denied page for unauthorized access

**Usage:**

```tsx
import ProtectedRoute from './components/ProtectedRoute';

// Protect any authenticated route
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Protect admin-only routes
<Route path="/admin/users" element={
  <ProtectedRoute requiredRole="admin">
    <UserManagement />
  </ProtectedRoute>
} />

// Protect teacher and admin routes
<Route path="/grades" element={
  <ProtectedRoute requiredRole="teacher">
    <GradeManagement />
  </ProtectedRoute>
} />
```

**Props:**
- `children`: React components to render if authorized
- `requiredRole?`: Optional role requirement ('admin' | 'teacher')

### TypeScript Type Definitions

APAS uses TypeScript for type safety in the frontend. Key type definitions are located in `src/types/`.

#### Student Types (`src/types/student.ts`)

**Student Interface:**
```typescript
interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  class_assigned: number;
  class_name?: string;
  enrollment_date: string;
  photo?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
```

**StudentFormData Interface:**
Used for creating/updating students with form data:
```typescript
interface StudentFormData {
  student_id: string;
  first_name: string;
  last_name: string;
  class_assigned: number;
  enrollment_date: string;
  photo?: File | null;
  is_active?: boolean;
}
```

**StudentListResponse Interface:**
Paginated API response format:
```typescript
interface StudentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Student[];
}
```

**StudentPerformance Interface:**
Performance metrics for a student:
```typescript
interface StudentPerformance {
  average: number;
  rank: number | null;
  progression_percentage: number | null;
  total_students?: number;
}
```

**Class Interface:**
Class/group information:
```typescript
interface Class {
  id: number;
  name: string;
  level: string;
  academic_year: string;
}
```

**Usage Example:**
```typescript
import { Student, StudentFormData } from './types/student';

// Fetching students
const response: StudentListResponse = await api.get('/students/');
const students: Student[] = response.results;

// Creating a student
const formData: StudentFormData = {
  student_id: 'STU2024001',
  first_name: 'Marie',
  last_name: 'Dupont',
  class_assigned: 1,
  enrollment_date: '2024-09-01',
  is_active: true
};
```

#### Grade Types (`src/types/grade.ts`)

**Subject Interface:**
```typescript
interface Subject {
  id: number;
  name: string;
  code: string;
  coefficient: number;
  description?: string;
  created_at?: string;
}
```

**Semester Interface:**
```typescript
interface Semester {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  academic_year: string;
  is_current: boolean;
  created_at?: string;
}
```

**Grade Interface:**
```typescript
interface Grade {
  id: number;
  student: number;
  subject: number;
  semester: number;
  value: number;
  entered_by: number;
  entered_at: string;
  updated_at: string;
  // Nested data for display
  student_name?: string;
  subject_name?: string;
  semester_name?: string;
}
```

**GradeFormData Interface:**
Used for creating/updating grades with form data:
```typescript
interface GradeFormData {
  student: number;
  subject: number;
  semester: number;
  value: string;
}
```

**GradeHistory Interface:**
Audit trail for grade modifications:
```typescript
interface GradeHistory {
  id: number;
  grade: number;
  old_value: number;
  new_value: number;
  modified_by: number;
  modified_at: string;
  reason?: string;
  // Nested data
  modified_by_name?: string;
}
```

**BulkGradeEntry Interface:**
Used for bulk grade entry operations:
```typescript
interface BulkGradeEntry {
  student_id: number;
  student_name: string;
  value: string;
  error?: string;
}
```

**Usage Example:**
```typescript
import { Grade, GradeFormData, Subject, Semester } from './types/grade';

// Fetching grades
const grades: Grade[] = await api.get('/grades/?student=1&semester=1');

// Creating a grade
const gradeData: GradeFormData = {
  student: 1,
  subject: 3,
  semester: 1,
  value: '15.50'
};
await api.post('/grades/', gradeData);

// Bulk grade entry
const bulkGrades: BulkGradeEntry[] = [
  { student_id: 1, student_name: 'Marie Dupont', value: '15.50' },
  { student_id: 2, student_name: 'Jean Martin', value: '14.00' }
];
```

### Student Management Components

#### StudentForm Component (`src/components/students/StudentForm.tsx`)

A comprehensive modal form component for creating and editing student records with full validation and image upload support.

**Features:**
- Create new students or edit existing records
- Client-side validation with inline error messages
- Photo upload with preview (JPEG, PNG, WebP, max 5MB)
- Multipart/form-data submission for file uploads
- Server-side validation error handling
- Loading states and disabled controls during submission
- Responsive modal design with backdrop blur
- Follows APAS design system (Fira Code/Fira Sans fonts, color palette)

**Props:**
```typescript
interface StudentFormProps {
  student?: Student | null;  // If provided, form is in edit mode
  onSuccess: () => void;     // Callback after successful save
  onCancel: () => void;      // Callback when user cancels
}
```

**Usage:**
```tsx
import StudentForm from './components/students/StudentForm';

// Create new student
<StudentForm
  onSuccess={() => {
    // Refresh student list
    fetchStudents();
    setShowForm(false);
  }}
  onCancel={() => setShowForm(false)}
/>

// Edit existing student
<StudentForm
  student={selectedStudent}
  onSuccess={() => {
    fetchStudents();
    setShowForm(false);
  }}
  onCancel={() => setShowForm(false)}
/>
```

**Validation Rules:**
- Student ID: Required, cannot be changed after creation
- First Name: Required
- Last Name: Required
- Class: Required (must select from available classes)
- Enrollment Date: Required
- Photo: Optional, max 5MB, JPEG/PNG/WebP only
- Active Status: Optional checkbox (default: true)

**API Integration:**
- Fetches available classes from `/api/classes/`
- Creates student via `POST /api/students/` with multipart/form-data
- Updates student via `PUT /api/students/{id}/` with multipart/form-data
- Handles `ValidationError` from API client for server-side validation
- Displays inline error messages for each field

**Design System Compliance:**
- Uses Lucide React icons (X, Upload, AlertCircle)
- Implements APAS color palette (#1E40AF primary, #F59E0B CTA)
- Fira Code for headings, Fira Sans for body text
- Smooth transitions (150-200ms) on all interactive elements
- Proper cursor states (cursor-pointer on clickable elements)
- Focus states with ring-2 for accessibility
- Responsive grid layout for form fields

### Grade Management Components

#### BulkGradeEntry Component (`src/components/grades/BulkGradeEntry.tsx`)

A comprehensive modal component for entering grades for multiple students simultaneously in a table-based interface.

**Features:**
- Table-based bulk grade entry for entire class
- Real-time validation with visual feedback (0-20 range)
- Subject and semester selection with pre-fill support
- Inline editing with color-coded validation states
- Progress tracking during batch submission
- Loading states for data fetching and submission
- Success/error feedback with detailed messages
- Responsive modal design with scrollable table
- Follows APAS design system

**Props:**
```typescript
interface BulkGradeEntryProps {
  classId: number;           // Required: Class to enter grades for
  subjectId?: number;        // Optional: Pre-select subject
  semesterId?: number;       // Optional: Pre-select semester
  onSuccess: () => void;     // Callback after successful save
  onCancel: () => void;      // Callback when user cancels
}
```

**Usage:**
```tsx
import BulkGradeEntry from './components/grades/BulkGradeEntry';

// Basic usage - user selects subject and semester
<BulkGradeEntry
  classId={1}
  onSuccess={() => {
    fetchGrades();
    setShowBulkEntry(false);
  }}
  onCancel={() => setShowBulkEntry(false)}
/>

// Pre-filled subject and semester
<BulkGradeEntry
  classId={1}
  subjectId={3}
  semesterId={1}
  onSuccess={() => {
    fetchGrades();
    setShowBulkEntry(false);
  }}
  onCancel={() => setShowBulkEntry(false)}
/>
```

**Validation Rules:**
- Subject: Required (dropdown selection)
- Semester: Required (dropdown selection)
- Grade Value: Optional per student, must be 0-20 if provided
- At least one grade must be entered to submit
- Real-time validation with color-coded feedback:
  - Green border: Valid grade (0-20)
  - Red border: Invalid grade (out of range or invalid number)
  - Gray border: Empty field

**API Integration:**
- Fetches students from `/api/students/?class_assigned={classId}&is_active=true`
- Fetches subjects from `/api/subjects/`
- Fetches semesters from `/api/semesters/`
- Submits grades via `POST /api/grades/bulk/` with array of grade objects
- Handles `ValidationError` for individual grade validation errors
- Maps server errors back to specific student rows

**User Experience:**
- Loading spinner while fetching students
- Sticky table header for easy reference while scrolling
- Row hover effects for better readability
- Counter showing number of grades entered
- Progress bar during submission
- Success message with auto-close after 1.5 seconds
- Disabled state during submission to prevent duplicate entries

**Design System Compliance:**
- Uses Lucide React icons (X, AlertCircle, CheckCircle, Loader, Save)
- Implements APAS color palette (#1E40AF primary, #F59E0B CTA)
- Fira Code for student IDs and grade inputs, Fira Sans for text
- Smooth transitions (150-200ms) on all interactive elements
- Proper cursor states (cursor-pointer on interactive elements)
- Focus states with ring-2 for accessibility
- Responsive modal with max-height and scrollable content

### Report Generation Components

#### ReportGenerator Component (`src/components/reports/ReportGenerator.tsx`)

A comprehensive component for generating and downloading PDF academic reports for individual students with full loading states and error handling.

**Features:**
- One-click PDF report generation and download
- Loading state with spinner and progress message
- Success feedback with auto-dismiss
- Error handling with detailed error messages
- Automatic filename generation with student ID and date
- Blob URL cleanup after download
- Accessible button states and ARIA labels
- Follows APAS design system

**Props:**
```typescript
interface ReportGeneratorProps {
  studentId: number;        // Required: Student ID to generate report for
  studentName?: string;     // Optional: Student name for accessibility label
  className?: string;       // Optional: Additional CSS classes
}
```

**Usage:**
```tsx
import { ReportGenerator } from './components/reports/ReportGenerator';

// Basic usage
<ReportGenerator studentId={1} />

// With student name for better accessibility
<ReportGenerator 
  studentId={1} 
  studentName="Marie Dupont"
  className="mt-4"
/>

// In Reports page - integrated into student cards
<ReportGenerator
  studentId={student.id}
  studentName={`${student.first_name} ${student.last_name}`}
  className="w-full"
/>
```

**Button States:**
- Default: Blue button with "Generate PDF Report" text and FileText icon
- Loading: Gray button with spinner and "Generating..." text
- Success: Green button with "Downloaded!" text and Download icon (3 second auto-dismiss)
- Disabled: Reduced opacity, not clickable during generation

**User Experience:**
- Loading message: "Fetching student data and generating PDF... This may take a few seconds."
- Success message: "Report generated successfully! Check your downloads folder."
- Error display: Red alert box with error icon and detailed error message
- Automatic file download with descriptive filename: `academic_report_STU2024001_2024-02-26.pdf`

**API Integration:**
- Fetches student data via `PDFService.fetchStudentReportData(studentId)`
- Generates PDF via `PDFService.generateStudentReport(reportData)`
- Returns PDF as Blob for browser download
- Handles network errors and API failures gracefully

**Design System Compliance:**
- Uses Lucide React icons (FileText, Download, Loader2, AlertCircle)
- Implements APAS color palette (blue-600 primary, green-600 success, red-600 error)
- Smooth transitions (duration-200) on all state changes
- Proper cursor states (cursor-not-allowed when disabled)
- Accessible ARIA labels and role attributes
- Shadow elevation on hover (shadow-sm to shadow-md)

**Integration in Reports Page:**
The ReportGenerator component is integrated into the Reports page (`src/pages/Reports.tsx`) where it:
- Displays in student cards within a responsive grid layout (1/2/3 columns)
- Shows student information (name, ID, class) above the report button
- Provides full-width button styling for consistent card design
- Includes empty state when no students are available
- Handles missing class assignments with fallback text

#### ReportGeneratorCompact Component

A compact version of the ReportGenerator designed for use in tables, cards, or space-constrained layouts.

**Features:**
- Minimal button design with icon and "PDF" label
- Inline error display below button
- Same PDF generation functionality as full component
- Optimized for table rows and card actions
- Follows APAS design system

**Props:**
```typescript
interface ReportGeneratorProps {
  studentId: number;        // Required: Student ID to generate report for
  className?: string;       // Optional: Additional CSS classes
}
```

**Usage:**
```tsx
import { ReportGeneratorCompact } from './components/reports/ReportGenerator';

// In a table row
<tr>
  <td>{student.name}</td>
  <td>{student.average}</td>
  <td>
    <ReportGeneratorCompact studentId={student.id} />
  </td>
</tr>

// In a student card
<div className="student-card">
  <h3>{student.name}</h3>
  <ReportGeneratorCompact 
    studentId={student.id}
    className="mt-2"
  />
</div>
```

**Button States:**
- Default: Light blue background (bg-blue-50) with blue text
- Hover: Darker blue background (bg-blue-100)
- Loading: Spinner icon replaces FileText icon
- Disabled: Reduced opacity during generation

**Visual Design:**
- Small button size (px-3 py-1.5) for compact layouts
- Text size: text-sm for consistency with table text
- Icon size: w-4 h-4 for proportional scaling
- Inline error message: text-xs below button
- No success state (silent success for minimal UI)

**Design System Compliance:**
- Uses Lucide React icons (FileText, Loader2)
- Light blue color scheme (blue-50/blue-100/blue-700)
- Smooth transitions (transition-colors) on hover
- Proper cursor states (cursor-not-allowed when disabled)
- Accessible title attribute for tooltip
- ARIA role on error message

### Dashboard Components

#### SummaryCards Component (`src/components/dashboard/SummaryCards.tsx`)

A dashboard component that displays key performance indicators (KPIs) in a responsive card grid layout with color-coded indicators.

**Features:**
- Four KPI cards: Total Students, Overall Average, Progression Rate, At Risk Students
- Color-coded left border indicators based on performance thresholds
- Icon-based visual representation for each metric
- Hover effects with smooth transitions and subtle lift
- Responsive grid layout (1 column mobile, 2 columns tablet, 4 columns desktop)
- Real-time data updates from analytics API
- Follows APAS design system

**Props:**
```typescript
interface SummaryCardsProps {
  data: {
    totalStudents: number;        // Total number of students
    overallAverage: number;       // Overall class average (0-20)
    progressionRate: number;      // Progression percentage (can be negative)
    atRiskCount: number;          // Number of students at risk (average < 10)
  };
}
```

**Usage:**
```tsx
import { SummaryCards } from './components/dashboard/SummaryCards';

// Fetch analytics data
const analyticsData = await api.get('/analytics/summary/');

// Display summary cards
<SummaryCards
  data={{
    totalStudents: analyticsData.total_students,
    overallAverage: analyticsData.overall_average,
    progressionRate: analyticsData.progression_rate,
    atRiskCount: analyticsData.at_risk_count
  }}
/>
```

**Card Indicators:**
Each card has a color-coded left border based on performance thresholds:

1. **Total Students Card:**
   - Icon: Users (blue)
   - No indicator (neutral gray border)

2. **Overall Average Card:**
   - Icon: Award (green)
   - Excellent (green): Average ≥ 14
   - Good (blue): Average ≥ 10
   - Needs Improvement (amber): Average < 10

3. **Progression Rate Card:**
   - Icon: TrendingUp (green/red based on value)
   - Excellent (green): Progression ≥ 5%
   - Good (blue): Progression ≥ 0%
   - Declining (red): Progression < 0%
   - Background color changes based on positive/negative progression

4. **At Risk Students Card:**
   - Icon: AlertCircle (red)
   - Warning (red): At risk count > 0
   - Good (blue): At risk count = 0

**Visual Design:**
- White background with rounded corners (rounded-xl)
- Shadow elevation (shadow-md) with hover lift (shadow-lg)
- Icon badges with colored backgrounds matching card theme
- Large, bold metric values using Fira Code font
- Subtle hover animation (translate-y-0.5)
- Smooth transitions (duration-200) on all interactions

**Responsive Behavior:**
- Mobile (< 768px): Single column, full width cards
- Tablet (768px - 1024px): 2 columns grid
- Desktop (≥ 1024px): 4 columns grid
- Consistent gap-4 spacing between cards

**Design System Compliance:**
- Uses Lucide React icons (Users, TrendingUp, Award, AlertCircle)
- Implements APAS color palette (#1E40AF primary, #F59E0B CTA)
- Fira Code for metric values, Fira Sans for labels
- Smooth transitions (200ms) on hover states
- Proper cursor states (cursor-pointer on cards)
- Accessible color contrast for all text elements
- Follows card component specifications from design system

**Integration with Analytics API:**
The component expects data from the `/api/analytics/summary/` endpoint which returns:
```json
{
  "total_students": 85,
  "overall_average": 14.25,
  "progression_rate": 3.5,
  "at_risk_count": 8
}
```

### Navigation Component

#### Navigation Component (`src/components/Navigation.tsx`)

A sidebar navigation component that provides the main navigation structure for the application with role-based menu visibility and user profile display.

**Features:**
- Sidebar layout with brand logo and navigation links
- Role-based navigation item visibility (admin/teacher)
- Active route highlighting with visual feedback
- User profile display with avatar and role badge
- Logout functionality with confirmation
- Keyboard navigation support (Enter/Space for logout)
- Accessible ARIA labels and navigation structure
- Follows APAS design system

**Navigation Items:**
- Dashboard (LayoutDashboard icon) - `/` - Available to: admin, teacher
- Students (Users icon) - `/students` - Available to: admin, teacher
- Grades (BarChart3 icon) - `/grades` - Available to: admin, teacher
- Reports (FileText icon) - `/reports` - Available to: admin, teacher

**Layout Structure:**
```
┌─────────────────────┐
│ [A] APAS            │ ← Brand/Logo
├─────────────────────┤
│ ▶ Dashboard         │ ← Navigation Links
│   Students          │   (Active state highlighted)
│   Grades            │
│   Reports           │
│                     │
│                     │
│                     │
├─────────────────────┤
│ [U] User Name       │ ← User Profile
│     Role            │
│ [→] Sign Out        │ ← Logout Button
└─────────────────────┘
```

**Visual Design:**
- Width: 256px (w-64) fixed sidebar
- Background: Deep blue (#1E3A8A) matching APAS primary color
- Text: Light slate-300 for inactive, white for active
- Active state: Blue background (#1E40AF) with shadow-lg
- Hover state: Semi-transparent blue (#1E40AF/50)
- Logo badge: Amber background (#F59E0B) with white "A" letter
- User avatar: Amber background with user initial
- Smooth transitions (duration-200) on all interactions

**User Profile Section:**
- Displays user's first initial in circular avatar
- Shows full name (or username if name not available)
- Displays user role with capitalization (Admin/Teacher)
- Truncates long names with ellipsis
- Sign out button with LogOut icon

**Accessibility Features:**
- `role="navigation"` with `aria-label="Main navigation"`
- `aria-current="page"` on active navigation items
- `aria-hidden="true"` on decorative icons
- `aria-label="Sign out"` on logout button
- Keyboard navigation support with Enter/Space keys
- Focus states with ring-2 and proper offset
- Semantic HTML structure

**Integration with AuthContext:**
- Uses `useAuth()` hook to access user data and logout function
- Filters navigation items based on `user.role`
- Calls `logout()` function on sign out button click
- Displays user information from `user` object

**Integration with React Router:**
- Uses `useLocation()` to detect active route
- Uses `<Link>` components for client-side navigation
- Highlights active route with visual feedback
- Preserves navigation state during route changes

**Design System Compliance:**
- Uses Lucide React icons (LayoutDashboard, Users, BarChart3, FileText, LogOut)
- Implements APAS color palette (#1E3A8A primary, #1E40AF secondary, #F59E0B CTA)
- Fira Code for brand name and avatar, Fira Sans for navigation text
- Smooth transitions (200ms) on all interactive elements
- Proper cursor states (cursor-pointer on all clickable elements)
- Focus states with ring-2 for keyboard navigation
- Consistent spacing with Tailwind spacing scale

**Usage:**
```tsx
import Navigation from './components/Navigation';

// In main layout
<div className="flex h-screen">
  <Navigation />
  <main className="flex-1 overflow-auto">
    {/* Page content */}
  </main>
</div>
```

**Future Enhancements:**
- Navigation items can be extended with additional routes
- Role-based visibility can be customized per item
- Collapsible sidebar for mobile responsiveness
- Badge notifications for new items/alerts
- Nested navigation for sub-sections

### Error Handling Components

#### ErrorBoundary Component (`src/components/ErrorBoundary.tsx`)

A React error boundary component that catches JavaScript errors anywhere in the component tree and displays a fallback UI instead of crashing the entire application.

**Features:**
- Catches and handles React component errors gracefully
- Prevents entire app from crashing when a component error occurs
- Displays user-friendly error UI with recovery options
- Logs error details to console for debugging
- Supports custom fallback UI via props
- Provides "Try again" and "Go to home" recovery actions
- Expandable error details section for developers
- Follows APAS design system

**Props:**
```typescript
interface ErrorBoundaryProps {
  children: ReactNode;      // Components to wrap and protect
  fallback?: ReactNode;     // Optional custom fallback UI
}
```

**Usage:**

```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

// Wrap entire app
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Wrap specific sections
<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>

// With custom fallback UI
<ErrorBoundary fallback={<CustomErrorPage />}>
  <ComplexComponent />
</ErrorBoundary>
```

**Error Recovery Options:**
1. **Try again**: Resets error boundary state and attempts to re-render the component
2. **Go to home**: Navigates user to home page (`/`) for a fresh start

**Default Error UI:**
- Centered modal-style error display
- Red warning icon in circular badge
- "Something went wrong" heading
- User-friendly error message
- Expandable error details section (for developers)
- Two action buttons: "Try again" and "Go to home"
- Responsive design with proper spacing and shadows

**Error Details Section:**
- Collapsible `<details>` element
- Shows error message and component stack trace
- Formatted in monospace font for readability
- Scrollable for long error messages
- Only visible when error details are available

**Integration Points:**
The ErrorBoundary should be placed at strategic points in the component tree:

```tsx
// App-level (catches all errors)
<ErrorBoundary>
  <AuthProvider>
    <Router>
      <Routes>
        {/* All routes */}
      </Routes>
    </Router>
  </AuthProvider>
</ErrorBoundary>

// Page-level (isolates errors to specific pages)
<Route path="/dashboard" element={
  <ErrorBoundary>
    <Dashboard />
  </ErrorBoundary>
} />

// Component-level (protects critical components)
<ErrorBoundary fallback={<ChartErrorFallback />}>
  <PerformanceChart data={data} />
</ErrorBoundary>
```

**Lifecycle Methods:**
- `getDerivedStateFromError(error)`: Updates state to trigger fallback UI
- `componentDidCatch(error, errorInfo)`: Logs error details and updates state with error info

**Error Logging:**
- Logs errors to browser console with full stack trace
- Includes component stack for debugging
- Can be extended to send errors to external tracking services (Sentry, LogRocket, etc.)

**Design System Compliance:**
- Uses inline SVG icons (warning triangle)
- Implements APAS color palette (red-600 for error, gray for neutral)
- Clean, centered layout with proper spacing
- Rounded corners (rounded-lg) on container and buttons
- Shadow elevation (shadow-lg) for modal effect
- Smooth transitions on button hover states
- Accessible color contrast for all text elements
- Responsive design with proper mobile padding

**Best Practices:**
- Place ErrorBoundary at app root to catch all errors
- Use multiple boundaries to isolate errors to specific sections
- Provide custom fallback UI for critical components
- Log errors to external service in production
- Test error boundaries with intentional errors during development
- Don't use error boundaries for event handlers (use try-catch instead)

**Limitations:**
Error boundaries do NOT catch errors in:
- Event handlers (use try-catch)
- Asynchronous code (setTimeout, promises)
- Server-side rendering
- Errors thrown in the error boundary itself

**Future Enhancements:**
- Integration with error tracking service (Sentry, LogRocket)
- Automatic error reporting with user context
- Retry with exponential backoff
- Error categorization and custom handling per error type
- User feedback form for error reports

### Reports Page

#### Reports Page (`src/pages/Reports.tsx`)

A dedicated page for browsing students and generating their academic PDF reports with a card-based layout.

**Features:**
- Grid layout displaying all students in cards (responsive: 1/2/3 columns)
- Student information display (name, ID, class assignment)
- Integrated ReportGenerator component in each card
- Loading state with spinner during data fetch
- Error handling with retry functionality
- Empty state when no students are available
- Fallback text for students without class assignments
- Filter button placeholder for future filtering functionality
- Follows APAS design system

**Layout Structure:**
```
┌─────────────────────────────────────────────────┐
│ Academic Reports                    [Filter]    │
│ Generate PDF reports for individual students    │
├─────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│ │ [Avatar] │  │ [Avatar] │  │ [Avatar] │      │
│ │ Name     │  │ Name     │  │ Name     │      │
│ │ Class    │  │ Class    │  │ Class    │      │
│ │ [Report] │  │ [Report] │  │ [Report] │      │
│ └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
```

**User Experience:**
- Loading spinner with "Loading students..." message during initial fetch
- Error display with retry button if fetch fails
- Empty state with FileText icon and "No students found" message
- Student cards with hover shadow elevation effect
- Avatar initials generated from first and last name
- Student ID displayed in monospace font for readability
- Class name with fallback "No class assigned" for unassigned students
- Full-width report generation button in each card

**API Integration:**
- Fetches students from `/api/students/` on page load
- Uses `api.get()` with automatic JWT token handling
- Handles loading, error, and success states
- Displays paginated results (uses `results` array from response)

**Responsive Behavior:**
- Mobile (< 768px): Single column, full width cards
- Tablet (768px - 1024px): 2 columns grid
- Desktop (≥ 1024px): 3 columns grid
- Consistent gap-4 spacing between cards

**Design System Compliance:**
- Uses Lucide React icons (FileText, Filter, Loader2)
- Implements APAS color palette (slate for text, indigo for avatars)
- Smooth transitions (transition-shadow, transition-colors) on interactions
- Proper spacing with space-y-6 for vertical rhythm
- Rounded corners (rounded-xl) on cards and buttons
- Shadow elevation (shadow-sm to shadow-md on hover)
- Accessible color contrast for all text elements

#### GradeHistory Component (`src/components/grades/GradeHistory.tsx`)

A comprehensive modal component for displaying the complete modification history and audit trail of a grade.

**Features:**
- Timeline-based visualization of grade modifications
- Color-coded change indicators (green for increase, red for decrease)
- Relative time formatting for recent changes (e.g., "2 hours ago")
- Absolute timestamps for older modifications
- Change percentage and absolute difference calculations
- User attribution for each modification
- Optional modification reason display
- Loading states and error handling
- Empty state for grades with no history
- Responsive modal design with scrollable timeline
- Follows APAS design system

**Props:**
```typescript
interface GradeHistoryProps {
  gradeId: number;      // Required: Grade ID to fetch history for
  onClose: () => void;  // Callback when user closes modal
}
```

**Usage:**
```tsx
import GradeHistoryComponent from './components/grades/GradeHistory';

// Display grade history modal
<GradeHistoryComponent
  gradeId={selectedGrade.id}
  onClose={() => setShowHistory(false)}
/>
```

**Data Display:**
- Previous Value: Displayed in gray with "Previous" label
- Updated Value: Displayed in primary blue with "Updated" label
- Change Indicator: Arrow icon (TrendingUp/TrendingDown) with color coding
- Absolute Difference: Shown with +/- prefix
- Percentage Change: Calculated from old to new value
- Modification Time: Relative for recent (< 7 days), absolute for older
- Modified By: User name or user ID if name unavailable
- Reason: Optional field displayed if provided

**API Integration:**
- Fetches history from `/api/grades/{gradeId}/history/`
- Returns array of `GradeHistory` objects sorted by modification time
- Handles loading states during fetch
- Displays user-friendly error messages on failure

**Timeline Visualization:**
- Vertical timeline line connecting all modifications
- Color-coded dots indicating change direction:
  - Green: Grade increased
  - Red: Grade decreased
  - Gray: No change (same value)
- Cards with hover effects for each modification
- Most recent modification appears at the top

**User Experience:**
- Loading spinner while fetching history
- Empty state with helpful message when no modifications exist
- Summary footer showing total number of modifications
- Smooth transitions on hover and interactions
- Backdrop blur effect for modal overlay
- Close button in header and footer

**Design System Compliance:**
- Uses Lucide React icons (Clock, User, TrendingUp, TrendingDown, X, AlertCircle, Loader)
- Implements APAS color palette (#1E40AF primary, #F59E0B CTA, green/red for changes)
- Fira Code for grade values and change amounts, Fira Sans for text
- Smooth transitions (150-200ms) on all interactive elements
- Proper cursor states (cursor-pointer on close button)
- Responsive modal with max-height (90vh) and scrollable content
- Accessible color contrast for all text elements

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

**Note:** The project uses Vitest with global test APIs (describe, it, expect) configured in `tsconfig.json`. This allows writing tests without explicit imports of test functions.

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
- `POST /api/auth/login/` - Login and get JWT access/refresh tokens
- `POST /api/auth/logout/` - Logout and blacklist refresh token
- `POST /api/auth/refresh/` - Refresh access token using refresh token
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
| `JWT_REFRESH_TOKEN_LIFETIME` | JWT refresh token lifetime (minutes) | `1440` |
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

### TypeScript Type Definitions Missing

If you see TypeScript errors about missing type definitions for React or Vitest:

```bash
# Install React type definitions
npm install --save-dev @types/react @types/react-dom

# Install Vitest (includes type definitions)
npm install --save-dev vitest
```

The project is configured to use Vitest global test APIs in `tsconfig.json` with `"types": ["vitest/globals"]`, which enables using `describe`, `it`, `expect` without imports.

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
