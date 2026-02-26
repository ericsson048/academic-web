# Error Handling Guide

This guide explains how to use the error handling components and utilities in the APAS frontend application.

## Overview

The APAS frontend implements comprehensive error handling at multiple levels:

1. **ErrorBoundary** - Catches React component errors
2. **API Client** - Handles HTTP errors with typed error classes
3. **Error Display Components** - Reusable UI components for showing errors
4. **Form Validation** - Client-side and server-side validation error display

## Components

### ErrorBoundary

Wraps the entire application to catch and display React errors gracefully.

**Usage:**
```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

**Custom Fallback:**
```tsx
<ErrorBoundary fallback={<CustomErrorPage />}>
  <YourComponent />
</ErrorBoundary>
```

### ErrorMessage

Displays general error messages with optional retry functionality.

**Usage:**
```tsx
import { ErrorMessage } from './components/ErrorMessage';

function MyComponent() {
  const [error, setError] = useState<string | null>(null);
  
  if (error) {
    return (
      <ErrorMessage
        title="Failed to load data"
        message={error}
        onRetry={() => fetchData()}
      />
    );
  }
  
  return <div>Content</div>;
}
```

### ValidationErrors

Displays field-level validation errors from API responses.

**Usage:**
```tsx
import { ValidationErrors } from './components/ErrorMessage';

function MyForm() {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  
  const handleSubmit = async (data) => {
    try {
      await api.post('/endpoint/', data);
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors(error.fieldErrors);
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {Object.keys(errors).length > 0 && (
        <ValidationErrors errors={errors} />
      )}
      {/* Form fields */}
    </form>
  );
}
```

### InlineFieldError

Displays validation errors next to individual form fields.

**Usage:**
```tsx
import { InlineFieldError } from './components/ErrorMessage';

function MyForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  return (
    <div>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        className={errors.email ? 'border-red-500' : ''}
      />
      <InlineFieldError error={errors.email} />
    </div>
  );
}
```

### NetworkError

Displays network/connection error messages.

**Usage:**
```tsx
import { NetworkError } from './components/ErrorMessage';

function MyComponent() {
  const [isNetworkError, setIsNetworkError] = useState(false);
  
  if (isNetworkError) {
    return <NetworkError onRetry={() => fetchData()} />;
  }
  
  return <div>Content</div>;
}
```

### LoadingSpinner

Displays loading states during async operations.

**Usage:**
```tsx
import { LoadingSpinner } from './components/LoadingSpinner';

function MyComponent() {
  const [loading, setLoading] = useState(true);
  
  if (loading) {
    return <LoadingSpinner message="Loading data..." />;
  }
  
  return <div>Content</div>;
}

// Full screen loading
<LoadingSpinner fullScreen message="Loading..." />

// Different sizes
<LoadingSpinner size="sm" />
<LoadingSpinner size="md" />
<LoadingSpinner size="lg" />
```

## API Error Handling

### Error Types

The API client provides typed error classes:

- `ValidationError` - 400 Bad Request (validation failures)
- `AuthenticationError` - 401 Unauthorized (auth failures)
- `PermissionError` - 403 Forbidden (permission denied)
- `NotFoundError` - 404 Not Found (resource not found)
- `ServerError` - 500+ Server Errors
- `NetworkError` - Network/connection errors
- `APIError` - Generic API error

### Handling API Errors

**Basic Error Handling:**
```tsx
import { api, ValidationError, NetworkError, getErrorMessage } from './services/apiClient';

async function fetchData() {
  try {
    const data = await api.get('/students/');
    return data;
  } catch (error) {
    // Get user-friendly error message
    const message = getErrorMessage(error);
    console.error('Error:', message);
    throw error;
  }
}
```

**Specific Error Type Handling:**
```tsx
import {
  api,
  ValidationError,
  AuthenticationError,
  NetworkError,
  ServerError
} from './services/apiClient';

async function createStudent(data) {
  try {
    const result = await api.post('/students/', data);
    return result;
  } catch (error) {
    if (error instanceof ValidationError) {
      // Handle validation errors
      console.log('Field errors:', error.fieldErrors);
      setErrors(error.fieldErrors);
    } else if (error instanceof AuthenticationError) {
      // Handle auth errors (usually redirects to login automatically)
      console.log('Authentication failed');
    } else if (error instanceof NetworkError) {
      // Handle network errors
      setNetworkError(true);
    } else if (error instanceof ServerError) {
      // Handle server errors
      setServerError(error.message);
    } else {
      // Handle unknown errors
      setGeneralError('An unexpected error occurred');
    }
  }
}
```

### ValidationError Details

The `ValidationError` class provides field-level error details:

```tsx
try {
  await api.post('/students/', data);
} catch (error) {
  if (error instanceof ValidationError) {
    // Access field errors
    console.log(error.fieldErrors);
    // {
    //   student_id: ['A student with this ID already exists.'],
    //   first_name: ['First name is required.'],
    //   non_field_errors: ['General validation error']
    // }
    
    // Get user-friendly message (first error)
    const message = error.getUserMessage();
    console.log(message); // "student_id: A student with this ID already exists."
  }
}
```

## Complete Form Example

Here's a complete example showing all error handling patterns:

```tsx
import { useState, FormEvent } from 'react';
import { api, ValidationError, NetworkError, getErrorMessage } from '../services/apiClient';
import { ValidationErrors, InlineFieldError, NetworkError as NetworkErrorComponent } from '../components/ErrorMessage';
import { LoadingSpinner, InlineLoader } from '../components/LoadingSpinner';

interface FormData {
  student_id: string;
  first_name: string;
  last_name: string;
  class_id: number;
  enrollment_date: string;
}

export function StudentForm() {
  const [formData, setFormData] = useState<FormData>({
    student_id: '',
    first_name: '',
    last_name: '',
    class_id: 0,
    enrollment_date: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string[]> = {};
    
    if (!formData.student_id.trim()) {
      newErrors.student_id = ['Student ID is required'];
    }
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = ['First name is required'];
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = ['Last name is required'];
    }
    
    if (!formData.enrollment_date) {
      newErrors.enrollment_date = ['Enrollment date is required'];
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    setGeneralError(null);
    setIsNetworkError(false);
    
    // Client-side validation
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await api.post('/students/', formData);
      
      // Success - redirect or show success message
      alert('Student created successfully!');
      
    } catch (error) {
      if (error instanceof ValidationError) {
        // Server-side validation errors
        setErrors(error.fieldErrors);
      } else if (error instanceof NetworkError) {
        // Network error
        setIsNetworkError(true);
      } else {
        // Other errors
        setGeneralError(getErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show network error
  if (isNetworkError) {
    return (
      <NetworkErrorComponent
        onRetry={() => {
          setIsNetworkError(false);
          handleSubmit(new Event('submit') as any);
        }}
      />
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* General validation errors */}
      {Object.keys(errors).length > 0 && (
        <ValidationErrors errors={errors} />
      )}
      
      {/* General error message */}
      {generalError && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700">
          {generalError}
        </div>
      )}
      
      {/* Student ID field */}
      <div>
        <label htmlFor="student_id" className="block text-sm font-medium mb-1">
          Student ID
        </label>
        <input
          id="student_id"
          type="text"
          value={formData.student_id}
          onChange={(e) => {
            setFormData({ ...formData, student_id: e.target.value });
            // Clear field error on change
            if (errors.student_id) {
              setErrors({ ...errors, student_id: undefined });
            }
          }}
          className={`w-full px-3 py-2 border rounded ${
            errors.student_id ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        <InlineFieldError error={errors.student_id} />
      </div>
      
      {/* First name field */}
      <div>
        <label htmlFor="first_name" className="block text-sm font-medium mb-1">
          First Name
        </label>
        <input
          id="first_name"
          type="text"
          value={formData.first_name}
          onChange={(e) => {
            setFormData({ ...formData, first_name: e.target.value });
            if (errors.first_name) {
              setErrors({ ...errors, first_name: undefined });
            }
          }}
          className={`w-full px-3 py-2 border rounded ${
            errors.first_name ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isLoading}
        />
        <InlineFieldError error={errors.first_name} />
      </div>
      
      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        {isLoading && <InlineLoader className="text-white" />}
        {isLoading ? 'Creating...' : 'Create Student'}
      </button>
    </form>
  );
}
```

## Best Practices

1. **Always clear errors on field change** - Clear field-specific errors when the user starts typing
2. **Use client-side validation first** - Validate before making API calls to reduce server load
3. **Show specific error messages** - Use field-level errors when available
4. **Provide retry functionality** - Allow users to retry failed operations
5. **Handle network errors gracefully** - Show clear messages for connection issues
6. **Log errors for debugging** - Console.error for development, error tracking service for production
7. **Use loading states** - Show spinners during async operations
8. **Disable forms during submission** - Prevent duplicate submissions

## Error Logging

For production, integrate an error tracking service:

```tsx
// services/errorTracking.ts
export function logError(error: Error, context?: any) {
  console.error('Error:', error, 'Context:', context);
  
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service (Sentry, LogRocket, etc.)
    // errorTrackingService.captureException(error, context);
  }
}

// Usage in components
try {
  await api.post('/endpoint/', data);
} catch (error) {
  logError(error as Error, { component: 'StudentForm', action: 'create' });
  throw error;
}
```
