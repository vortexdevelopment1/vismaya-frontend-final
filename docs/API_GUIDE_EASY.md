# Vismaya API Guide — Easy Plain English Reference

> A beginner-friendly, plain English guide explaining every single API endpoint used by the Vismaya frontend, how the website talks to the backend, and what is currently built versus pending in the backend.

---

## 1. What is an API?

Think of a restaurant:
- **You (the customer sitting at the table)** are the **Frontend** (what users see on the screen).
- **The kitchen staff cooking the food** is the **Backend** (where user data and passwords live in the database).
- **The waiter who takes your order to the kitchen and brings your food back** is the **API**.

An **API** (Application Programming Interface) is simply a digital messenger. When you click a button on the screen (like "Log In" or "Apply for Casting"), the frontend sends a small message (request) to the backend. The backend checks the database and sends a reply back. The frontend then updates the screen with your data.

---

## 2. How Our Website Talks to the Backend

Here is the exact journey every time a user does something on Vismaya:

```
[User clicks button on screen]
             ↓
[Frontend prepares request]
             ↓
[Attaches Bearer Token in header (if user is logged in)]
             ↓
[Dispatches HTTP request (GET, POST, PATCH, or DELETE) to Backend URL]
             ↓
[Backend checks if token is valid & checks user role]
             ↓
[Backend reads or updates the MongoDB Database]
             ↓
[Backend replies with standard JSON envelope: { success: true, data: ... }]
             ↓
[Frontend unpacks data and updates what you see on the screen]
```

### Technical Words in Plain English:
- **Endpoint (URL)**: The specific web address on the backend for one exact job (example: `/api/auth/login` is the endpoint for logging in).
- **Method**: The action word of the request:
  - **GET**: "Fetch / read data from the server" (like reading your profile).
  - **POST**: "Create new data on the server" (like registering a new account or applying for a casting call).
  - **PATCH / PUT**: "Update existing data" (like changing your stage name or updating applicant status).
  - **DELETE**: "Remove data" (like deleting a photo or removing an artist from favourites).
- **Token (JWT Bearer Token)**: A secure digital pass stored in your browser after you log in. The frontend shows this pass to the backend with every request so the backend knows who you are without you re-typing your password every second.
- **Base URL**: The server address where the backend lives. On a developer's computer, it is `http://localhost:5000`. On the live website, it will be the real domain like `https://api.vismayacreativestudios.com`.
- **Mock Mode vs Real Mode**:
  - In **Mock Mode** (`NEXT_PUBLIC_USE_MOCK=true`), the frontend runs locally using sample mock data stored directly in the frontend code. No backend is needed.
  - In **Real Mode** (`NEXT_PUBLIC_USE_MOCK=false` and `NEXT_PUBLIC_API_MODULES=all`), the frontend talks directly to the live backend server via HTTP requests.

---

## 3. Total Number of APIs

Here is the verified count of all APIs required by the frontend, compared against the active routes in the backend:

| Area | Total APIs Needed | Built in Backend | Missing in Backend | Status Summary |
| :--- | :---: | :---: | :---: | :--- |
| **Login & Account (Auth)** | 13 | 13 | 0 | **100% Built** |
| **Public Pages & Discovery** | 12 | 10 | 2 | **10 Built, 2 Missing** (`/api/public/stats`, `/api/contact`) |
| **Talent Portal** | 11 | 11 | 0 | **100% Built** |
| **Organization Portal** | 32 | 32 | 0 | **100% Built** |
| **Admin Portal** | 47 | 41 | 6 | **41 Built, 6 Missing** (All 6 Broadcast endpoints) |
| **Media & Uploads** | 11 | 11 | 0 | **100% Built** |
| **Payments & Credits** | 5 | 5 | 0 | **100% Built** |
| **Notifications** | 4 | 4 | 0 | **100% Built** |
| **Verifications (KYC)** | 4 | 4 | 0 | **100% Built** |
| **TOTAL** | **139** | **131** | **8** | **94.2% Complete** |

---

## 4.1 Login and Account (Authentication)

Handles registration, email verification, passwords, login sessions, and Google sign-in.

### Create a new user account
- **Method & URL**: `POST /api/auth/register`
- **Who can use it**: Public
- **Which page uses it**: `/register`
- **What the frontend sends**: email, password, role ('talent' or 'organization'), name, studioName/organizationName, mobile
- **What the backend sends back**: success (true/false), user details (id, name, email, role, status='pending'), token, message
- **What happens on the screen**: Shows success screen asking the user to enter the 6-digit OTP code sent to their email.
- **Status**: **Built**

### Verify email with 6-digit OTP code
- **Method & URL**: `POST /api/auth/verify-registration`
- **Who can use it**: Public (newly registered user)
- **Which page uses it**: `/register`
- **What the frontend sends**: email, otp (6 digits)
- **What the backend sends back**: success, message, token (login key), user details with status='active'
- **What happens on the screen**: Activates user account, logs user in, and moves user directly to their new dashboard.
- **Status**: **Built**

### Resend email verification OTP
- **Method & URL**: `POST /api/auth/resend-registration-otp`
- **Who can use it**: Public (pending user)
- **Which page uses it**: `/register`
- **What the frontend sends**: email
- **What the backend sends back**: success, message
- **What happens on the screen**: Shows a green popup saying 'New OTP sent to your email' and restarts the 60-second countdown timer.
- **Status**: **Built**

### Log in with email and password
- **Method & URL**: `POST /api/auth/login`
- **Who can use it**: Public (registered user)
- **Which page uses it**: `/login`
- **What the frontend sends**: email, password
- **What the backend sends back**: success, token (JWT key), user details (id, name, email, role, status), sessionId
- **What happens on the screen**: Saves login token in browser memory and opens the user's dashboard (Talent, Recruiter, or Admin).
- **Status**: **Built**

### Request password reset OTP
- **Method & URL**: `POST /api/auth/forgot-password`
- **Who can use it**: Public
- **Which page uses it**: `/forgot-password`
- **What the frontend sends**: email
- **What the backend sends back**: success, message
- **What happens on the screen**: Moves the user to step 2 where they enter the OTP code received on their email.
- **Status**: **Built**

### Verify password reset OTP
- **Method & URL**: `POST /api/auth/verify-otp`
- **Who can use it**: Public
- **Which page uses it**: `/forgot-password`
- **What the frontend sends**: email, otp
- **What the backend sends back**: success, message
- **What happens on the screen**: Moves user to step 3 to type a new password.
- **Status**: **Built**

### Save new password using OTP
- **Method & URL**: `POST /api/auth/reset-password`
- **Who can use it**: Public
- **Which page uses it**: `/forgot-password`
- **What the frontend sends**: email, otp, newPassword
- **What the backend sends back**: success, message
- **What happens on the screen**: Shows 'Password updated successfully' and takes user to /login.
- **Status**: **Built**

### Change password while logged in
- **Method & URL**: `POST /api/auth/change-password`
- **Who can use it**: Talent / Organization / Admin
- **Which page uses it**: `/talent/settings, /recruiter/settings`
- **What the frontend sends**: currentPassword, newPassword
- **What the backend sends back**: success, message
- **What happens on the screen**: Shows a success checkmark and clears the password input boxes.
- **Status**: **Built**

### List all active devices and login sessions
- **Method & URL**: `GET /api/auth/sessions`
- **Who can use it**: Talent / Organization / Admin
- **Which page uses it**: `/talent/settings, /recruiter/settings`
- **What the frontend sends**: Nothing (token in header)
- **What the backend sends back**: success, list of sessions (device name, IP address, last active time, isCurrent)
- **What happens on the screen**: Displays a list of devices currently logged into this account.
- **Status**: **Built**

### Log out a specific device session
- **Method & URL**: `DELETE /api/auth/sessions/${sessionId}`
- **Who can use it**: Talent / Organization / Admin
- **Which page uses it**: `/talent/settings, /recruiter/settings`
- **What the frontend sends**: Nothing (sessionId in URL path)
- **What the backend sends back**: success, message
- **What happens on the screen**: Removes that device from the list immediately.
- **Status**: **Built**

### Log out all other devices
- **Method & URL**: `POST /api/auth/logout-all`
- **Who can use it**: Talent / Organization / Admin
- **Which page uses it**: `/talent/settings, /recruiter/settings`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, message
- **What happens on the screen**: Clears all other device sessions and keeps only the current device logged in.
- **Status**: **Built**

### Continue with Google sign-in
- **Method & URL**: `POST /api/auth/google`
- **Who can use it**: Public
- **Which page uses it**: `/login, /register`
- **What the frontend sends**: idToken (from Google popup), role ('talent' or 'organization' if registering)
- **What the backend sends back**: success, token, user details (id, name, email, role, avatar), message
- **What happens on the screen**: Logs user in without typing password and takes them to their dashboard.
- **Status**: **Built**

### Log out of current session
- **Method & URL**: `POST /api/auth/logout`
- **Who can use it**: Talent / Organization / Admin
- **Which page uses it**: `Any page (topbar logout button)`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, message
- **What happens on the screen**: Removes saved token from browser and takes user back to /login.
- **Status**: **Built**

---

## 4.2 Public Pages & Discovery

Handles public landing page data, public casting opportunities catalog, talent search, and contact inquiries.

### Get published casting calls for public view
- **Method & URL**: `GET /api/opportunities/published`
- **Who can use it**: Public
- **Which page uses it**: `/opportunities, /`
- **What the frontend sends**: search query, profession, city, page, limit (optional filters)
- **What the backend sends back**: success, list of casting calls, total count
- **What happens on the screen**: Displays the public cards of open audition briefs on the opportunities catalog.
- **Status**: **Built**

### Get single casting call details
- **Method & URL**: `GET /api/opportunities/${opportunityId}`
- **Who can use it**: Public / Talent / Organization
- **Which page uses it**: `/opportunities/[opportunityId], /talent/opportunities/[opportunityId]`
- **What the frontend sends**: Nothing (opportunityId in URL)
- **What the backend sends back**: success, full casting call brief (roles, production studio, dates, eligibility, compensation)
- **What happens on the screen**: Displays the complete casting call details page with the Apply button.
- **Status**: **Built**

### Search talent directory
- **Method & URL**: `GET /api/talent/profile/search`
- **Who can use it**: Public / Organization
- **Which page uses it**: `/ (Talent roster), directory search`
- **What the frontend sends**: category, profession, city, gender, search keyword, page, limit
- **What the backend sends back**: success, list of talent profile cards, total count
- **What happens on the screen**: Shows photo cards of verified actors, models, singers, and artists.
- **Status**: **Built**

### Get featured spotlight artists
- **Method & URL**: `GET /api/talent/profile/featured`
- **Who can use it**: Public
- **Which page uses it**: `/`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of highlighted artist cards
- **What happens on the screen**: Shows the curated artist cards on the home page talent section.
- **Status**: **Built**

### Get public talent profile by ID or Vismaya ID
- **Method & URL**: `GET /api/talent/profile/${vismayaIdOrId}`
- **Who can use it**: Public / Organization
- **Which page uses it**: `/talent/[vismayaId], recruiter candidate modal`
- **What the frontend sends**: Nothing (vismayaId or ID in URL)
- **What the backend sends back**: success, profile details, public portfolio media, verification badges, isUnlocked boolean
- **What happens on the screen**: Opens the artist's full portfolio page or candidate preview drawer.
- **Status**: **Built**

### Get public production house profile
- **Method & URL**: `GET /api/company/${slug}`
- **Who can use it**: Public
- **Which page uses it**: `Company public profile view`
- **What the frontend sends**: Nothing (slug in URL)
- **What the backend sends back**: success, organization details (name, banner, verified badge, description, published calls)
- **What happens on the screen**: Displays production studio profile header and active casting projects.
- **Status**: **Built**

### Get platform aggregate counts
- **Method & URL**: `GET /api/public/stats`
- **Who can use it**: Public
- **Which page uses it**: `/ (Stats banner), /about`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, verifiedArtists count, castingCalls count, productionHouses count, auditRate
- **What happens on the screen**: Displays the numbers like '12,400+ Artists', '450+ Casting Calls' in the statistics bar.
- **Status**: **Not built**

### Get published success stories
- **Method & URL**: `GET /api/success-stories`
- **Who can use it**: Public
- **Which page uses it**: `/about, /`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of approved success stories (talent name, project name, quote, photo)
- **What happens on the screen**: Displays testimonials from artists who got cast through Vismaya.
- **Status**: **Built**

### Submit a success story
- **Method & URL**: `POST /api/success-stories`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/dashboard`
- **What the frontend sends**: story, role, projectName
- **What the backend sends back**: success, message
- **What happens on the screen**: Shows 'Submitted for Admin review' notification.
- **Status**: **Built**

### Submit contact support form
- **Method & URL**: `POST /api/contact`
- **Who can use it**: Public
- **Which page uses it**: `/contact`
- **What the frontend sends**: name, email, message
- **What the backend sends back**: success, message
- **What happens on the screen**: Shows confirmation message: 'Our operations team will respond within 24 hours'.
- **Status**: **Not built**

### Get craft categories and professions list
- **Method & URL**: `GET /api/taxonomy`
- **Who can use it**: Public / Talent
- **Which page uses it**: `/register, /talent/profile, /opportunities`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, categories (e.g. Actors, Models, Voice, Dance, Crew), professions list
- **What happens on the screen**: Populates the dropdown filters and registration craft selection.
- **Status**: **Built**

### Get craft-specific profile form schema
- **Method & URL**: `GET /api/taxonomy/${profession}/form`
- **Who can use it**: Public / Talent
- **Which page uses it**: `/talent/profile`
- **What the frontend sends**: Nothing (profession in URL)
- **What the backend sends back**: success, dynamic form fields for that profession (e.g. vocal range for singers, height for models)
- **What happens on the screen**: Renders the specialized questions when an artist edits their craft details.
- **Status**: **Built**

---

## 4.3 Talent Portal

Used by artists to manage their portfolio, profile strength score, casting applications, and self-tape audition submissions.

### Get my talent profile
- **Method & URL**: `GET /api/talent/profile/my`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/dashboard, /talent/profile`
- **What the frontend sends**: Nothing (token in header)
- **What the backend sends back**: success, full talent profile (personalDetails, physicalAttributes, craftSkills, socialLinks, kycStatus)
- **What happens on the screen**: Fills in all the profile forms and displays artist details on the dashboard.
- **Status**: **Built**

### Save or update my talent profile
- **Method & URL**: `POST /api/talent/profile`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/profile`
- **What the frontend sends**: personalDetails, physicalAttributes, skills, experience, unionMemberships, languages, socialLinks
- **What the backend sends back**: success, updated profile, message
- **What happens on the screen**: Saves changes and shows 'Profile updated successfully' toast.
- **Status**: **Built**

### Get profile completion score and checklist
- **Method & URL**: `GET /api/talent/profile/completion-status`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/dashboard`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, completionPercentage (e.g. 85%), missingSections list, isEligibleToApply
- **What happens on the screen**: Updates the circular 'Profile Strength' score card and checklist on the Talent dashboard.
- **Status**: **Built**

### Get my profile visit analytics
- **Method & URL**: `GET /api/talent/profile/analytics`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/dashboard`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, profileViews count, searchAppearances count, shortlistedCount, auditionRequests count
- **What happens on the screen**: Displays the 4 stat cards at the top of the talent dashboard.
- **Status**: **Built**

### Generate shareable artist card link
- **Method & URL**: `GET /api/talent/${vismayaIdOrId}/share-card`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/profile`
- **What the frontend sends**: Nothing (talentId in URL)
- **What the backend sends back**: success, card preview data, shareUrl link
- **What happens on the screen**: Copies the artist's public link to clipboard and shows share popup.
- **Status**: **Built**

### Get all my submitted applications
- **Method & URL**: `GET /api/applications/my`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/applications, /talent/dashboard`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of applications (opportunity title, roleApplied, status, submittedAt, timeline steps)
- **What happens on the screen**: Displays application tracking cards with timeline progress (Applied -> Under Review -> Shortlisted -> Audition).
- **Status**: **Built**

### Apply to a casting opportunity
- **Method & URL**: `POST /api/applications/${opportunityId}/apply`
- **Who can use it**: Talent
- **Which page uses it**: `/opportunities/[opportunityId], /talent/opportunities`
- **What the frontend sends**: roleApplied, coverNote, customAnswers, consentGiven (true)
- **What the backend sends back**: success, created application record, message
- **What happens on the screen**: Closes the application modal and shows a green 'Application Submitted' banner.
- **Status**: **Built**

### Withdraw an active application
- **Method & URL**: `PATCH /api/applications/${applicationId}/withdraw`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/applications`
- **What the frontend sends**: withdrawalReason, confirm (true)
- **What the backend sends back**: success, updated application record with status='Withdrawn'
- **What happens on the screen**: Updates status badge to 'Withdrawn' and disables audition buttons.
- **Status**: **Built**

### Request permission to re-apply
- **Method & URL**: `POST /api/applications/${applicationId}/reapplication-request`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/applications`
- **What the frontend sends**: reason
- **What the backend sends back**: success, message
- **What happens on the screen**: Shows 'Re-application request submitted for Admin review'.
- **Status**: **Built**

### Get all auditions assigned to me
- **Method & URL**: `GET /api/auditions/my`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/auditions, /talent/dashboard`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of auditions (opportunity title, role, instructions, deadline, status, scriptSidesUrl)
- **What happens on the screen**: Lists upcoming self-tape deadlines and offline audition slots.
- **Status**: **Built**

### Submit self-tape audition video
- **Method & URL**: `POST /api/auditions/${auditionId}/self-tape`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/auditions`
- **What the frontend sends**: videoUrl, thumbnailUrl, durationSeconds, fileSizeBytes, notes
- **What the backend sends back**: success, updated audition record with status='Self-tape Received', message
- **What happens on the screen**: Shows green checkmark 'Self-tape submitted' and sends it to the moderation queue.
- **Status**: **Built**

---

## 4.4 Organization Portal (Recruiters & Production Houses)

Used by casting directors and studios to post casting calls, review candidates, request auditions, and unlock talent contacts.

### Get recruiter organization profile
- **Method & URL**: `GET /api/organization/profile`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/settings, /recruiter/dashboard`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, company details (name, logo, website, description, contactPerson, verificationStatus)
- **What happens on the screen**: Fills in company profile settings and header brand display.
- **Status**: **Built**

### Save recruiter organization profile
- **Method & URL**: `POST /api/organization/profile`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/settings`
- **What the frontend sends**: organizationName, description, website, contactPerson, phone, offices, socialLinks
- **What the backend sends back**: success, updated organization, message
- **What happens on the screen**: Saves company information and shows success alert.
- **Status**: **Built**

### Upload business verification document
- **Method & URL**: `POST /api/organization/verification-doc`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/settings`
- **What the frontend sends**: docType (GST / CIN / Trade License), fileUrl
- **What the backend sends back**: success, message
- **What happens on the screen**: Shows 'Document submitted for Admin verification'.
- **Status**: **Built**

### Get all projects created by organization
- **Method & URL**: `GET /api/projects`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/projects, /recruiter/dashboard`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of projects (title, type, director, status, casting calls count, createdAt)
- **What happens on the screen**: Displays cards of all films, web series, commercials, and shows in production.
- **Status**: **Built**

### Get single project details
- **Method & URL**: `GET /api/projects/${projectId}`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/projects/[projectId]`
- **What the frontend sends**: Nothing (projectId in URL)
- **What the backend sends back**: success, project details, associated casting calls list
- **What happens on the screen**: Displays project management overview page.
- **Status**: **Built**

### Create a new production project
- **Method & URL**: `POST /api/projects`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/projects`
- **What the frontend sends**: title, projectType (Film, OTT Series, Ad, etc.), synopsis, director, producer, tentativeDates
- **What the backend sends back**: success, created project record, message
- **What happens on the screen**: Adds project to project list and allows attaching casting calls to it.
- **Status**: **Built**

### Update an existing project
- **Method & URL**: `PATCH /api/projects/${projectId}`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/projects/[projectId]`
- **What the frontend sends**: title, synopsis, status, director, tentativeDates
- **What the backend sends back**: success, updated project
- **What happens on the screen**: Updates project details on the project overview page.
- **Status**: **Built**

### Add artist to project shortlist
- **Method & URL**: `POST /api/projects/${projectId}/shortlist`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/shortlist-auditions, /recruiter/projects/[projectId]`
- **What the frontend sends**: talentId, roleTag, notes
- **What the backend sends back**: success, created shortlist entry
- **What happens on the screen**: Adds artist card into the project's talent shortlist board.
- **Status**: **Built**

### Get artists shortlisted for a project
- **Method & URL**: `GET /api/projects/${projectId}/shortlist`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/projects/[projectId], /recruiter/shortlist-auditions`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of shortlisted talent profiles with recruiter notes and status
- **What happens on the screen**: Displays candidate cards categorized by shortlisted role.
- **Status**: **Built**

### Update shortlist candidate notes or tag
- **Method & URL**: `PATCH /api/projects/${projectId}/shortlist/${shortlistId}`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/shortlist-auditions`
- **What the frontend sends**: roleTag, notes, rating
- **What the backend sends back**: success, updated shortlist item
- **What happens on the screen**: Updates notes without reloading the page.
- **Status**: **Built**

### Remove candidate from shortlist
- **Method & URL**: `DELETE /api/projects/${projectId}/shortlist/${shortlistId}`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/shortlist-auditions`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, message
- **What happens on the screen**: Removes candidate card from shortlist view.
- **Status**: **Built**

### Get all casting calls posted by my studio
- **Method & URL**: `GET /api/opportunities/my-opportunities`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/opportunities, /recruiter/dashboard`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of opportunities (title, status, applicantsCount, deadline, projectId)
- **What happens on the screen**: Displays casting call management table with status chips (Draft, Pending Review, Published).
- **Status**: **Built**

### Post a new casting opportunity brief
- **Method & URL**: `POST /api/opportunities`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/opportunities/new`
- **What the frontend sends**: title, projectId, roles array (character, ageRange, gender, description, budget), submissionDeadline
- **What the backend sends back**: success, created opportunity brief, status='Pending Admin Review'
- **What happens on the screen**: Takes user to opportunities list and shows 'Sent to Vismaya Desk for verification' notice.
- **Status**: **Built**

### Update a casting opportunity brief
- **Method & URL**: `PUT /api/opportunities/${opportunityId}`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/opportunities`
- **What the frontend sends**: title, roles array, compensation, deadlines, shootingLocation
- **What the backend sends back**: success, updated opportunity
- **What happens on the screen**: Updates the opportunity brief.
- **Status**: **Built**

### Request cancellation of a casting call
- **Method & URL**: `POST /api/opportunities/${opportunityId}/cancel-request`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/opportunities`
- **What the frontend sends**: cancellationReason, comments
- **What the backend sends back**: success, message
- **What happens on the screen**: Marks status as 'Cancellation Requested' and notifies Admin.
- **Status**: **Built**

### Mark casting call as fulfilled / closed
- **Method & URL**: `POST /api/opportunities/${opportunityId}/complete`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/opportunities`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, message
- **What happens on the screen**: Moves opportunity to Completed archive.
- **Status**: **Built**

### Get applicants for a specific casting call
- **Method & URL**: `GET /api/applications/opportunity/${opportunityId}`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/opportunities/[opportunityId]/applicants`
- **What the frontend sends**: Nothing (opportunityId in URL)
- **What the backend sends back**: success, list of applicants (talent name, headshot, experience, roleApplied, status, applicationDate)
- **What happens on the screen**: Renders the applicant review pipeline grid.
- **Status**: **Built**

### Mark applicant as Under Review
- **Method & URL**: `PATCH /api/applications/${applicationId}/review`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/opportunities/[opportunityId]/applicants`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, updated application status='Under Review'
- **What happens on the screen**: Updates applicant pill to yellow 'Under Review'.
- **Status**: **Built**

### Shortlist an applicant
- **Method & URL**: `PATCH /api/applications/${applicationId}/shortlist`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/opportunities/[opportunityId]/applicants`
- **What the frontend sends**: notes (optional)
- **What the backend sends back**: success, updated application status='Shortlisted'
- **What happens on the screen**: Moves applicant to Shortlisted column and sends in-app alert to talent.
- **Status**: **Built**

### Select / book candidate for role
- **Method & URL**: `PATCH /api/applications/${applicationId}/select`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/opportunities/[opportunityId]/applicants`
- **What the frontend sends**: selectionNotes
- **What the backend sends back**: success, updated application status='Selected'
- **What happens on the screen**: Shows green confetti/banner 'Candidate Selected'.
- **Status**: **Built**

### Mark applicant as Not Selected
- **Method & URL**: `PATCH /api/applications/${applicationId}/not-selected`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/opportunities/[opportunityId]/applicants`
- **What the frontend sends**: rejectionFeedback (optional)
- **What the backend sends back**: success, updated application status='Not Selected'
- **What happens on the screen**: Softly marks candidate as not selected.
- **Status**: **Built**

### Request an audition from applicant
- **Method & URL**: `POST /api/auditions/application/${applicationId}`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/shortlist-auditions, applicant modal`
- **What the frontend sends**: auditionType ('Self-Tape' or 'Live/In-Person'), instructions, scriptSidesUrl, deadline
- **What the backend sends back**: success, created audition record with status='Pending Admin Relay'
- **What happens on the screen**: Shows 'Audition request submitted. Vismaya Desk will relay to artist' confirmation.
- **Status**: **Built**

### Review submitted self-tape audition
- **Method & URL**: `PATCH /api/auditions/${auditionId}/review`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/shortlist-auditions`
- **What the frontend sends**: rating (1-5), feedbackNotes, decision ('Shortlist', 'Select', 'Reject')
- **What the backend sends back**: success, updated audition record
- **What happens on the screen**: Saves audition feedback and updates candidate status.
- **Status**: **Built**

### Get all auditions for my studio
- **Method & URL**: `GET /api/auditions/organization`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/shortlist-auditions`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of auditions with artist names, roles, self-tape links, and review status
- **What happens on the screen**: Fills the Auditions tab with pending reviews and approved tapes.
- **Status**: **Built**

### Get organization credit balance
- **Method & URL**: `GET /api/credits/balance`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/dashboard, /recruiter/settings`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, creditBalance number (e.g. 24 credits)
- **What happens on the screen**: Shows credit badge in the topbar (e.g. '24 Credits').
- **Status**: **Built**

### Get credit spend and recharge history
- **Method & URL**: `GET /api/credits/history`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/settings`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of transactions (date, creditsChanged, reason, remainingBalance)
- **What happens on the screen**: Displays ledger table showing profile unlocks and credit pack recharges.
- **Status**: **Built**

### Get list of talent profiles unlocked with credits
- **Method & URL**: `GET /api/credits/viewed`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/settings, /recruiter/shortlist-auditions`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of unlocked artists
- **What happens on the screen**: Shows previously unlocked artists who can be contacted directly without spending more credits.
- **Status**: **Built**

### Unlock full artist contact using credits
- **Method & URL**: `POST /api/credits/unlock/${talentIdOrVismayaId}`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/shortlist-auditions, public talent view`
- **What the frontend sends**: Nothing (talentId in URL)
- **What the backend sends back**: success, full talent contact information, updated creditBalance
- **What happens on the screen**: Reveals artist's direct phone/email and deducts 1 credit from balance.
- **Status**: **Built**

### Get saved favourite talent bookmarks
- **Method & URL**: `GET /api/organization/favourites`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/shortlist-auditions`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of favourited talent profile cards
- **What happens on the screen**: Shows bookmarked artists under the Favourites tab.
- **Status**: **Built**

### Add artist to favourites
- **Method & URL**: `POST /api/organization/favourites`
- **Who can use it**: Organization
- **Which page uses it**: `Candidate card / profile view`
- **What the frontend sends**: talentId
- **What the backend sends back**: success, message
- **What happens on the screen**: Turns the bookmark heart icon gold.
- **Status**: **Built**

### Check if artist is favourited
- **Method & URL**: `GET /api/organization/favourites/check/${talentId}`
- **Who can use it**: Organization
- **Which page uses it**: `Candidate card`
- **What the frontend sends**: Nothing (talentId in URL)
- **What the backend sends back**: success, isFavourite boolean
- **What happens on the screen**: Sets initial heart icon outline or filled state.
- **Status**: **Built**

### Remove artist from favourites
- **Method & URL**: `DELETE /api/organization/favourites/${talentId}`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/shortlist-auditions`
- **What the frontend sends**: Nothing (talentId in URL)
- **What the backend sends back**: success, message
- **What happens on the screen**: Removes card from favourites list and un-fills heart icon.
- **Status**: **Built**

---

## 4.5 Admin Portal (Vismaya Desk)

Used by the Vismaya operations team for moderating opportunities, reviewing users, managing payments, and system feed.

### Get all platform users
- **Method & URL**: `GET /api/admin/users`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/talent-management, /admin/recruiter-management`
- **What the frontend sends**: role ('talent' or 'organization'), status ('active', 'pending', 'suspended'), search, page, limit
- **What the backend sends back**: success, list of users, total count
- **What happens on the screen**: Displays users table with search, role filters, and moderation action buttons.
- **Status**: **Built**

### Get users waiting for onboarding approval
- **Method & URL**: `GET /api/admin/users/pending`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/dashboard`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of pending user accounts
- **What happens on the screen**: Shows badge and cards in the admin approval queue.
- **Status**: **Built**

### Approve user account
- **Method & URL**: `PATCH /api/admin/users/${userId}/approve`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/talent-management, /admin/recruiter-management`
- **What the frontend sends**: Nothing (userId in URL)
- **What the backend sends back**: success, updated user status='active'
- **What happens on the screen**: Changes status chip to green 'Active' and sends welcome notification.
- **Status**: **Built**

### Reject user account
- **Method & URL**: `PATCH /api/admin/users/${userId}/reject`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/talent-management, /admin/recruiter-management`
- **What the frontend sends**: reason
- **What the backend sends back**: success, updated user status='rejected'
- **What happens on the screen**: Marks account as rejected with reason stored.
- **Status**: **Built**

### Suspend user account
- **Method & URL**: `PATCH /api/admin/users/${userId}/suspend`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/talent-management, /admin/recruiter-management`
- **What the frontend sends**: reason
- **What the backend sends back**: success, updated user status='suspended'
- **What happens on the screen**: Blocks user from logging in and shows red 'Suspended' chip.
- **Status**: **Built**

### Reactivate suspended user account
- **Method & URL**: `PATCH /api/admin/users/${userId}/reactivate`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/talent-management, /admin/recruiter-management`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, updated user status='active'
- **What happens on the screen**: Restores user login access and marks chip green.
- **Status**: **Built**

### Permanently ban user account
- **Method & URL**: `PATCH /api/admin/users/${userId}/ban`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/talent-management`
- **What the frontend sends**: reason
- **What the backend sends back**: success, message
- **What happens on the screen**: Permanently revokes all access.
- **Status**: **Built**

### Unban user account
- **Method & URL**: `PATCH /api/admin/users/${userId}/unban`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/talent-management`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, message
- **What happens on the screen**: Lifts permanent ban.
- **Status**: **Built**

### Finalize user account deletion
- **Method & URL**: `POST /api/admin/users/${userId}/finalize-deletion`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/talent-management`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, message
- **What happens on the screen**: Permanently purges user data.
- **Status**: **Built**

### Get talent directory with admin metadata
- **Method & URL**: `GET /api/admin/talents`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/talent-management`
- **What the frontend sends**: craft, city, kycStatus, search, page, limit
- **What the backend sends back**: success, list of talent records, count
- **What happens on the screen**: Fills the talent management review directory.
- **Status**: **Built**

### Get organization directory with verification metadata
- **Method & URL**: `GET /api/admin/organizations`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/recruiter-management`
- **What the frontend sends**: search, verificationStatus, page, limit
- **What the backend sends back**: success, list of organizations, count
- **What happens on the screen**: Fills the studio management review directory.
- **Status**: **Built**

### Toggle talent trending spotlight status
- **Method & URL**: `PATCH /api/admin/talents/${talentId}/trending`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/talent-management`
- **What the frontend sends**: isTrending (true/false)
- **What the backend sends back**: success, updated talent profile
- **What happens on the screen**: Toggles gold trending star badge next to talent name.
- **Status**: **Built**

### Get pending major profile edits queue
- **Method & URL**: `GET /api/admin/profile-changes`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/talent-management`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of profile changes awaiting approval
- **What happens on the screen**: Shows diff comparison drawer for changed personal details.
- **Status**: **Built**

### Approve or reject profile change
- **Method & URL**: `PATCH /api/admin/profile-changes/${profileId}/review`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/talent-management`
- **What the frontend sends**: action ('approve' or 'reject'), reason
- **What the backend sends back**: success, message
- **What happens on the screen**: Applies changes to live profile or rejects them.
- **Status**: **Built**

### Get casting opportunities awaiting approval
- **Method & URL**: `GET /api/admin/opportunities/pending`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/opportunity-review, /admin/dashboard`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of pending opportunities
- **What happens on the screen**: Populates the opportunity review verification cards.
- **Status**: **Built**

### Get casting call cancellation requests
- **Method & URL**: `GET /api/admin/opportunities/cancellations`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/cancellation-requests, /admin/dashboard`
- **What the frontend sends**: status ('pending', 'resolved')
- **What the backend sends back**: success, list of cancellation requests with studio notes
- **What happens on the screen**: Displays cancellation request approval cards.
- **Status**: **Built**

### Approve and publish casting call
- **Method & URL**: `PATCH /api/admin/opportunities/${opportunityId}/approve`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/opportunity-review`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, updated opportunity status='Published'
- **What happens on the screen**: Publishes opportunity live to public catalog.
- **Status**: **Built**

### Reject casting call submission
- **Method & URL**: `PATCH /api/admin/opportunities/${opportunityId}/reject`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/opportunity-review`
- **What the frontend sends**: reason
- **What the backend sends back**: success, updated opportunity status='Rejected'
- **What happens on the screen**: Marks brief rejected and notifies the production house.
- **Status**: **Built**

### Request changes on casting call brief
- **Method & URL**: `PATCH /api/admin/opportunities/${opportunityId}/request-corrections`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/opportunity-review`
- **What the frontend sends**: notes, requiredChanges list
- **What the backend sends back**: success, message
- **What happens on the screen**: Sends brief back to studio in 'Needs Corrections' status.
- **Status**: **Built**

### Resolve opportunity cancellation request
- **Method & URL**: `PATCH /api/admin/opportunities/${opportunityId}/review-cancellation`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/cancellation-requests`
- **What the frontend sends**: action ('approve' or 'reject'), reason
- **What the backend sends back**: success, message
- **What happens on the screen**: Cancels opportunity or denies cancellation.
- **Status**: **Built**

### Admin force-complete opportunity
- **Method & URL**: `PATCH /api/admin/opportunities/${opportunityId}/complete`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/opportunities`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, message
- **What happens on the screen**: Marks opportunity completed.
- **Status**: **Built**

### Get user and content abuse reports
- **Method & URL**: `GET /api/admin/reports`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/media-moderation`
- **What the frontend sends**: status, page, limit
- **What the backend sends back**: success, list of reported items
- **What happens on the screen**: Shows reported content moderation cards.
- **Status**: **Built**

### Resolve abuse report
- **Method & URL**: `PATCH /api/admin/reports/${reportId}/review`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/media-moderation`
- **What the frontend sends**: action ('dismiss' or 'take_down'), notes
- **What the backend sends back**: success, message
- **What happens on the screen**: Resolves report and hides infringing content.
- **Status**: **Built**

### Get auditions waiting for relay to talent
- **Method & URL**: `GET /api/admin/auditions/pending`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/auditions, /admin/dashboard`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of auditions awaiting Admin relay
- **What happens on the screen**: Displays audition relay review drawer.
- **Status**: **Built**

### Relay audition request to talent or studio
- **Method & URL**: `PATCH /api/admin/auditions/${auditionId}/review`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/auditions`
- **What the frontend sends**: action ('approve' or 'reject'), moderatorNotes
- **What the backend sends back**: success, message
- **What happens on the screen**: Relays audition brief to artist or self-tape to studio.
- **Status**: **Built**

### Get re-application permission requests
- **Method & URL**: `GET /api/admin/reapplications/pending`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/applications`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of re-application requests
- **What happens on the screen**: Lists talent requests to re-apply after withdrawal.
- **Status**: **Built**

### Approve or deny re-application permission
- **Method & URL**: `PATCH /api/admin/reapplications/${applicationId}/review`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/applications`
- **What the frontend sends**: action ('approve' or 'reject'), reason
- **What the backend sends back**: success, message
- **What happens on the screen**: Re-opens application slot for artist.
- **Status**: **Built**

### Get identity and KYC verification queue
- **Method & URL**: `GET /api/admin/verifications/pending`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/talent-management, /admin/dashboard`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of pending KYC document submissions
- **What happens on the screen**: Displays government ID preview cards for verification.
- **Status**: **Built**

### Approve or reject KYC verification
- **Method & URL**: `PATCH /api/admin/verifications/${verificationId}/review`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/talent-management`
- **What the frontend sends**: action ('approve' or 'reject'), rejectionReason
- **What the backend sends back**: success, message
- **What happens on the screen**: Awards verified blue tick badge to artist or studio.
- **Status**: **Built**

### Get media moderation queue
- **Method & URL**: `GET /api/admin/media/pending`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/media-moderation, /admin/dashboard`
- **What the frontend sends**: page, limit
- **What the backend sends back**: success, list of newly uploaded photos and showreels
- **What happens on the screen**: Displays media review gallery with Approve / Reject buttons.
- **Status**: **Built**

### Approve or reject uploaded media
- **Method & URL**: `PATCH /api/admin/media/${mediaId}/review`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/media-moderation`
- **What the frontend sends**: action ('approve' or 'reject'), reason
- **What the backend sends back**: success, message
- **What happens on the screen**: Removes item from queue; approved items become visible on artist profile.
- **Status**: **Built**

### Get all payment transactions across platform
- **Method & URL**: `GET /api/admin/transactions`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/payments`
- **What the frontend sends**: status, search, page, limit
- **What the backend sends back**: success, list of transactions (orderId, amount, studio, plan, status, date)
- **What happens on the screen**: Displays payments ledger table and revenue overview.
- **Status**: **Built**

### Manually add or deduct organization credits
- **Method & URL**: `POST /api/admin/credits/adjust`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/recruiter-management, /admin/payments`
- **What the frontend sends**: organizationId, amount (positive or negative), reason
- **What the backend sends back**: success, updated creditBalance, message
- **What happens on the screen**: Updates credit balance immediately with audit log entry.
- **Status**: **Built**

### Get discount coupon codes
- **Method & URL**: `GET /api/admin/coupons`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/payments`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of coupons (code, discountPercent, expiry, usageCount)
- **What happens on the screen**: Displays coupon management list.
- **Status**: **Built**

### Create new discount coupon code
- **Method & URL**: `POST /api/admin/coupons`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/payments`
- **What the frontend sends**: code, discountPercent, maxUses, validUntil
- **What the backend sends back**: success, created coupon
- **What happens on the screen**: Adds new coupon to the list.
- **Status**: **Built**

### Update coupon code
- **Method & URL**: `PATCH /api/admin/coupons/${couponId}`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/payments`
- **What the frontend sends**: isActive, validUntil, discountPercent
- **What the backend sends back**: success, updated coupon
- **What happens on the screen**: Saves coupon changes.
- **Status**: **Built**

### Delete coupon code
- **Method & URL**: `DELETE /api/admin/coupons/${couponId}`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/payments`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, message
- **What happens on the screen**: Removes coupon code.
- **Status**: **Built**

### Get admin dashboard overview metrics
- **Method & URL**: `GET /api/admin/dashboard`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/dashboard`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, stats (totalUsers, totalTalents, totalOrganizations, pendingOpportunities, pendingMedia, pendingAuditions)
- **What happens on the screen**: Populates the main metric counters on the Admin dashboard.
- **Status**: **Built**

### Get administrative audit trail logs
- **Method & URL**: `GET /api/admin/audit-logs`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/dashboard, /admin/notifications`
- **What the frontend sends**: action, adminId, page, limit
- **What the backend sends back**: success, list of audit log events (timestamp, actor, action, target, details)
- **What happens on the screen**: Displays live system feed of all staff actions.
- **Status**: **Built**

### Global admin search across all entities
- **Method & URL**: `GET /api/admin/search`
- **Who can use it**: Admin
- **Which page uses it**: `Admin topbar search`
- **What the frontend sends**: q (search keyword)
- **What the backend sends back**: success, matching users, opportunities, and projects
- **What happens on the screen**: Displays quick-jump search results dropdown.
- **Status**: **Built**

### Export admin reports (CSV / Excel)
- **Method & URL**: `GET /api/admin/export/${type}`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/payments, /admin/talent-management`
- **What the frontend sends**: Nothing (export type in URL)
- **What the backend sends back**: CSV file download
- **What happens on the screen**: Triggers browser file download.
- **Status**: **Built**

### Get list of broadcast announcements
- **Method & URL**: `GET /api/admin/broadcasts`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/notifications`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of broadcasts (title, message, audience, status, sentAt, reach)
- **What happens on the screen**: Displays broadcast announcements history.
- **Status**: **Not built**

### Get single broadcast details
- **Method & URL**: `GET /api/admin/broadcasts/${broadcastId}`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/notifications`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, broadcast record
- **What happens on the screen**: Opens broadcast inspection preview.
- **Status**: **Not built**

### Send or schedule platform broadcast announcement
- **Method & URL**: `POST /api/admin/broadcasts`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/notifications`
- **What the frontend sends**: title, message, audience ('All users', 'All talent', 'All organizations'), channels, scheduledFor
- **What the backend sends back**: success, created broadcast, message
- **What happens on the screen**: Shows success modal: 'Broadcast sent to 1,298 users'.
- **Status**: **Not built**

### Update broadcast announcement draft
- **Method & URL**: `PATCH /api/admin/broadcasts/${broadcastId}`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/notifications`
- **What the frontend sends**: title, message, audience, scheduledFor
- **What the backend sends back**: success, updated broadcast
- **What happens on the screen**: Saves draft changes in table.
- **Status**: **Not built**

### Delete or cancel scheduled broadcast
- **Method & URL**: `DELETE /api/admin/broadcasts/${broadcastId}`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/notifications`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, message
- **What happens on the screen**: Removes broadcast from schedule.
- **Status**: **Not built**

### Calculate estimated audience reach count
- **Method & URL**: `GET /api/admin/broadcasts/reach`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/notifications`
- **What the frontend sends**: target audience ('all', 'talent', 'organization', city)
- **What the backend sends back**: success, estimatedCount
- **What happens on the screen**: Updates the dynamic 'Estimated Reach: 1,284 artists' pill in the broadcast composer.
- **Status**: **Not built**

---

## 4.6 Media & File Uploads

Handles uploading photos, showreels, audio clips, setting main profile pictures, and moderation queue.

### Get all media in my portfolio
- **Method & URL**: `GET /api/media/my`
- **Who can use it**: Talent / Organization
- **Which page uses it**: `/talent/portfolio`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of media assets (id, url, thumbnailUrl, type, title, status, isMainProfilePhoto)
- **What happens on the screen**: Displays photo gallery, showreel cards, and audio clips.
- **Status**: **Built**

### Get media items for a specific user ID
- **Method & URL**: `GET /api/media/user/${userId}`
- **Who can use it**: Admin / Organization
- **Which page uses it**: `/talent/[vismayaId], admin media queue`
- **What the frontend sends**: Nothing (userId in URL)
- **What the backend sends back**: success, list of user's media assets
- **What happens on the screen**: Displays artist's public or candidate portfolio gallery.
- **Status**: **Built**

### Register uploaded media asset in database
- **Method & URL**: `POST /api/media`
- **Who can use it**: Talent / Organization
- **Which page uses it**: `/talent/portfolio, /talent/profile`
- **What the frontend sends**: url, type ('Headshot', 'Showreel', 'Full Body', 'Audition Clip'), title, category, rightsConfirmed (true), isMainProfilePhoto
- **What the backend sends back**: success, created media record with status='Pending Moderation'
- **What happens on the screen**: Adds new media item card with 'Under Review' badge to user's portfolio.
- **Status**: **Built**

### Update media asset title or main photo flag
- **Method & URL**: `PATCH /api/media/${mediaId}`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/portfolio`
- **What the frontend sends**: title, isMainProfilePhoto, category
- **What the backend sends back**: success, updated media item
- **What happens on the screen**: Updates photo caption or marks photo as main avatar.
- **Status**: **Built**

### Delete media asset
- **Method & URL**: `DELETE /api/media/${mediaId}`
- **Who can use it**: Talent / Admin
- **Which page uses it**: `/talent/portfolio`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, message
- **What happens on the screen**: Removes card from portfolio gallery.
- **Status**: **Built**

### Upload multiple media files at once
- **Method & URL**: `POST /api/media/upload-multiple`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/portfolio`
- **What the frontend sends**: FormData with files array
- **What the backend sends back**: success, list of uploaded media records
- **What happens on the screen**: Shows batch progress bar and populates gallery with uploaded photos.
- **Status**: **Built**

### Get direct Cloudinary upload signature
- **Method & URL**: `GET /api/media/signature`
- **Who can use it**: Talent / Organization
- **Which page uses it**: `/talent/portfolio`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, signature, timestamp, apiKey
- **What happens on the screen**: Allows frontend to upload large video files directly to Cloudinary safely.
- **Status**: **Built**

### Re-order portfolio media items
- **Method & URL**: `PATCH /api/media/order`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/portfolio`
- **What the frontend sends**: orderedIds array
- **What the backend sends back**: success, message
- **What happens on the screen**: Saves drag-and-drop photo display order.
- **Status**: **Built**

### Dispute media moderation rejection
- **Method & URL**: `POST /api/media/${mediaId}/dispute`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/portfolio`
- **What the frontend sends**: disputeReason
- **What the backend sends back**: success, message
- **What happens on the screen**: Submits photo for re-review by senior moderator.
- **Status**: **Built**

### Nominate photo/video for spotlight showcase
- **Method & URL**: `POST /api/media/${mediaId}/nominate-featured`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/portfolio`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, message
- **What happens on the screen**: Marks item as nominated for home page feature.
- **Status**: **Built**

### Admin feature or unfeature media asset
- **Method & URL**: `PATCH /api/media/${mediaId}/feature`
- **Who can use it**: Admin
- **Which page uses it**: `/admin/media-moderation`
- **What the frontend sends**: isFeatured (true/false)
- **What the backend sends back**: success, updated media
- **What happens on the screen**: Adds media item to public featured showcase.
- **Status**: **Built**

---

## 4.7 Payments & Credit Wallet

Handles Razorpay orders, credit top-ups, coupons, and tax invoice receipts.

### Apply discount promo coupon
- **Method & URL**: `POST /api/payments/apply-coupon`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/settings (Recharge modal)`
- **What the frontend sends**: code, planId
- **What the backend sends back**: success, discountPercent, discountAmount, finalAmount
- **What happens on the screen**: Updates checkout summary to show reduced price.
- **Status**: **Built**

### Create Razorpay payment order
- **Method & URL**: `POST /api/payments/create-order`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/settings (Credit recharge)`
- **What the frontend sends**: amount, currency ('INR'), planId, description
- **What the backend sends back**: success, orderId, amount, currency, keyId
- **What happens on the screen**: Opens the Razorpay payment modal with UPI, Card, Netbanking options.
- **Status**: **Built**

### Verify Razorpay payment signature
- **Method & URL**: `POST /api/payments/verify`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/settings`
- **What the frontend sends**: razorpay_order_id, razorpay_payment_id, razorpay_signature
- **What the backend sends back**: success, transaction details, updated credit balance, message
- **What happens on the screen**: Closes payment modal, shows green 'Payment Successful' screen, and adds credits to topbar.
- **Status**: **Built**

### Get payment tax invoice receipt
- **Method & URL**: `GET /api/payments/receipt/${transactionId}`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/settings`
- **What the frontend sends**: Nothing (transactionId in URL)
- **What the backend sends back**: success, receiptNumber, amount, date, GST details, status
- **What happens on the screen**: Displays downloadable tax invoice receipt modal.
- **Status**: **Built**

### Get my billing and invoice history
- **Method & URL**: `GET /api/payments/my-transactions`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/settings`
- **What the frontend sends**: page, limit
- **What the backend sends back**: success, list of transactions (invoice number, plan, amount, status, date)
- **What happens on the screen**: Populates the payment history table in organization settings.
- **Status**: **Built**

---

## 4.8 In-App Notifications

Delivers notifications, bell icon counters, and mark-as-read updates across all user roles.

### Get in-app notifications list
- **Method & URL**: `GET /api/notifications`
- **Who can use it**: Talent / Organization / Admin
- **Which page uses it**: `/talent/notifications, /recruiter/notifications, /admin/notifications`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of notifications (id, title, message, type, isRead, createdAt, linkUrl), unreadCount
- **What happens on the screen**: Displays user notification cards and topbar bell dropdown.
- **Status**: **Built**

### Get count of unread notifications
- **Method & URL**: `GET /api/notifications/unread-count`
- **Who can use it**: Talent / Organization / Admin
- **Which page uses it**: `All pages (topbar notification bell)`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, count number
- **What happens on the screen**: Displays red badge number on the bell icon (e.g. '3').
- **Status**: **Built**

### Mark single notification as read
- **Method & URL**: `PATCH /api/notifications/${notificationId}/read`
- **Who can use it**: Talent / Organization / Admin
- **Which page uses it**: `Notifications page or topbar dropdown`
- **What the frontend sends**: Nothing (notificationId in URL)
- **What the backend sends back**: success, updated notification record with isRead=true
- **What happens on the screen**: Dims card from unread highlight and decreases bell badge number by 1.
- **Status**: **Built**

### Mark all notifications as read
- **Method & URL**: `PATCH /api/notifications/read-all`
- **Who can use it**: Talent / Organization / Admin
- **Which page uses it**: `/talent/notifications, /recruiter/notifications, /admin/notifications`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, message
- **What happens on the screen**: Clears bell counter badge and marks all notification cards read.
- **Status**: **Built**

---

## 4.9 Verifications & Trust (KYC)

Handles government ID checks, work credit verification, and business incorporation badges.

### Submit government ID verification (KYC)
- **Method & URL**: `POST /api/verifications/identity`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/settings, /talent/profile`
- **What the frontend sends**: documentType ('Aadhaar', 'Passport', 'Voter ID'), documentNumber, frontImageUrl, backImageUrl
- **What the backend sends back**: success, verification record with status='Pending'
- **What happens on the screen**: Shows 'KYC Documents submitted. Verification takes 24-48 hours' badge.
- **Status**: **Built**

### Submit professional film/theatre credits verification
- **Method & URL**: `POST /api/verifications/professional`
- **Who can use it**: Talent
- **Which page uses it**: `/talent/settings, /talent/profile`
- **What the frontend sends**: imdbUrl, workLinks array, references array
- **What the backend sends back**: success, verification record
- **What happens on the screen**: Shows 'Work credits submitted for authenticity review'.
- **Status**: **Built**

### Submit company legal documents verification
- **Method & URL**: `POST /api/verifications/business`
- **Who can use it**: Organization
- **Which page uses it**: `/recruiter/settings`
- **What the frontend sends**: cin, gstNumber, incorporationDocUrl
- **What the backend sends back**: success, verification record with status='Pending'
- **What happens on the screen**: Shows 'Business documents under review by Vismaya Legal Desk'.
- **Status**: **Built**

### Get my submitted verification statuses
- **Method & URL**: `GET /api/verifications/my`
- **Who can use it**: Talent / Organization
- **Which page uses it**: `/talent/settings, /recruiter/settings`
- **What the frontend sends**: Nothing
- **What the backend sends back**: success, list of verification badges and documents with status ('Pending', 'Verified', 'Rejected')
- **What happens on the screen**: Displays verified blue check badges and verification status pill in settings.
- **Status**: **Built**

---

## 5. Photo and Video Upload – How It Works

Here is the exact step-by-step process of how uploading a file works in Vismaya:

```
[1. User selects photo or video file from their computer / phone]
                             ↓
[2. Frontend checks file size and format before uploading]
    - Portfolio Images: Maximum 5 MB (JPG, PNG, WebP)
    - Profile Photo: Maximum 3 MB (JPG, PNG, WebP)
    - Showreel Videos: Maximum 100 MB (MP4, WebM, MOV)
    - Direct audio files are blocked (must be included as video)
                             ↓
[3. User confirms rightsConfirmed = true]
    (User must confirm they own the rights or have permission to upload this content)
                             ↓
[4. Upload starts with live progress bar (0% -> 100%)]
    Sent as binary FormData to the backend
                             ↓
[5. Backend streams file securely to Cloudinary cloud storage]
                             ↓
[6. Cloudinary generates optimized WebP image and video thumbnail]
                             ↓
[7. Backend saves the media link in MongoDB with status: "Pending Moderation"]
                             ↓
[8. Frontend shows new media card in the portfolio gallery with "Under Review" badge]
                             ↓
[9. Admin moderator approves file in Admin Portal -> Card turns live to the public]
```

---

## 6. Google Login – What Is Pending

Google sign-in is already coded in both the frontend and backend, but needs these 5 quick configuration steps to go live:

1. **Google Cloud Console setup**: A project must be registered on Google Cloud Console with OAuth 2.0 Web Client credentials.
2. **Authorized Origins**: `http://localhost:3000` (local development) and your live website URL must be whitelisted as Authorized JavaScript Origins.
3. **Frontend environment variable**: The generated client ID must be pasted into `frontend/.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com`.
4. **Backend environment variable**: The same client ID must be set in the backend `.env` file as `GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com` so the server can verify Google tokens.
5. **Enable the button**: Set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` in frontend `.env.local` so the Google button appears on the login and register screens.

---

## 7. What the Backend Developer Should Do Next

Here is the prioritized checklist of the **8 missing endpoints** that the backend team needs to build, ranked in order of importance:

### Priority 1: Public Contact & Statistics (Needed for Visitors)
1. **`POST /api/contact`**: Create an endpoint that receives `{ name, email, message }`, saves it to an inquiries collection in MongoDB, and sends an alert email to the support team.
2. **`GET /api/public/stats`**: Create an endpoint that counts and returns aggregate totals for the homepage stats banner (`{ verifiedArtists, castingCalls, productionHouses, auditRate }`).

### Priority 2: Admin Broadcast Announcements (Needed for Notifications Desk)
3. **`POST /api/admin/broadcasts`**: Create endpoint to send or schedule system-wide broadcast announcements to talent and organizations.
4. **`GET /api/admin/broadcasts`**: Return past broadcast history with sent timestamps and audience details.
5. **`GET /api/admin/broadcasts/:broadcastId`**: Return single broadcast record details.
6. **`PATCH /api/admin/broadcasts/:broadcastId`**: Allow updating draft announcements before they are dispatched.
7. **`DELETE /api/admin/broadcasts/:broadcastId`**: Cancel or delete scheduled broadcasts.
8. **`GET /api/admin/broadcasts/reach`**: Calculate estimated target recipient reach count (e.g. "1,284 artists in Mumbai") for previewing in the broadcast composer.

---

## 8. Pages Still Using Mock Data or Awaiting Wiring

During the code audit, the following pages were identified where full API wiring is still pending or local data is currently used:

1. **Contact Us Page (`app/contact/page.js`)**:
   - The message form currently uses `e.preventDefault()` without calling `publicService.submitContactForm`. Once the backend creates `POST /api/contact`, this form needs to be wired to call the service.
2. **Admin Analytics Charts (`app/admin/analytics/page.js`)**:
   - The detailed visual graphs (User Growth, Applications by Month, Categories, Conversion Funnel, Top Cities) currently read static numbers from `lib/admin/mockData.js` (`initialAnalyticsData`). While high-level totals come from `GET /api/admin/dashboard`, a dedicated time-series analytics endpoint (`GET /api/admin/analytics?range=30d`) is needed if dynamic chart history is desired.
3. **About Us Page (`app/about/page.js`)**:
   - Purely static informational content (brand story, pillars, FAQ). Does not require any backend API call.
4. **Admin Broadcasts Alias (`app/admin/broadcasts/page.js`)**:
   - Automatically redirects to `/admin/notifications` where the broadcast composer UI is housed.
5. **Admin Organizations Alias (`app/admin/organizations/page.js`)**:
   - Automatically redirects to `/admin/recruiter-management` where the studio review UI is housed.
