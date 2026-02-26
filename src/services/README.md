# APAS Frontend Services

## API Client (`apiClient.ts`)

The API client provides a centralized way to make authenticated requests to the backend API with automatic JWT token handling.

### Features

- **Automatic Token Attachment**: Automatically attaches JWT access token to all requests
- **Token Refresh**: Automatically refreshes expired access tokens using refresh token
- **Error Handling**: Provides typed error classes for different error scenarios
- **Type Safety**: Full TypeScript support with generic types

### Usage

```typescript
import { api } from '../services/apiClient';

// GET request
const students = await api.get('/students/');

// POST request
const newStudent = await api.post('/students/', {
  student_id: 'STU2024001',
  first_name: 'John',
  last_name: 'Doe',
});

// PUT request
const updatedStudent = await api.put(`/students/${id}/`, data);

// DELETE request
await api.delete(`/students/${id}/`);
```

### Error Handling

The API client throws typed errors that can be caught and handled:

```typescript
import { 
  ValidationError, 
  AuthenticationError, 
  PermissionError,
  NotFoundError,
  ServerError,
  NetworkError 
} from '../services/apiClient';

try {
  await api.post('/students/', data);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors (400)
    console.log(error.data); // Field-specific errors
  } else if (error instanceof AuthenticationError) {
    // Handle authentication errors (401)
    // User will be automatically redirected to login
  } else if (error instanceof PermissionError) {
    // Handle permission errors (403)
  } else if (error instanceof NotFoundError) {
    // Handle not found errors (404)
  } else if (error instanceof ServerError) {
    // Handle server errors (500)
  } else if (error instanceof NetworkError) {
    // Handle network errors
  }
}
```

### Token Refresh Flow

1. Request is made with access token
2. If 401 Unauthorized is received, automatically attempt token refresh
3. If refresh succeeds, retry original request with new token
4. If refresh fails, clear tokens and redirect to login

### Configuration

Set the API base URL via environment variable:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

If not set, defaults to `/api` (uses Vite proxy in development).
