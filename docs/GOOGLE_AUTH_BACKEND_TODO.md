# Google OAuth Backend Integration Guide & TODO

This document outlines the technical requirements for the backend engineering team to enable "Continue with Google" sign-in / registration for the Vismaya platform.

---

## 1. Overview
The frontend includes a Google Sign-In button on both `/login` and `/register` pages, powered by **Google Identity Services (GSI)**.
When a user authenticates via Google in their browser, the frontend obtains a signed Google ID token (JWT credential) and dispatches it to the backend.

---

## 2. API Endpoint Specification

### `POST /api/auth/google`

- **Purpose**: Authenticates or registers a user via Google ID Token.
- **Access**: Public / Unauthenticated

#### Request Headers:
```http
Content-Type: application/json
```

#### Request Payload:
```json
{
  "idToken": "<GOOGLE_ID_TOKEN_JWT_STRING>",
  "role": "talent" | "organization"
}
```
> **Note**: On the `/register` page, the user selects their account type (`talent` or `organization`), which is sent in the `role` field. On the `/login` page, `role` is optional or null.

#### Backend Processing Steps:
1. **Verify Google ID Token**:
   Use official Google API client library (e.g. `google-auth-library` in Node.js / Express):
   ```js
   const { OAuth2Client } = require('google-auth-library');
   const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

   const ticket = await client.verifyIdToken({
     idToken,
     audience: process.env.GOOGLE_CLIENT_ID,
   });
   const payload = ticket.getPayload();
   const { sub: googleId, email, name, picture, email_verified } = payload;
   ```
2. **Account Lookup & Creation**:
   - Query user database by `email` or `googleId`.
   - **If existing user found**: Update `googleId` and `avatar` if missing; retain existing account `role` and permissions.
   - **If user does not exist**: Create a new account with:
     - `email`: verified email from Google ID token
     - `name`: user display name from token
     - `role`: use provided `role` (defaults to `"talent"` if omitted)
     - `status`: `"active"` (Google email is already pre-verified)
     - `avatar`: URL from `picture`
3. **Session & JWT Generation**:
   - Issue your application's standard JWT authentication token and session identifier (matching standard `POST /api/auth/login`).

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": "usr_...",
    "email": "user@example.com",
    "name": "User Name",
    "role": "talent",
    "status": "active",
    "avatar": "https://..."
  },
  "message": "Signed in with Google successfully"
}
```

#### Error Responses:
- **`400 Bad Request`**: Missing `idToken` or invalid token signature.
  ```json
  { "success": false, "message": "Invalid Google credential" }
  ```
- **`409 Conflict`**: Account role mismatch (e.g. existing organization attempting talent signup).

---

## 3. Google Cloud Console Configuration

To allow frontend requests from local and production environments:

1. Open **[Google Cloud Console](https://console.cloud.google.com/)** -> **APIs & Services** -> **Credentials**.
2. Configure **OAuth 2.0 Client IDs** (Web application).
3. Set **Authorized JavaScript origins**:
   - `http://localhost:3000` (Local frontend development)
   - `https://your-production-domain.com` (Production deployment URL)
4. Set **Authorized redirect URIs** (if using server-side redirects):
   - `http://localhost:3000`
   - `https://your-production-domain.com`

---

## 4. Frontend Environment Flags

Once the backend endpoint and Google Cloud credentials are ready, set these in `.env.local`:

```env
# Enable Google Auth button in UI
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true

# Google OAuth Web Client ID from Google Cloud Console
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com

# Connect to real backend
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_MODULES=auth,public
```
