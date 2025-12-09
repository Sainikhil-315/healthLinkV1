# Admin User Setup Guide

## Overview
Admins are created directly in the database using Postman (or similar API tools). They are not created through the registration flow.

## How Admin Login Works

1. Admin creates account via Postman (direct database entry)
2. Admin logs in with email and password through the app's login screen
3. AppNavigator detects `user.role === 'admin'` 
4. App redirects to **AdminNavigator** → Admin Dashboard

---

## Step 1: Create Admin User via Postman

### Request Details
```
Method: POST
URL: http://your-backend-server/api/v1/users
Headers:
  Content-Type: application/json

Body (raw JSON):
{
  "fullName": "John Admin",
  "email": "admin@healthlink.com",
  "phone": "9876543210",
  "password": "AdminPassword123",
  "role": "admin",
  "isEmailVerified": true,
  "isPhoneVerified": true,
  "isActive": true
}
```

### Expected Response (201 Created)
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Admin",
      "email": "admin@healthlink.com",
      "phone": "9876543210",
      "role": "admin",
      "isEmailVerified": true,
      "isPhoneVerified": true,
      "isActive": true
    }
  }
}
```

---

## Step 2: Login as Admin

### On Mobile App
1. Open the HealthLink app
2. Tap "Sign In" button
3. Enter email: `admin@healthlink.com`
4. Enter password: `AdminPassword123`
5. Tap "Login"

### What Happens Behind the Scenes
```
Login Request
    ↓
Backend validates credentials
    ↓
Returns user object with role: "admin"
    ↓
Frontend stores user in authStore
    ↓
AppNavigator checks user.role
    ↓
Detects role === "admin"
    ↓
Renders AdminNavigator (Admin Dashboard)
```

---

## Step 3: Access Admin Features

Once logged in as admin, you'll have access to:
- User management dashboard
- Hospital verification
- Ambulance management
- Statistics & analytics
- System settings
- etc.

---

## Creating Multiple Admins

Repeat the Postman request with different email addresses and names:

```json
{
  "fullName": "Sarah Admin",
  "email": "sarah.admin@healthlink.com",
  "phone": "9876543211",
  "password": "SarahPassword123",
  "role": "admin",
  "isEmailVerified": true,
  "isPhoneVerified": true,
  "isActive": true
}
```

---

## Important Notes

⚠️ **Security Considerations:**
- Never share admin credentials
- Use strong, unique passwords
- Admin creation should require backend access (secure environment)
- Consider adding IP whitelisting for POST /users endpoint
- Implement admin approval workflow if needed

✅ **Best Practices:**
- Create admins during deployment/setup phase
- Don't expose admin creation endpoint publicly
- Use environment variables for initial admin credentials
- Log all admin creation attempts
- Require multi-factor authentication for admin accounts (future enhancement)

---

## Testing the Flow

### Test Case 1: Admin Login
1. Create admin via Postman
2. Open app and go to login screen
3. Enter admin credentials
4. ✅ Should redirect to Admin Dashboard

### Test Case 2: Regular User Login
1. Register as regular user through app
2. Login with user credentials
3. ✅ Should redirect to User Dashboard

### Test Case 3: Hospital Login
1. Register hospital via separate endpoint
2. Login with hospital credentials
3. ✅ Should redirect to Hospital Dashboard

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Admin can't login | Check if role is set to "admin" in database |
| Redirects to User Dashboard instead of Admin | Verify user.role in localStorage via DevTools |
| Getting 404 on POST /users | Check backend endpoint exists and is not protected |
| Password not working | Ensure password is hashed before storage |

