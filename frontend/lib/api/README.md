# Vismaya Frontend API Integration Layer

This directory contains the centralized HTTP client, domain service wrappers, data mappers, and configuration switch mechanisms for connecting the Vismaya Next.js 16 frontend with the Express/Mongoose backend.

---

## 1. Environment & Switch Configuration

The integration architecture uses a dual-mode toggle system allowing full mock operation for design review/prototyping or modular/full live backend execution.

### Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_USE_MOCK` | `boolean` | `true` | When `true` (or omitted), frontend uses mock seeds and local state. When `false`, real HTTP requests are dispatched for enabled modules. |
| `NEXT_PUBLIC_API_MODULES` | `string` | `""` | Comma-separated list of modules to connect to live backend when `NEXT_PUBLIC_USE_MOCK=false`. Use `"all"` or `"*"` for all modules, or list individual modules (e.g. `auth,talent,opportunities`). |
| `NEXT_PUBLIC_API_URL` | `string` | `http://localhost:5000` | Base URL for the Express API server. |

### Supported Module Keys
- `auth`: Authentication, sessions, OTP, password recovery
- `talent`: Talent profiles, portfolios, profile completion, analytics
- `recruiter`: Production company profiles, projects, casting calls, candidate review
- `admin`: User moderation, media moderation queue, opportunity review, audit logs, broadcasts
- `public`: Landing page statistics, directory search, contact inquiry
- `applications`: Application submissions, status tracking, withdrawals
- `auditions`: Audition requests, admin relay, self-tape submissions
- `notifications`: Notification feeds, mark as read, unread counts
- `media` / `uploads`: Binary media upload, Cloudinary upload endpoints
- `payments`: Razorpay orders, credit packages, transactions, invoices

---

## 2. API Client Architecture (`client.js`)

All network communication must pass strictly through `frontend/lib/api/client.js`. Direct `fetch`, `axios`, or ad-hoc token handling in UI pages or components is strictly disallowed.

### Key Capabilities:
1. **Automatic Bearer Token Injection**: Reads `vismaya_auth_token` from `localStorage` on client-side requests and attaches `Authorization: Bearer <token>`.
2. **Envelope Unwrapping**: Handles standard backend responses (`{ success: true, data: ... }` or raw responses) and returns standardized payload shapes.
3. **Normalized Error Model (`ApiError`)**:
   - Status `0`: Network failure / offline
   - Status `401`: Unauthorized / expired session (clears token, triggers login redirect in real mode)
   - Status `403`: Forbidden / insufficient role permissions
   - Status `404`: Resource not found
   - Status `408`: Request timeout (default: 15 seconds, configurable via `timeoutMs`)
   - Status `500`: Internal server error
4. **FormData Support**: Automatically skips default `Content-Type: application/json` when sending binary `FormData`, letting the browser set the boundary headers.
5. **AbortController Support**: All requests support custom `signal` and an automatic timeout controller.

---

## 3. Directory Layout

```
frontend/lib/api/
├── client.js              # Central fetch client & ApiError class
├── config.js              # Environment toggles & isRealMode() resolver
├── uploadMedia.js         # Unified file upload abstraction (mock blob vs real multipart)
├── roles.js               # Role constant definitions & dashboard routing
├── statusMapper.js        # Status code & workflow state normalizer
├── README.md              # Architecture and developer guide (this file)
│
├── mappers/               # Data transformers (Backend <-> Frontend contracts)
│   ├── index.js           # Barrel export
│   ├── userMapper.js      # User & auth normalization
│   ├── talentMapper.js    # TalentProfile (handles personalDetails, physical, skills, socialLinks)
│   ├── recruiterMapper.js # Organization & project normalization
│   ├── opportunityMapper.js # Opportunity briefs (supports roles[] and flat role)
│   ├── applicationMapper.js # Casting applications & talent preview normalization
│   ├── auditionMapper.js  # Audition workflow & vismayaApproval statuses
│   ├── mediaMapper.js     # Media queue items & portfolio assets
│   ├── broadcastMapper.js # Admin broadcasts & announcements
│   └── notificationMapper.js # In-app notifications
│
└── services/              # Domain API service modules
    ├── index.js           # Barrel export
    ├── authService.js     # Auth, session, password recovery
    ├── talentService.js   # Talent profile, portfolio, self-tape
    ├── recruiterService.js# Recruiter projects, opportunities, pipeline
    ├── adminService.js    # Admin dashboard, moderation, audit, broadcasts
    ├── publicService.js   # Public landing stats, directory, contact
    ├── notificationService.js # Notification polling & read status
    ├── mediaService.js    # Media upload & CRUD
    ├── paymentService.js  # Razorpay checkout & credits
    └── verificationService.js # KYC & badge verification
```

---

## 4. Role Mapping Reference

| UI Role Name | Backend Role Identifier | Dashboard Base Path |
|---|---|---|
| `talent` | `talent` | `/talent/dashboard` |
| `recruiter` | `organization` | `/recruiter/dashboard` |
| `admin` | `admin` | `/admin/dashboard` |

Use `getDashboardPath(role)` and `toBackendRole(role)` from `frontend/lib/api/roles.js` to ensure consistent translation.

---

## 5. How to Add a New Endpoint

Follow this standard 3-step pattern when integrating a new backend endpoint:

### Step 1: Create or Update Data Mapper (`mappers/`)
Ensure the mapper handles both backend shapes (`_id`, nested documents) and prototype mock shapes (`id`, flat strings):

```javascript
export function mapMyEntity(raw) {
  if (!raw) return null;
  return {
    id: raw._id?.toString() || raw.id,
    title: raw.title || "",
    status: mapStatus(raw.status),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}
```

### Step 2: Implement Service Method (`services/`)
Add the method with double-mode support:

```javascript
import { apiClient } from "../client.js";
import { isRealMode } from "../config.js";
import { mapMyEntity } from "../mappers/index.js";

export const myService = {
  async getEntities(params = {}) {
    if (!isRealMode("my_module")) {
      // Mock mode fallback: return seed or mock state
      return { success: true, data: mockList.map(mapMyEntity) };
    }

    const res = await apiClient.get("/api/my-entities", { params });
    const docs = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    return {
      success: true,
      data: docs.map(mapMyEntity),
    };
  },
};
```

### Step 3: Consume in UI via `useAsync` Hook or Context
Use `useAsync` in React components for automatic loading, error, and double-submission protection:

```javascript
import { useAsync } from "@/hooks/useAsync";
import { myService } from "@/lib/api/services";
import ErrorState from "@/components/shared/ErrorState";

export default function MyPage() {
  const { data, loading, error, execute } = useAsync(
    () => myService.getEntities(),
    { immediate: true }
  );

  if (loading) return <Skeleton height="200px" />;
  if (error) return <ErrorState error={error} onRetry={execute} />;
  return <EntityList items={data?.data || []} />;
}
```
