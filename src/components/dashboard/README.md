# Dashboard Components

This directory contains all components for the APAS Analytics Dashboard.

## Components Overview

### Dashboard (Main Component)
**File:** `Dashboard.tsx`

The main orchestrator component that:
- Fetches analytics data from multiple API endpoints in parallel
- Manages loading, error, and data states
- Handles filter state and triggers data refresh
- Implements auto-refresh every 30 seconds (when no filters active)
- Ensures all charts update within 2 seconds of filter change (Requirement 5.5)

**API Endpoints Used:**
- `/api/analytics/summary/` - Dashboard summary metrics
- `/api/analytics/performance-by-subject/` - Average per subject
- `/api/analytics/performance-evolution/` - Performance over time
- `/api/analytics/performance-distribution/` - Student distribution by category

**Features:**
- Parallel data fetching for optimal performance
- Loading indicators with spinners (Requirement 10.4)
- User-friendly error messages (Requirement 10.5)
- Manual refresh button
- Auto-refresh when new data is available
- Filter persistence during session

### SummaryCards
**File:** `SummaryCards.tsx`

Displays key performance indicators (KPIs) as cards:
- Total Students
- Overall Average
- Progression Rate
- At Risk Students

**Features:**
- Color-coded indicators based on performance levels (Requirement 5.6)
- Hover effects with smooth transitions (150-300ms)
- Border colors indicate status (green=excellent, blue=good, amber=needs improvement, red=warning)
- Uses Fira Code font for numbers (design system)
- All cards have cursor-pointer for interactivity

**Validates:** Requirements 5.6, 10.2

### FilterPanel
**File:** `FilterPanel.tsx`

Provides filtering controls for the dashboard:
- Class selector dropdown
- Semester selector dropdown
- Student search with autocomplete
- Clear all filters button

**Features:**
- Loads filter options from API on mount
- Student search with minimum 2 characters
- Autocomplete dropdown for student selection
- Persists filter state during session (Requirement 7.7)
- Triggers dashboard refresh on filter change (Requirement 7.6)
- Clear filters button (Requirement 7.6)
- Smooth transitions and hover states

**Validates:** Requirements 5.4, 5.5, 7.3, 7.4, 7.6, 7.7

### PerformanceBySubjectChart
**File:** `PerformanceBySubjectChart.tsx`

Bar chart showing average performance by subject using Recharts.

**Features:**
- Interactive tooltips showing subject name, average, and student count (Requirement 11.3)
- Color-coded bars based on performance level
- Responsive design adapting to container size (Requirement 11.4)
- Smooth animations on data load (800ms duration) (Requirement 11.2)
- Legend with clear labeling (Requirement 11.3)
- Angled X-axis labels for readability
- Re-renders within 1 second of data update (Requirement 11.5)

**Validates:** Requirements 5.1, 11.1, 11.2, 11.3, 11.4, 11.6

### PerformanceEvolutionChart
**File:** `PerformanceEvolutionChart.tsx`

Line chart showing performance trends over semesters using Recharts.

**Features:**
- Multiple series support (overall + by class) (Requirement 5.2)
- Smooth line animations (1000ms duration) (Requirement 11.2)
- Interactive tooltips with hover effects (Requirement 11.3)
- Legend with line icons
- Responsive design (Requirement 11.4)
- Conditional class breakdown (hidden when filtering by class/student)
- Consistent color scheme (amber for overall, blue shades for classes)

**Validates:** Requirements 5.2, 11.1, 11.2, 11.5

### PerformanceDistributionChart
**File:** `PerformanceDistributionChart.tsx`

Pie chart showing student distribution by performance category using Recharts.

**Features:**
- Four categories: Excellent (16-20), Good (14-16), Average (10-14), Poor (<10)
- Donut chart style (inner radius for better aesthetics)
- Percentage labels on slices
- Legend with student counts (Requirement 5.3)
- Consistent color scheme (green, blue, amber, red) (Requirement 11.6)
- Interactive tooltips
- Summary statistics below chart
- Smooth animations (800ms duration)

**Validates:** Requirements 5.3, 11.1, 11.6

## Design System Compliance

All components follow the APAS design system:

### Colors
- Primary: `#1E40AF` (blue)
- CTA/Accent: `#F59E0B` (amber)
- Background: `#F8FAFC`
- Text: `#1E3A8A`

### Typography
- Headings: Fira Code (monospace)
- Body: Fira Sans

### Spacing
- Cards: `p-6` (24px padding)
- Gaps: `gap-4` (16px) or `gap-6` (24px)
- Rounded corners: `rounded-xl` (12px)

### Shadows
- Cards: `shadow-md` (0 4px 6px rgba(0,0,0,0.1))
- Hover: `shadow-lg` (0 10px 15px rgba(0,0,0,0.1))

### Interactions
- All clickable elements have `cursor-pointer`
- Smooth transitions: `transition-all duration-200`
- Hover effects: `hover:shadow-lg hover:-translate-y-0.5`
- No layout-shifting transforms

### Accessibility
- All interactive elements have proper cursor states
- Focus states visible for keyboard navigation
- Color is not the only indicator (text labels included)
- Responsive at 1024px+ (Requirement 10.1)

## Performance Requirements

✅ **Filter Update Time:** All charts update within 2 seconds of filter change (Requirement 5.5)
✅ **Chart Re-render Time:** Charts re-render within 1 second of data update (Requirement 11.5)
✅ **Loading Indicators:** Spinners shown during data fetch (Requirement 10.4)
✅ **Error Handling:** User-friendly error messages displayed (Requirement 10.5)

## Usage Example

```tsx
import { Dashboard } from './components/dashboard';

function App() {
  return <Dashboard />;
}
```

## API Contract

The dashboard expects the following API response formats:

### Summary Endpoint
```json
{
  "totalStudents": 120,
  "overallAverage": 14.5,
  "progressionRate": 5.2,
  "atRiskCount": 8
}
```

### Performance by Subject Endpoint
```json
[
  {
    "subject": "Mathematics",
    "subject_code": "MATH101",
    "average": 15.2,
    "student_count": 45
  }
]
```

### Performance Evolution Endpoint
```json
[
  {
    "semester": "1",
    "semester_name": "Semester 1",
    "overall_average": 14.2,
    "class_averages": [
      {
        "class_name": "Class A",
        "average": 14.5
      }
    ]
  }
]
```

### Performance Distribution Endpoint
```json
[
  {
    "category": "Excellent (16-20)",
    "count": 25,
    "percentage": 20.8
  },
  {
    "category": "Good (14-16)",
    "count": 40,
    "percentage": 33.3
  },
  {
    "category": "Average (10-14)",
    "count": 45,
    "percentage": 37.5
  },
  {
    "category": "Poor (<10)",
    "count": 10,
    "percentage": 8.3
  }
]
```

## Testing

To test the dashboard components:

1. Ensure the backend API is running
2. Navigate to `/dashboard` route
3. Verify all charts load within 2 seconds
4. Test filter functionality
5. Verify auto-refresh works (check console for API calls every 30s)
6. Test error handling by stopping the backend

## Future Enhancements

- Export dashboard as PDF
- Customizable chart colors
- Date range filters
- Comparison mode (compare two semesters)
- Real-time updates via WebSocket
