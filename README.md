# Easy Check - Authentication & Authorization System

## 🔐 Authentication System Overview

ระบบ Easy Check มีระบบ Authentication ที่สมบูรณ์เพื่อจัดการการเข้าใช้งานและสิทธิ์ของผู้ใช้

## 👥 User Roles & Permissions

### 1. **Employee** (พนักงานทั่วไป)

- ✅ Access: `/home`, `/check-in-out`, `/notice-absence`, `/event-registration`, `/profile`, `/notifications`, `/settings`
- ❌ Cannot access: Admin pages, SuperAdmin pages

### 2. **Admin** (ผู้ดูแลระบบ)

- ✅ Access: All employee pages + `/dashboard`, `/admin/*` pages
- ❌ Cannot access: SuperAdmin pages

### 3. **SuperAdmin** (ผู้ดูแลระบบสูงสุด)

- ✅ Access: All pages including `/superadmin/set-permission`
- ❌ No restrictions (full access)

## 🏗️ Architecture

### Core Components

#### 1. **AuthContext** (`src/context/AuthContext.jsx`)

```javascript
// สร้าง Context สำหรับจัดการ Auth state
export const AuthProvider = ({ children }) => {
  // Provides:
  - user: {id, role, loginTime}
  - login(employeeId, role)
  - logout()
  - isAuthenticated()
  - hasRole(requiredRole)
  - hasAnyRole(roles)
  - loading: boolean
}

// Hook สำหรับใช้ Auth
export const useAuth = () => {}
```

#### 2. **ProtectedRoute** (`src/components/ProtectedRoute.jsx`)

```javascript
// Component สำหรับ protect routes
<ProtectedRoute requiredRole="admin">
  <AdminPage />
</ProtectedRoute>
```

#### 3. **AuthProvider Wrapper** (`src/main.jsx`)

```javascript
<AuthProvider>
  <App />
</AuthProvider>
```

## 🔄 Flow Diagram

```
1. User visits app
   ↓
2. AuthProvider loads user from localStorage
   ↓
3. If user exists → proceed / If not → redirect to /login
   ↓
4. User enters credentials on Login page
   ↓
5. ProtectedRoute checks role
   ↓
6. If authorized → show page / If not → show error or redirect
   ↓
7. User logout → clear localStorage & redirect to /login
```

## 🛠️ Usage

### Login Page

- Navigate to `/login`
- Enter Employee ID and Password
- Or click demo buttons to auto-fill credentials

**Demo Credentials:**

```
Employee:   ID: EMP001, Password: 1234
Admin:      ID: EMP002, Password: 1234
SuperAdmin: ID: EMP003, Password: 1234
```

### Protecting Routes

```jsx
// In App.jsx
<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute requiredRole="admin">
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Using Auth Hook in Components

```jsx
import { useAuth } from "../context/AuthContext";

function MyComponent() {
  const { user, logout, hasRole } = useAuth();

  return (
    <>
      <p>Welcome, {user?.id}</p>
      {hasRole("admin") && <AdminPanel />}
      <button onClick={logout}>Logout</button>
    </>
  );
}
```

### Checking User Role

```jsx
const { user, hasRole, hasAnyRole } = useAuth();

// Check single role
if (hasRole("admin")) {
  // User is admin or superadmin
}

// Check multiple roles
if (hasAnyRole(["admin", "superadmin"])) {
  // User is either admin or superadmin
}

// Check user object directly
console.log(user.role); // 'employee', 'admin', or 'superadmin'
```

## 💾 Data Storage

User data is stored in `localStorage`:

```javascript
{
  "id": "EMP001",
  "role": "employee",
  "loginTime": "2024-01-15T10:30:00.000Z"
}
```

## 🔒 Security Notes

**Current Implementation (Development):**

- Uses localStorage for simplicity
- No password hashing
- Demo credentials hardcoded
- No JWT tokens

**For Production:**

1. Replace localStorage with secure session management
2. Implement proper password hashing (bcrypt, etc.)
3. Use JWT tokens with secure storage
4. Implement refresh tokens
5. Add HTTPS
6. Implement CSRF protection
7. Add rate limiting on login endpoint
8. Implement logout across all tabs
9. Add session timeout
10. Log authentication events

## 🚀 Implementation Steps

### Step 1: Setup AuthProvider

✅ Already done in `main.jsx`

### Step 2: Create ProtectedRoute

✅ Already done in `components/ProtectedRoute.jsx`

### Step 3: Wrap Protected Routes

✅ Already done in `App.jsx`

### Step 4: Use Auth in Components

```jsx
import { useAuth } from "../../context/AuthContext";

function MyComponent() {
  const { user, logout } = useAuth();
  // Use auth in component
}
```

## 📝 Login Flow Example

```
1. User fills login form
   ↓
2. handleLogin validates input
   ↓
3. Checks demo credentials
   ↓
4. If valid → login(employeeId, role)
   ↓
5. AuthContext saves to localStorage
   ↓
6. Redirect to appropriate page based on role:
   - SuperAdmin → /superadmin/set-permission
   - Admin → /dashboard
   - Employee → /home
```

## 🛑 Logout Flow

```
1. User clicks logout button
   ↓
2. Confirmation dialog appears
   ↓
3. logout() clears localStorage
   ↓
4. user state becomes null
   ↓
5. All protected routes trigger redirect to /login
```

## 🔗 Protected Routes List

| Route                 | Required Role | Status       |
| --------------------- | ------------- | ------------ |
| `/`                   | employee      | ✅ Protected |
| `/check-in-out`       | employee      | ✅ Protected |
| `/notice-absence`     | employee      | ✅ Protected |
| `/event-registration` | employee      | ✅ Protected |
| `/profile`            | employee      | ✅ Protected |
| `/dashboard`          | admin         | ✅ Protected |
| `/admin/*`            | admin         | ✅ Protected |
| `/superadmin/*`       | superadmin    | ✅ Protected |

## 🐛 Troubleshooting

**Issue: Always redirected to login**

- Solution: Check localStorage has valid user data
- Check: `localStorage.getItem('user')`

**Issue: Can't access admin pages**

- Solution: Make sure user role is 'admin' or 'superadmin'
- Demo: Use EMP002 or EMP003

**Issue: Page shows "No access"**

- Solution: User doesn't have required role
- Check console for role information

## 📦 Files Modified

- ✅ `src/context/AuthContext.jsx` - Enhanced with more methods
- ✅ `src/components/ProtectedRoute.jsx` - New file
- ✅ `src/App.jsx` - Added ProtectedRoute wrapper
- ✅ `src/main.jsx` - Added AuthProvider
- ✅ `src/pages/Login/Login.jsx` - Uses useAuth hook
- ✅ `src/pages/Profile/Profile.jsx` - Logout functionality

---

**Status**: ✅ Complete and Ready for Testing

