# Frontend Azure AD Authentication Guide

## Overview

Your frontend uses **Authorization Code Flow** to authenticate users with Microsoft 365. The backend handles all token validation and exchange.

---

## Configuration Required

### Azure Portal
- Add redirect URI: `http://localhost:3000/auth/callback`
- Add production URI: `https://yourdomain.com/auth/callback`

### Frontend Environment Variables
```
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=e18c1abb-e7af-4178-8937-3a206b7749d1
REDIRECT_URI=http://localhost:3000/auth/callback
BACKEND_URL=http://localhost:8080
```

---

## Implementation Steps

### 1. Login Button

Redirect user to Microsoft authorization URL:

```
https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/authorize?
  client_id={CLIENT_ID}
  &response_type=code
  &redirect_uri={REDIRECT_URI}
  &scope=openid%20profile%20email%20User.Read
  &state={RANDOM_STRING}
```

**Before redirecting:**
- Generate random state string (32+ characters)
- Store state in sessionStorage
- Redirect to URL above

---

### 2. Callback Page

Microsoft redirects to: `{REDIRECT_URI}?code=...&state=...`

**Handle callback:**
1. Extract `code` and `state` from URL query parameters
2. Verify `state` matches stored value (CSRF protection)
3. Clear stored state
4. Send code to backend

---

### 3. Exchange with Backend

**POST** `{BACKEND_URL}/api/auth/azure-login`

**Request:**
```json
{
  "authorizationCode": "code-from-microsoft"
}
```

**Response:**
```json
{
  "accessToken": "jwt-token...",
  "refreshToken": "refresh-token...",
  "tokenType": "Bearer",
  "expiresIn": 3600000,
  "user": {
    "id": 1,
    "email": "user@domain.com",
    "fullName": "User Name",
    "role": "TECHNICIAN"
  }
}
```

---

### 4. Store Tokens

Store `accessToken` and `refreshToken` in:
- **Recommended:** sessionStorage (clears on tab close)
- **Alternative:** Memory only (most secure, loses on refresh)
- **Avoid:** localStorage (persists, higher XSS risk)

---

### 5. Use Token in API Calls

Add to all backend API requests:

```
Authorization: Bearer {accessToken}
```

---

## Security Checklist

- [ ] Verify state parameter on callback (prevents CSRF)
- [ ] Use HTTPS in production (never http://)
- [ ] Generate cryptographically secure random state
- [ ] Clear state after successful verification
- [ ] Never log authorization codes
- [ ] Store tokens securely (sessionStorage recommended)
- [ ] Handle token expiration (401 errors)

---

## User Flow

1. User clicks "Sign in with Microsoft"
2. Redirect to Microsoft login page
3. User enters O365 credentials
4. Microsoft redirects back with authorization code
5. Frontend sends code to backend
6. Backend validates and returns JWT tokens
7. Frontend stores tokens and accesses app

---

## Error Handling

**Microsoft returns error:**
- URL contains `?error=...` parameter
- Show user-friendly error message
- Log error for debugging

**Backend exchange fails:**
- HTTP 401: Invalid or expired code
- HTTP 403: User not in organization or inactive
- Show appropriate error message

**Token expired during session:**
- API returns 401
- Use refresh token to get new access token
- Retry failed request

---

## Testing

1. Click login → redirects to Microsoft
2. Enter O365 credentials → redirects back with code
3. Code exchanges successfully → receives JWT
4. JWT works for protected API calls → 200 OK
5. Invalid state → rejects callback
6. Expired code → shows error message

---

## Production Deployment

**Update environment variables:**
- REDIRECT_URI: `https://yourdomain.com/auth/callback`
- BACKEND_URL: `https://api.yourdomain.com`

**In Azure Portal:**
- Add production redirect URI
- Enable "ID tokens" under Authentication
- Add production domain to allowed origins (if needed)

---

## Support

Backend endpoint: `POST /api/auth/azure-login`
Backend validates all tokens with Microsoft
No client secrets needed in frontend
All security handled server-side
