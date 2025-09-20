# Authentication Integration

This document describes the authentication system that has been integrated into the frontend-lovable project.

## Features Added

### 1. Authentication Context (`src/contexts/AuthContext.tsx`)
- Manages user authentication state
- Provides login/logout functionality
- Persists authentication data in localStorage
- Exports `useAuth` hook for components

### 2. API Integration (`src/lib/api.ts`)
- Defines API base URL and interfaces
- Exports `User` and `AuthResponse` types
- Configurable via environment variables

### 3. Updated Login Page (`src/pages/Login.tsx`)
- Real authentication with backend API
- Sign up and sign in functionality
- Form validation and error handling
- Toast notifications for user feedback

### 4. Updated Home Page (`src/pages/Home.tsx`)
- Authentication protection (redirects to login if not authenticated)
- Displays user profile information
- Shows personalized welcome message

### 5. Profile Component (`src/components/Profile.tsx`)
- Displays user information
- Logout functionality
- Clean, modern UI design

## Backend Integration

The authentication system connects to the existing backend API:
- `POST /api/users` - User registration
- `POST /api/login` - User login
- CORS configuration updated to allow frontend-lovable origin (port 5173)

## Environment Configuration

Create a `.env` file in the frontend-lovable root:
```
VITE_API_URL=http://localhost:8000
```

## Usage

1. Start the backend server: `cd backend && npm start`
2. Start the frontend: `cd frontend-lovable && npm run dev`
3. Navigate to the application and click "Join the Battle" to access login/signup

## Authentication Flow

1. User clicks "Join the Battle" on landing page
2. Redirected to login page
3. Can toggle between sign up and sign in
4. Upon successful authentication, redirected to home page
5. Home page shows user profile and game options
6. User can logout from the profile component

The authentication state persists across browser sessions using localStorage.

## Delete Account Functionality

### Updated Profile Component (`src/components/Profile.tsx`)
- Added delete account button with confirmation dialog
- Uses AlertDialog component for user confirmation
- Sends authenticated DELETE request to `/api/users/:id`
- Includes proper error handling and loading states
- Automatically logs out user and redirects to home after successful deletion

### Security Features
- Requires authentication token in Authorization header
- User can only delete their own account (enforced by backend)
- Confirmation dialog prevents accidental deletions
- Clear warning message about permanent data loss

### API Integration
- `DELETE /api/users/:id` - Delete user account
- Requires Bearer token authentication
- Returns success/error response
- Backend validates user can only delete their own account
