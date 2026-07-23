# UniElect Voting System — Complete Feature Documentation

> **Comprehensive reference for every feature in the UniElect voting system.**
> Built with Next.js (frontend), Express.js (backend), Prisma ORM, Neon PostgreSQL, Redis, and Socket.IO.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Authentication & Security](#2-authentication--security)
3. [User Management & Roles](#3-user-management--roles)
4. [Election Management](#4-election-management)
5. [Candidate Management](#5-candidate-management)
6. [Voter Management](#6-voter-management)
7. [Voting Process](#7-voting-process)
8. [Results Management](#8-results-management)
9. [Notifications System](#9-notifications-system)
10. [Audit & Compliance](#10-audit--compliance)
11. [Reporting](#11-reporting)
12. [File Management](#12-file-management)
13. [Real-Time WebSocket Features](#13-real-time-websocket-features)
14. [Background Jobs & Automation](#14-background-jobs--automation)
15. [Dashboard & Analytics](#15-dashboard--analytics)
16. [System Administration](#16-system-administration)
17. [Backup & Recovery](#17-backup--recovery)
18. [Frontend Features](#18-frontend-features)
19. [Security Middleware & Infrastructure](#19-security-middleware--infrastructure)
20. [Gamification & Engagement](#20-gamification--engagement)
21. [Social Media Integration](#21-social-media-integration)
22. [Issue Reporting](#22-issue-reporting)
23. [Campaign Management](#23-campaign-management)
24. [Task Management](#24-task-management)
25. [Caching & Performance](#25-caching--performance)
26. [API Infrastructure](#26-api-infrastructure)
27. [Data Models Reference](#27-data-models-reference)
28. [Enums Reference](#28-enums-reference)

---

## 1. Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: Neon PostgreSQL via Prisma ORM (`@prisma/client` v5.8+)
- **Cache**: Redis via ioredis (sessions, rate limiting, notification storage, stats caching)
- **WebSocket**: Socket.IO for real-time communication
- **Authentication**: JWT (access + refresh tokens), Passport.js, speakeasy (2FA/TOTP)
- **Email**: Nodemailer with Handlebars templates
- **SMS**: Twilio
- **File Uploads**: Multer with Sharp (image processing)
- **PDF Generation**: PDFKit
- **Excel/CSV**: xlsx, csv-parser
- **QR Codes**: qrcode
- **Scheduling**: node-cron for background jobs
- **Validation**: express-validator, Joi
- **Security**: Helmet, CORS, express-mongo-sanitize, xss, hpp, express-rate-limit
- **Logging**: Winston
- **Compression**: compression middleware
- **Cloud Storage**: Cloudinary, AWS SDK

### Frontend
- **Framework**: Next.js 15 with App Router (Turbopack)
- **Language**: TypeScript
- **UI**: Tailwind CSS, Shadcn UI (Radix UI primitives)
- **Icons**: Lucide React
- **State Management**: Zustand (stores), TanStack React Query (server state)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Chart.js, react-chartjs-2, Recharts
- **Real-Time**: socket.io-client
- **Animations**: Framer Motion
- **Notifications**: react-hot-toast
- **File Handling**: react-dropzone, PapaParse (CSV), xlsx, react-pdf
- **Crypto**: crypto-js (client-side vote encryption/verification)
- **QR Codes**: qrcode
- **Countdown**: react-countdown
- **Tables**: TanStack React Table
- **Date Utils**: date-fns

---

## 2. Authentication & Security

### 2.1 Registration
- **Voter Registration**: Public registration using university student ID (format: `XX###-####/####`), email, password (min 8 chars), first name, last name
- **Candidate Pre-Registration**: Public application submission with student details, faculty, department, course, year of study, intended position, election/position selection, and reason for candidacy (100–2000 chars). Admin approval triggers email with token to complete registration and set password
- **Admin Invitation**: Super Admin sends invitations via email to create ADMIN or MODERATOR accounts. Invitee verifies token and completes registration with password (must include uppercase, lowercase, number, special character)
- **Email Verification**: Token-based email verification with resend capability
- **Password Validation**: Minimum 8 characters; admin/candidate passwords require uppercase, lowercase, number, and special character

### 2.2 Login & Sessions
- **Login**: By email or student ID (identifier) + password
- **JWT Tokens**: Access token + refresh token with rotation
- **Refresh Token Endpoint**: Exchange refresh token for new access token
- **Logout**: Server-side session/token revocation
- **Active Session Management**: View all active sessions, revoke individual sessions by ID
- **Account Status Check**: Check account status by identifier (public endpoint)

### 2.3 Password Management
- **Password Reset Request**: Email-based reset flow with rate limiting
- **Password Reset Confirmation**: Token + new password (min 8 chars)
- **Change Password**: Authenticated endpoint requiring current password + new password

### 2.4 Two-Factor Authentication (2FA)
- **Setup 2FA**: Generate TOTP secret and QR code
- **Verify 2FA**: Verify 6-digit TOTP token
- **Disable 2FA**: Verify token then disable
- **2FA on Vote Casting**: Optional 2FA token required when casting votes

### 2.5 Profile Management
- **View Profile**: Get authenticated user's profile
- **Update Profile**: Update first name, last name, phone number
- **Upload Profile Picture**: Authenticated file upload with image processing

### 2.6 Rate Limiting
- **General Rate Limiting**: 100 requests/15 min (production), 1000 (development)
- **Auth Rate Limiting**: Stricter limits on login/register endpoints (5 attempts/15 min, skip successful)
- **Password Reset Rate Limiting**: Dedicated rate limit for password reset endpoints
- **Voting Rate Limiting**: Special rate limit for vote casting and verification
- **Registration Rate Limiting**: Rate limit for voter/candidate/admin registration
- **Upload Rate Limiting**: Rate limit for file uploads
- **Bulk Rate Limiting**: Rate limit for bulk operations (imports, bulk voter operations)
- **Admin Rate Limiting**: Rate limit for admin endpoints

### 2.7 Cryptographic Security
- **Vote Encryption**: Client-side encryption using crypto-js; server-side encryption utilities
- **Cryptographic Key Management**: `CryptoKey` model for managing encryption keys (types: ENCRYPTION, SIGNING, VERIFICATION)
- **Security Hashing**: `SecurityHash` model for data integrity verification
- **Vote Verification Codes**: Unique verification codes for each vote, allowing voters to verify their vote was recorded
- **Receipt Hashes**: Cryptographic receipt hashes generated on vote completion
- **Results Integrity Verification**: Verify results haven't been tampered with

---

## 3. User Management & Roles

### 3.1 Role-Based Access Control (RBAC)
- **Roles**: `SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `VOTER`
- **Granular Permissions**: Permission-based access control with `checkPermission` middleware
- **Defined Permissions** (from frontend enums):
  - `MANAGE_ELECTIONS`, `MANAGE_CANDIDATES`, `MANAGE_VOTERS`, `VIEW_RESULTS`
  - `GENERATE_REPORTS`, `VIEW_AUDIT_LOGS`, `MANAGE_USERS`, `MANAGE_SYSTEM`
  - `VIEW_ANALYTICS`, `DELETE_VOTERS`, `MANAGE_BACKUPS`
- **Role-Permission Mapping**: Each role has predefined permission sets

### 3.2 User Management (Admin)
- **Create Admin User**: Super Admin creates admin/moderator accounts with specific roles and permissions
- **Update User Role**: Super Admin can change user roles and permissions
- **Toggle User Status**: Activate/deactivate user accounts with reason tracking
- **List Users**: Paginated, filterable user list (by role, faculty, department, active status, verified status, search term, sort fields)
- **Get User Details**: View specific user by ID
- **Update User Details**: Admin can update user info (name, email, phone, faculty, department, course, year of study)
- **Delete User**: Soft delete with reason and optional data transfer (Super Admin only)
- **Bulk Import Users**: Import users from Excel file

### 3.3 User Preferences
- **Notification Preferences**: Email, SMS, push notification toggles; notification type filtering (ELECTION, SYSTEM, REMINDER, SECURITY, CAMPAIGN, CANDIDATE)
- **Theme**: Light, Dark, System
- **Language**: Configurable language preference
- **Accessibility**: Configurable accessibility settings
- **Profile Visibility**: PUBLIC, VOTERS_ONLY, PRIVATE
- **Email Notification Frequency**: Configurable

### 3.4 Voter Profile Features
- **Get/Update Voter Profile**: Self-service profile management
- **Upload Profile Picture**: Image upload with processing
- **Check Election Eligibility**: Per-election eligibility check
- **Voting History**: Personal voting participation records with optional detail inclusion
- **Resend Email Verification**: Self-service verification email resend
- **Get/Update Preferences**: Email and SMS notification preferences

---

## 4. Election Management

### 4.1 Election Lifecycle
- **Statuses**: `DRAFT` → `SCHEDULED` → `ACTIVE` → `COMPLETED` → `CANCELLED` → `ARCHIVED`
- **Auto-Scheduling**: Draft elections auto-scheduled 30 minutes before start time (via cron job)
- **Auto-Start**: Scheduled elections auto-start when `startDate` is reached
- **Auto-End**: Active elections auto-complete when `endDate` is reached, triggering final result calculation
- **Manual Controls**: Start, end, pause, resume, archive elections (admin)
- **Delete Election**: Super Admin only

### 4.2 Election Types
- **PRESIDENTIAL**: University-wide presidential elections
- **STUDENT_UNION**: Student union elections
- **DEPARTMENTAL**: Department-level elections
- **FACULTY**: Faculty-level elections
- **CLUB**: Club elections
- **SOCIETY**: Society elections
- **REFERENDUM**: Referendum voting
- **POLL**: General polls

### 4.3 Election Creation & Configuration
- **Create Election**: Admin/Super Admin with validation (title, description, type, start/end dates, eligibility criteria)
- **Update Election**: Modify election details
- **Election Fields**:
  - Title, description, type
  - Start date, end date
  - Eligibility filters: faculties, departments, courses, years of study
  - `showLiveResults`: Toggle live results visibility
  - `allowAnonymousVoting`: Enable anonymous voting mode
  - `require2FA`: Require 2FA for voting
  - `maxVotesPerVoter`: Configurable vote limits
  - `totalEligibleVoters`: Tracked eligible voter count
  - `turnoutPercentage`: Automatically calculated
  - `totalVotesCast`: Automatically tracked
  - Election cover image, banner image
  - Public visibility settings
  - Results visibility settings

### 4.4 Election Queries
- **Get All Elections**: Paginated, searchable list with filters
- **Get Active Elections**: Currently active elections
- **Get Eligible Elections**: Elections the authenticated user is eligible to vote in
- **Get Election by ID**: Detailed election view
- **Get Election Stats**: Statistics for a specific election (voter, admin, moderator access)

### 4.5 Eligible Voter Management
- **Add Eligible Voters**: Admin can add voters to an election
- **Remove Eligible Voters**: Admin can remove voters from an election
- **Voter Eligibility Model**: `VoterEligibility` tracks per-election eligibility with faculty, department, course, year of study criteria

### 4.6 Positions
- **Position Model**: Each election has multiple positions (e.g., President, Vice President, Secretary)
- **Position Fields**: Title, description, display order, max candidates, max votes, election ID
- **Per-Position Results**: Results calculated per position with rankings

---

## 5. Candidate Management

### 5.1 Candidate Application & Registration
- **Self-Apply**: Authenticated students can apply as candidates for elections/positions with a manifesto
- **Candidate Pre-Registration**: Public application flow (no account required initially) with admin approval and token-based registration completion
- **Open Elections for Registration**: Public endpoint listing elections open for candidate registration

### 5.2 Candidate Profile
- **Update Profile**: Candidates can update their manifesto
- **Upload Photo**: Candidate photo upload with image processing
- **Candidate Fields**: Bio, manifesto, campaign slogan, photo, banner image, social media links, campaign status
- **Running Mates**: Add/remove running mates for paired candidacies (admin/moderator)

### 5.3 Candidate Status Management
- **Statuses**: `PENDING`, `APPROVED`, `REJECTED`, `DISQUALIFIED`, `WITHDRAWN`
- **Approve Candidate**: Admin/Moderator approval
- **Reject Candidate**: Admin/Moderator rejection with reason
- **Disqualify Candidate**: Admin/Super Admin disqualification with reason
- **Update Status**: Direct status update (Admin/Super Admin)
- **Withdraw Candidacy**: Self-service withdrawal with reason

### 5.4 Candidate Queries
- **Get Candidates by Election**: Public endpoint
- **Get Candidates by Position**: Public endpoint
- **Get Candidate by ID**: Public endpoint
- **Search Candidates**: Admin/Moderator search with filters and pagination
- **Get Candidate Stats**: Statistics per election (Admin/Moderator)
- **Get Candidate Analytics**: Detailed analytics per election (Admin/Super Admin)

### 5.5 Bulk Operations
- **Bulk Approve**: Approve multiple candidates at once (Admin/Super Admin)
- **Bulk Reject**: Reject multiple candidates with reason (Admin/Super Admin)

### 5.6 Data Export
- **Export Candidates**: Export candidate data in JSON, CSV, or XLSX format (Admin/Super Admin)

---

## 6. Voter Management

### 6.1 Voter Registration (Admin-Side)
- **Import Voters from File**: Upload Excel/CSV file with voter data
- **Bulk Import Voters**: Import parsed JSON voter data in bulk
- **Export Voters**: Export voter data in JSON, CSV, or XLSX format

### 6.2 Voter Administration
- **Search Voters**: Admin/Moderator search with filters and pagination
- **Get Voter by ID**: Admin/Moderator view individual voter
- **Update Voter Status**: Activate/deactivate voters with reason
- **Delete Voter**: Super Admin only with reason and permission check
- **Bulk Voter Operations**: Activate, deactivate, or delete multiple voters at once
- **Voter Statistics**: Statistics with date range filters
- **Voter Analytics Report**: Generate analytics report with period and date range

### 6.3 Voter Eligibility
- **Eligibility Criteria**: Based on faculty, department, course, year of study
- **Per-Election Eligibility**: Each election defines its own eligibility criteria
- **Eligibility Check**: Voters can check their eligibility for specific elections

---

## 7. Voting Process

### 7.1 Voting Sessions
- **Start Session**: Voter initiates a voting session for an election (with optional device fingerprint)
- **End Session**: Manually end a voting session with optional reason
- **Get Session Details**: Retrieve active session information
- **Extend Session**: Extend session duration (5–30 minutes)
- **Complete Session**: Complete voting session and generate receipt
- **Session Time Limits**: Sessions have configurable time limits
- **Session Statuses**: `ACTIVE`, `COMPLETED`, `EXPIRED`, `ABANDONED`, `TERMINATED`

### 7.2 Ballot Management
- **Get Election Ballot**: Retrieve the ballot for an election (positions, candidates, voting options)
- **Validate Ballot**: Pre-submission ballot validation (structure, completeness)
- **Ballot Structure**: Array of `{ positionId, candidateId }` entries for multi-position voting

### 7.3 Vote Casting
- **Cast Vote**: Submit ballot with session ID; optional 2FA token support
- **Encrypted Voting**: Client-side encryption with crypto-js; server-side encryption support
- **Anonymous Voting**: Optional anonymous voting mode per election
- **Vote Receipt**: Cryptographic receipt hash generated on completion
- **Verification Code**: Unique code per vote for post-voting verification

### 7.4 Vote Verification
- **Verify Vote**: Public endpoint to verify a vote using verification code
- **Verification Status**: Check verification status without full verification
- **Get Vote Receipt**: Retrieve vote receipt using receipt hash

### 7.5 Voting Status & History
- **Check Voting Status**: Check if user has voted in a specific election
- **Vote History**: Personal voting history with optional detail inclusion (VOTER, ADMIN, SUPER_ADMIN)

### 7.6 Issue Reporting
- **Report Voting Issue**: Voters can report issues during voting (election ID, session ID, issue type, description min 20 chars)

### 7.7 Admin Voting Oversight
- **Voting Progress**: Real-time voting progress per election (Admin/Moderator)
- **Real-Time Stats**: Live voting statistics (Admin/Moderator)
- **Voting Analytics**: Comprehensive analytics per election (Admin/Moderator)
- **Tally Votes**: Manual vote tallying with optional partial tally (Admin/Super Admin)
- **Invalidate Vote**: Invalidate a specific vote with reason (Admin/Super Admin)
- **Emergency Voting Options**: Retrieve emergency options for an election (Admin/Super Admin)
- **Export Voting Data**: Export voting data in JSON, CSV, or XLSX with optional personal data inclusion (Admin/Super Admin)

---

## 8. Results Management

### 8.1 Result Calculation
- **Calculate Results**: Admin triggers result calculation for an election
- **Automatic Calculation**: Final results auto-calculated when election ends (via cron job)
- **Live Results**: Real-time result updates during active elections (if `showLiveResults` enabled)
- **Per-Position Results**: Results broken down by position
- **Candidate Rankings**: Automatic ranking based on vote count and percentage
- **Winner Determination**: Highest vote count wins; tie detection with `isTie` flag
- **Result Fields**: `totalVotes`, `percentage`, `rank`, `isWinner`, `isTie`, `publishedAt`

### 8.2 Result Queries
- **Get Election Results**: Authenticated users can view published results
- **Get Position Results**: Position-specific results
- **Get Result Summary**: Summary view of results
- **Live Voting Stats**: Real-time statistics during voting
- **Candidate Performance**: Individual candidate performance metrics (Admin)
- **Compare Results**: Compare results between time periods (Admin)
- **Historical Comparison**: Compare with historical election data (Admin)

### 8.3 Result Publication
- **Publish Results**: Admin publishes results for public viewing
- **Results Integrity Verification**: Super Admin can verify results integrity (cryptographic verification)
- **Results Certificate**: Generate official results certificate (Admin)

### 8.4 Result Export
- **Export Results**: Export results data (Admin)

---

## 9. Notifications System

### 9.1 Notification Types
- `ELECTION`: Election-related notifications
- `SYSTEM`: System-wide notifications
- `REMINDER`: Voting reminders
- `SECURITY`: Security alerts
- `CAMPAIGN`: Campaign-related notifications
- `CANDIDATE`: Candidate-related notifications

### 9.2 Notification Priorities
- `LOW`, `MEDIUM`, `HIGH`, `URGENT`

### 9.3 Notification Channels
- **In-App**: Real-time via WebSocket
- **Email**: Via Nodemailer with Handlebars templates
- **SMS**: Via Twilio
- **Push**: Configurable push notifications

### 9.4 User Notification Features
- **Get Notifications**: Paginated list with filters (unreadOnly, type)
- **Notification Summary**: Dashboard summary of unread counts
- **Mark as Read**: Individual, multiple (bulk), or all notifications
- **Delete Notification**: Remove individual notifications
- **Notification Preferences**: Configure email, SMS, push, and notification type preferences
- **Pending Notifications**: Offline notifications stored in Redis, delivered on WebSocket reconnection

### 9.5 Admin Notification Features
- **System Notification**: Send notifications to all users with target audience filtering (all, voters, candidates, admins)
- **Maintenance Notification**: Scheduled maintenance announcements with optional scheduled time
- **Security Alert**: Send security alerts with severity levels
- **Notification Statistics**: Admin/Moderator notification stats

### 9.6 Election Notifications
- **ElectionNotification Model**: Links notifications to specific elections
- **Automated Reminders**: Cron job sends election start reminders (1 hour before) and end reminders (1 hour before end) to eligible/non-voting users via bulk email

---

## 10. Audit & Compliance

### 10.1 Audit Logging
- **Comprehensive Logging**: All system actions logged with user, action, category, severity, entity, IP, user agent, metadata
- **Audit Categories**: AUTH, ELECTION, VOTE, CANDIDATE, VOTER, ADMIN, SYSTEM, SECURITY, REPORT, FILE, BACKUP, NOTIFICATION
- **Audit Severity Levels**: LOW, MEDIUM, HIGH, CRITICAL

### 10.2 Audit Queries
- **Get Audit Logs**: Advanced filtering (userId, userRole, category, action, severity, entityType, entityId, electionId, date range, IP address, search term, risk level, sort)
- **Get Audit Log Details**: Individual log entry by ID
- **Audit Statistics**: Summary statistics with date range
- **Audit Analytics**: Analytics with date range (Admin/Super Admin)

### 10.3 Compliance
- **Compliance Report**: Generate compliance report with date range (Admin/Super Admin)
- **Audit Integrity Verification**: Verify audit log integrity (Admin/Super Admin)
- **Manual Audit Entry**: Admin can create manual audit entries with full metadata
- **Audit Log Cleanup**: Super Admin can cleanup old logs
- **Audit Log Archiving**: Automatic archiving via cron job (daily at 2 AM, deletes logs older than 1 year)
- **Audit Log Export**: Export in JSON, Excel, or CSV format

### 10.4 Security Events
- **Security Event Logging**: `SecurityEvent` model tracks security-related events
- **Security Event Types**: LOGIN_ATTEMPT, LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, PASSWORD_CHANGE, PASSWORD_RESET, 2FA_SETUP, 2FA_DISABLE, 2FA_VERIFY, SUSPICIOUS_ACTIVITY, ACCOUNT_LOCKOUT, PERMISSION_DENIED, UNAUTHORIZED_ACCESS, TOKEN_REFRESH, SESSION_EXPIRED, RATE_LIMIT_EXCEEDED, API_KEY_USED, DATA_EXPORT, ADMIN_ACTION, CONFIG_CHANGE
- **Get Security Events**: List with resolved filter (Admin/Super Admin)
- **Resolve Security Event**: Mark as resolved with resolution notes (Admin/Super Admin)

---

## 11. Reporting

### 11.1 Report Types
- **Election Report**: Per-election comprehensive report
- **System Report**: System-wide report with date range and archived inclusion
- **Candidate Report**: Per-candidate report (admin or own candidate)
- **Voter Report**: Per-voter report (admin or own voter)
- **Audit Report**: Audit trail report with date range
- **Comparative Report**: Compare 2–10 elections side-by-side
- **Compliance Report**: Compliance-focused report

### 11.2 Report Formats
- **PDF**: Generated via PDFKit
- **Excel**: Generated via xlsx
- **JSON**: Structured data export
- **CSV**: CSV export
- **HTML**: HTML format

### 11.3 Report Templates
- **Report Templates**: `ReportTemplate` model for reusable report configurations
- **Get Templates**: List available report templates (Admin/Moderator)
- **Template Fields**: Name, description, type, filters, schedule configuration, format, status

### 11.4 Scheduled Reports
- **Schedule Report**: Automate report generation with frequency (daily, weekly, monthly, quarterly, yearly), recipients (email list), and format
- **Delete Scheduled Report**: Remove scheduled report
- **Report Status**: Check generation status of a report
- **Download Report**: Download generated report file
- **Report Analytics**: Analytics on report generation (Admin/Super Admin)

### 11.5 Report Management
- **Generated Reports**: `GeneratedReport` model tracks generated reports with status (PENDING, GENERATING, COMPLETED, FAILED, EXPIRED)
- **My Reports**: Users can access their own reports (voter or candidate type)
- **Bulk Generate**: Generate 1–5 reports at once with compression option (Admin/Super Admin)
- **Report Scheduling**: Schedule automated reports with recipients and frequency

---

## 12. File Management

### 12.1 File Upload Types
- **Profile Image**: User profile pictures (authenticated users)
- **Candidate Photo**: Candidate campaign photos (authenticated users/candidates)
- **Manifesto**: Candidate manifesto documents (PDF, DOC, DOCX, TXT)
- **Banner Image**: Election/campaign banner images (Admin/Moderator)
- **Document**: General documents (Admin/Moderator)
- **Bulk Upload**: Up to 10 files at once (Admin/Super Admin)

### 12.2 File Configuration
- **Per-Type Config**: Each upload type has specific max size, allowed MIME types, and allowed extensions
- **Image Processing**: Sharp for image optimization/resizing
- **Multer Integration**: Disk storage with configurable destinations and filenames

### 12.3 File Operations
- **Upload File**: Type-specific upload endpoints
- **Delete File**: File owner or Admin can delete
- **Get File Info**: Retrieve file metadata
- **Validate File**: Pre-upload validation (file name, size, MIME type, upload type)
- **Cleanup Temp Files**: Admin can cleanup temporary files
- **Upload Configs**: Get upload configuration details
- **File Service Health**: Health check for file service (Admin/Super Admin)
- **File Statistics**: Stats by type, date range, total files, total size, average size (Admin/Super Admin)

### 12.4 File Metadata & Security
- **FileMetadata Model**: Tracks file processing status (PENDING, PROCESSING, COMPLETED, FAILED) and virus scan status (PENDING, SCANNING, CLEAN, INFECTED, SKIPPED)
- **FileCategory**: PROFILE_IMAGE, CANDIDATE_PHOTO, MANIFESTO, BANNER_IMAGE, ELECTION_COVER, DOCUMENT, GENERAL
- **AccessLevel**: PUBLIC, AUTHENTICATED, ADMIN_ONLY, OWNER_ONLY
- **Access Control**: Files have access level controls
- **Virus Scanning**: Virus scan status tracking (infrastructure for scanning)

---

## 13. Real-Time WebSocket Features

### 13.1 Connection Management
- **Authenticated Connections**: JWT-based WebSocket authentication
- **Anonymous Connections**: Allowed for public data (election status, live results)
- **Connection Tracking**: Per-user socket tracking, election subscription tracking
- **Heartbeat**: Ping/pong for connection monitoring
- **Connection Stats**: Total connections, authenticated users, election subscriptions

### 13.2 Channels & Subscriptions
- **User Channel**: Personal notifications and updates (`join:user`)
- **Election Channel**: Election-specific updates (`join:election`)
- **Admin Dashboard Channel**: Admin real-time dashboard data (`join:admin`, Admin/Super Admin only)
- **Vote Updates Channel**: Real-time vote count updates (`subscribe:vote_updates`)

### 13.3 Real-Time Events
- **Election Updates**: `VOTE_CAST`, `RESULT_UPDATE`, `STATUS_CHANGE`, `TURNOUT_UPDATE`
- **Notifications**: Real-time user notifications via WebSocket
- **System Announcements**: Broadcast system-wide announcements (INFO, WARNING, MAINTENANCE)
- **Admin Dashboard Data**: Real-time stats (total users, elections, votes, active elections)
- **Election Status**: Real-time election status (status, vote count, candidate count, turnout)
- **Pending Notifications**: Stored in Redis, delivered on reconnection (last 50, 7-day expiry)

### 13.4 Frontend WebSocket Integration
- **useWebSocket Hook**: Connection management, reconnection logic, event subscription
- **WebSocket Message Types**: Election updates, vote updates, notifications, admin updates, system announcements
- **Zustand Stores**: Real-time state management for elections, voting, notifications

---

## 14. Background Jobs & Automation

### 14.1 Scheduled Jobs (via node-cron, timezone: Africa/Nairobi)

| Job | Schedule | Description |
|------|----------|-------------|
| Election Status Update | Every 5 minutes | Auto-schedule drafts, start scheduled, end active elections |
| Vote Counting | Every 10 minutes | Update vote counts, turnout, live results for active elections |
| Notification Cleanup | Daily at midnight | Delete read notifications older than 30 days |
| Session Cleanup | Every 2 hours | Clean expired Redis sessions and database refresh tokens |
| Audit Log Archiving | Daily at 2 AM | Archive/delete audit logs older than 1 year |
| Election Reminders | Every 30 minutes | Send start (1hr before) and end (1hr before) reminders |
| Statistics Update | Every hour | Update cached system statistics |
| Backup Cleanup | Daily at 3 AM | Clean temporary cache entries |

### 14.2 Job Management
- **Singleton Scheduler**: Single instance with job map
- **Stop Individual Job**: Stop specific job by name
- **Stop All Jobs**: Graceful stop of all scheduled jobs
- **Job Status**: Check running status of all jobs

### 14.3 Automated Election Lifecycle
- **Auto-Schedule**: DRAFT → SCHEDULED 30 minutes before start
- **Auto-Start**: SCHEDULED → ACTIVE when start time reached
- **Auto-End**: ACTIVE → COMPLETED when end time reached + final result calculation
- **WebSocket Broadcast**: All status changes broadcast in real-time
- **Stats Cache Refresh**: Caches refreshed after status changes

### 14.4 Automated Reminders
- **Start Reminders**: Email eligible voters 1 hour before election starts
- **End Reminders**: Email non-voting eligible users 1 hour before election ends
- **Deduplication**: Redis-based check to prevent duplicate reminders
- **Bulk Email**: Efficient bulk email sending to eligible voters

---

## 15. Dashboard & Analytics

### 15.1 Admin Dashboard
- **System Statistics**: Total users, verified users, elections, active elections, votes, candidates
- **Dashboard Overview**: Real-time overview (Admin/Super Admin/Moderator)
- **Admin Analytics**: User metrics, election metrics, system metrics, security metrics with period filters (day, week, month, quarter, year)
- **Real-Time Updates**: WebSocket-powered live dashboard data
- **Dashboard Widgets**: `DashboardWidget` model with configurable widget types:
  - `STATS_CARD`, `CHART`, `TABLE`, `GRAPH`, `PROGRESS`, `CUSTOM`
- **Widget Configuration**: Position, size, data source, refresh interval, visibility settings

### 15.2 Voter Dashboard
- **Eligible Elections**: Elections the voter can participate in
- **Voting Status**: Track voted/pending elections
- **Vote History**: Personal participation records
- **Active Elections**: Currently open elections

### 15.3 Candidate Dashboard
- **Campaign Status**: Track campaign progress
- **Vote Count**: Real-time vote count for own candidacy
- **Candidate Analytics**: Performance metrics, engagement tracking
- **Campaign Management**: Manage campaign details

### 15.4 Analytics Tracking
- **AnalyticsEventType**: PAGE_VIEW, LOGIN, LOGOUT, REGISTER, VOTE_CAST, ELECTION_VIEW, CANDIDATE_VIEW, RESULTS_VIEW, REPORT_GENERATED, FILE_UPLOAD, SEARCH, SESSION_START, SESSION_END, ERROR, CUSTOM
- **Analytics Model**: Tracks user ID, session ID, event type, page URL, referrer, user agent, IP address, metadata, duration
- **System Analytics**: Aggregated analytics for admin insights

---

## 16. System Administration

### 16.1 System Configuration
- **SystemConfig Model**: Dynamic system settings with key-value pairs, data types, categories, descriptions
- **Configurable Settings**: Toggle features, set thresholds, configure behavior
- **Settings Management**: Admin UI for system settings

### 16.2 Cache Management
- **Clear System Caches**: Admin can clear caches by type (all, users, elections, results, stats)
- **Redis Caching**: Sessions, rate limiting, notifications, system statistics, user cache
- **Stats Cache Service**: Dedicated caching service for frequently accessed statistics

### 16.3 System Health
- **Health Check Endpoint**: Database, Redis, WebSocket status
- **System Health Status**: Admin endpoint for detailed health metrics
- **API Statistics**: Uptime, memory usage, environment, endpoint count

### 16.4 Emergency Controls
- **Emergency Shutdown**: Super Admin can initiate emergency shutdown with reason and duration (1–1440 minutes)
- **Emergency Voting Options**: Admin can retrieve emergency options for elections

### 16.5 API Documentation
- **API Info Endpoint**: Available endpoints, version, status
- **API Docs Endpoint**: Swagger, Postman, OpenAPI references
- **API Stats**: Uptime, memory usage, environment info

---

## 17. Backup & Recovery

### 17.1 Backup Operations (Super Admin Only)
- **List Backups**: View all database backups
- **Get Backup Details**: View specific backup information
- **Create Backup**: Initiate database backup with optional personal data inclusion and description
- **Restore Backup**: Restore database from a backup
- **Delete Backup**: Remove a backup
- **Download Backup**: Download backup file

### 17.2 Backup Model
- **Backup Types**: `FULL`, `INCREMENTAL`, `MANUAL`, `AUTOMATIC`
- **Backup Status**: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `RESTORED`
- **Backup Fields**: Size, file path, checksum, includes personal data flag, created by, completed at, error message

### 17.3 Automated Cleanup
- **Backup Cleanup Job**: Daily at 3 AM, cleans temporary cache entries

---

## 18. Frontend Features

### 18.1 Pages & Routing (Next.js App Router)

#### Authentication Pages
- **Login**: Email/student ID + password login
- **Register (Voter)**: Student ID-based voter registration
- **Register (Candidate)**: Candidate pre-registration with approval flow
- **Register (Admin)**: Admin invitation completion
- **Verify Email**: Email verification with token
- **Set Password**: Password setup after candidate approval or admin invitation

#### Voter Pages
- **Dashboard**: Personal voting dashboard
- **Elections**: Browse eligible and active elections (list + detail)
- **Vote**: Voting interface with ballot, confirmation, and receipt
- **Results**: View election results (list + detail with charts)
- **History**: Personal voting history
- **Profile**: View/edit profile
- **Settings**: User preferences
- **Candidate**: View candidate profiles

#### Admin Pages
- **Dashboard**: Admin overview with stats and charts
- **Elections**: Full CRUD with create, edit, detail, manage positions, manage voters
- **Candidates**: List, review, approve/reject candidates
- **Voters**: List, import, manage voters
- **Applications**: Review candidate pre-registration applications
- **Invitations**: Manage admin invitations
- **Results**: View and manage results
- **Reports**: Generate and download reports
- **Audit**: View audit logs and security events
- **Backup**: Manage database backups
- **Users**: Manage user accounts
- **Settings**: System configuration

### 18.2 Frontend Middleware
- **Route Protection**: Public routes vs. protected routes
- **Role-Based Routing**: Admin routes restricted to ADMIN/SUPER_ADMIN/MODERATOR
- **Super Admin Exclusive Routes**: Settings, audit, delete operations, backup
- **Email Verification Gate**: Voters must verify email before accessing `/vote/` routes
- **Auth Caching**: 30-second in-memory token verification cache
- **Graceful Fallback**: Network errors don't block page rendering; pages handle auth

### 18.3 Frontend Components

#### Auth Components
- **LoginForm**: Login with validation
- **RegisterForm**: Multi-step voter registration
- **VerifyEmailForm**: Email verification UI
- **AuthGuard**: Route protection wrapper
- **SessionProvider**: Session context provider

#### Voter Components
- **ElectionCard**: Election display card
- **CandidateCard**: Candidate display card with photo, manifesto, campaign info
- **VotingBallot**: Interactive ballot with position/candidate selection
- **VoteConfirmation**: Vote review before submission
- **VoteReceipt**: Cryptographic receipt display with QR code
- **ResultsChart**: Real-time results visualization (bar, pie, line charts)

#### Admin Components
- **ElectionTable**: Sortable, filterable election table
- **CandidateForm**: Candidate creation/editing form
- **VoterTable**: Voter management table with bulk operations
- **VoterImport**: File upload and parsing for bulk voter import
- **ReportsGenerator**: Report generation interface with type, format, and filter selection
- **AuditLog**: Audit log viewer with filtering
- **StatsCard**: Reusable statistics card widget

#### Shared Components
- **Header**: Navigation header with user menu
- **Sidebar**: Role-based navigation sidebar
- **Footer**: System footer
- **NotificationBell**: Real-time notification indicator with dropdown
- **ThemeToggle**: Light/dark/system theme switcher
- **LoadingSpinner/LoadingOverlay**: Loading states
- **ErrorBoundary**: Error boundary wrapper

### 18.4 Frontend State Management

#### Zustand Stores
- **authStore**: Authentication state, user info, login/logout actions
- **electionStore**: Election list, selected election, filters
- **votingStore**: Active voting session, ballot state, vote confirmation
- **notificationStore**: Notification list, unread count, real-time updates

#### React Query Hooks
- **useAuth**: Authentication queries and mutations
- **useElections**: Election data fetching with caching
- **useVoting**: Voting session and ballot management
- **useResults**: Results fetching and live updates
- **useNotifications**: Notification management
- **useWebSocket**: WebSocket connection and event handling

### 18.5 Frontend Utilities
- **crypto.ts**: Client-side encryption/decryption, vote verification, receipt generation
- **permissions.ts**: Permission checking utilities, role-based access helpers
- **validators.ts**: Form validation schemas (Zod)
- **formatters.ts**: Date, number, percentage, text formatters
- **dates.ts**: Date manipulation and formatting utilities
- **storage.ts**: LocalStorage helpers with type safety
- **cn.ts**: Tailwind class name utility

### 18.6 Frontend API Services
- **auth.ts**: Authentication API calls
- **elections.ts**: Election API calls
- **candidates.ts**: Candidate API calls
- **votes.ts**: Voting API calls
- **results.ts**: Results API calls
- **voters.ts**: Voter API calls (inferred from hooks)
- **admin.ts**: Admin API calls
- **adminInvitations.ts**: Admin invitation API calls
- **candidatePreRegistration.ts**: Candidate pre-registration API calls
- **audit.ts**: Audit log API calls
- **reports.ts**: Report generation API calls
- **files.ts**: File upload API calls
- **notifications.ts**: Notification API calls
- **backup.ts**: Backup API calls
- **dashboard.ts**: Dashboard data API calls

---

## 19. Security Middleware & Infrastructure

### 19.1 HTTP Security
- **Helmet**: CSP headers, XSS protection, content type sniffing prevention, frame options
- **CORS**: Configurable origins, credentials, methods, headers (including custom headers: X-API-Key, X-2FA-Token, X-Session-ID, X-Device-ID)
- **Compression**: Gzip compression for responses
- **Body Parsing**: JSON and URL-encoded with 10MB limit
- **Cookie Parser**: Cookie-based auth token storage
- **Session Management**: Express-session with Redis store, secure cookies in production

### 19.2 Input Sanitization
- **Mongo Sanitize**: Remove `$` and `.` from inputs
- **HPP**: HTTP Parameter Pollution protection
- **XSS Protection**: All request body, query, and params sanitized via xss library
- **Express Validator**: Input validation on all routes with detailed error messages

### 19.3 Authentication Middleware
- **authenticate**: JWT verification, user lookup, active status check
- **authorize**: Role-based authorization (one or more allowed roles)
- **optionalAuth**: Optional authentication (doesn't fail if no token)
- **checkPermission**: Granular permission check beyond role check

### 19.4 Additional Middleware
- **Cache Middleware**: Redis-based response caching
- **Logger Middleware**: Request/response logging with duration tracking
- **Error Middleware**: Centralized error handling with AppError class
- **Upload Middleware**: Multer configuration for file uploads
- **Validation Middleware**: Reusable validation patterns
- **Security Middleware**: Additional security checks (CSRF, request size, etc.)
- **Rate Limit Middleware**: Multiple rate limiters for different endpoint types

### 19.5 Backend Utilities
- **email.ts**: Email service with templates, bulk email, verification emails, password reset emails, election reminders
- **sms.ts**: SMS service via Twilio for voting codes, reminders, alerts
- **encryption.ts**: Server-side encryption/decryption utilities
- **hashing.ts**: Hashing utilities for data integrity
- **jwt.ts**: JWT token generation and verification utilities
- **helpers.ts**: General utility functions
- **userCache.ts**: User data caching for performance
- **logger.ts**: Winston logger configuration
- **errors.ts**: Custom error classes (AppError)

---

## 20. Gamification & Engagement

### 20.1 Achievements
- **Achievement Model**: Defined achievements with type, name, description, icon, points, criteria
- **Achievement Types**: `FIRST_VOTE`, `VOTED_IN_ALL_ELECTIONS`, `EARLY_VOTER`, `PERFECT_ATTENDANCE`, `ELECTION_PARTICIPATION`, `CANDIDATE_SUPPORTER`, `CIVIC_DUTY`, `VETERAN_VOTER`, `TRENDSETTER`, `INFLUENCER`
- **UserAchievement Model**: Tracks which users earned which achievements, with earned date and progress
- **Points System**: Achievement points contribute to user engagement scoring

### 20.2 User Engagement
- **Achievement Tracking**: Automatic or manual achievement awarding
- **Progress Tracking**: Partial progress toward achievement criteria
- **Engagement Metrics**: Tracked via analytics events

---

## 21. Social Media Integration

### 21.1 Social Media Links
- **SocialMedia Model**: Links user/candidate profiles to social media platforms
- **Platforms**: `TWITTER`, `FACEBOOK`, `INSTAGRAM`, `LINKEDIN`, `TIKTOK`, `YOUTUBE`, `WHATSAPP`, `TELEGRAM`
- **Profile Links**: Users and candidates can display social media links on their profiles
- **URL Validation**: Platform-specific URL format validation

---

## 22. Issue Reporting

### 22.1 Issue Report System
- **IssueReport Model**: Users can report bugs, feature requests, and other issues
- **Issue Categories**: `BUG`, `FEATURE_REQUEST`, `SECURITY`, `PERFORMANCE`, `UI_UX`, `ACCESSIBILITY`, `OTHER`
- **Issue Priority**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- **Issue Status**: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED`
- **Issue Fields**: Title, description, screenshots, reported by, assigned to, resolution, timestamps
- **Voting Issue Reporting**: Dedicated endpoint for reporting issues during voting (election ID, session ID, issue type, description)

---

## 23. Campaign Management

### 23.1 Campaign Features
- **Campaign Model**: Candidates manage their election campaigns
- **Campaign Status**: `DRAFT`, `ACTIVE`, `PAUSED`, `ENDED`, `SUSPENDED`
- **Campaign Fields**: Slogan, manifesto, campaign images, social media links, engagement metrics
- **Campaign Tracking**: View counts, engagement metrics, supporter counts
- **Campaign Timeline**: Start date, end date aligned with election
- **Campaign Analytics**: Performance tracking for campaign content

---

## 24. Task Management

### 24.1 Internal Task System
- **Task Model**: Internal task assignment and tracking for administrative workflows
- **Task Types**: `ELECTION_SETUP`, `VOTER_VERIFICATION`, `CANDIDATE_REVIEW`, `RESULT_COMPILATION`, `AUDIT_REVIEW`, `SYSTEM_MAINTENANCE`, `USER_SUPPORT`, `REPORT_GENERATION`, `BACKUP_VERIFICATION`, `CUSTOM`
- **Task Priority**: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- **Task Status**: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `OVERDUE`
- **Task Fields**: Title, description, assigned to, created by, due date, completed date, priority, status, related entity (election, user, etc.)
- **Task Tracking**: Assignment, progress, completion tracking

---

## 25. Caching & Performance

### 25.1 Redis Caching
- **Session Storage**: Redis-backed sessions via connect-redis
- **Rate Limiting**: Redis-backed rate limiting via rate-limit-redis
- **Notification Storage**: Offline notifications stored in Redis (7-day expiry, max 50 per user)
- **System Statistics**: Cached statistics with 30-minute TTL
- **User Cache**: User data caching for frequent lookups
- **Election Reminders**: Deduplication keys for sent reminders (1-hour TTL)
- **Temp Data**: Temporary cache entries with TTL

### 25.2 Stats Cache Service
- **Cached Statistics**: total_users, verified_users, total_elections, active_elections, total_votes, total_candidates, draft_elections, scheduled_elections, completed_elections
- **Cache Refresh**: Automatic refresh after status changes
- **Fast Counts**: Cached count queries for dashboard performance

### 25.3 Frontend Caching
- **Auth Cache**: 30-second in-memory token verification cache in middleware
- **React Query**: Server state caching with stale-while-revalidate patterns
- **Local Storage**: Persistent client-side storage for preferences and tokens

### 25.4 Performance Optimizations
- **Selective Queries**: Backend uses `select` to fetch only needed fields
- **Connection Pooling**: Prisma connection pooling
- **Compression**: Gzip response compression
- **Lazy Loading**: Frontend code splitting via Next.js App Router
- **Turbopack**: Fast development builds via Turbopack

---

## 26. API Infrastructure

### 26.1 API Design
- **RESTful API**: Versioned at `/api`
- **Consistent Response Format**: `{ success, data, message, error }`
- **Pagination**: Consistent pagination with page, limit, total pages, total items
- **Error Handling**: Centralized error handler with AppError class
- **Request Logging**: All API requests logged with method, URL, status, duration, IP, user agent

### 26.2 API Endpoints Summary

| Module | Base Path | Key Endpoints |
|--------|-----------|---------------|
| Auth | `/api/auth` | register, login, logout, refresh-token, verify-email, password-reset, 2FA, profile, sessions |
| Elections | `/api/elections` | CRUD, start/end/pause/resume/archive, stats, voter management |
| Candidates | `/api/candidates` | CRUD, approve/reject/disqualify, withdraw, running mates, search, bulk ops, export |
| Candidate Applications | `/api/candidate-applications` | Submit, verify token, complete registration, admin review |
| Admin Invitations | `/api/admin-invitations` | Create, verify, complete, resend, revoke, stats |
| Votes | `/api/votes` | Sessions, cast, verify, validate ballot, receipts, history, admin oversight |
| Results | `/api/results` | Calculate, get, publish, analytics, live stats, export, compare, verify, certificate |
| Voters | `/api/voters` | Register, profile, eligibility, history, preferences, admin management, import/export |
| Admin | `/api/admin` | Stats, users CRUD, import, audit logs, reports, cache, dashboard, backup, notifications, health, emergency |
| Audit | `/api/audit` | Logs, security events, compliance, analytics, export, cleanup, integrity, manual entry |
| Reports | `/api/reports` | Election, system, candidate, voter, audit, comparative, schedule, templates, download, bulk |
| Notifications | `/api/notifications` | Get, summary, mark read, delete, preferences, admin maintenance/security/stats |
| Files | `/api/files` | Upload (profile, candidate, manifesto, banner, document, bulk), delete, info, validate, cleanup, stats |
| Backups | `/api/admin/backups` | List, get, create, restore, delete, download |
| Health | `/health` | System health check |
| Stats | `/api/stats` | API statistics |

### 26.3 Validation
- **express-validator**: All routes have input validation with detailed error messages
- **Custom Validators**: Domain-specific validation (student ID format, phone format, etc.)
- **Joi**: Additional schema validation
- **Zod**: Frontend form validation

---

## 27. Data Models Reference

### Core Models
- **User**: id, studentId, email, password, firstName, lastName, middleName, phone, role, faculty, department, course, yearOfStudy, admissionYear, isActive, isVerified, twoFactorEnabled, twoFactorSecret, profileImage, lastLogin, permissions, relations to votes, elections, candidates, notifications, audit logs, sessions, achievements, social media, preferences, issue reports, campaigns, tasks
- **Election**: id, title, description, type, status, startDate, endDate, createdBy, eligibility criteria (faculties, departments, courses, years), showLiveResults, allowAnonymousVoting, require2FA, maxVotesPerVoter, totalEligibleVoters, totalVotesCast, turnoutPercentage, coverImage, relations to positions, candidates, votes, results, voter eligibility, notifications
- **Candidate**: id, userId, electionId, positionId, status, bio, manifesto, campaignSlogan, photo, bannerImage, socialMediaLinks, runningMateId, verifiedAt, approvedBy, relations to user, election, position, votes, results, campaign
- **Position**: id, electionId, title, description, displayOrder, maxCandidates, maxVotes, relations to election, candidates, votes, results
- **Vote**: id, electionId, positionId, candidateId, voterId, verificationCode, receiptHash, isEncrypted, isAnonymous, isValid, invalidatedAt, invalidatedBy, invalidationReason, relations to election, position, candidate, voter
- **VotingSession**: id, userId, electionId, deviceFingerprint, startTime, endTime, duration, status, completedAt, relations to user, election
- **Result**: id, electionId, positionId, candidateId, totalVotes, percentage, rank, isWinner, isTie, calculatedAt, publishedAt, relations to election, position, candidate

### Security Models
- **AuditLog**: id, userId, userRole, action, category, severity, entityType, entityId, electionId, description, metadata, ipAddress, userAgent, timestamp
- **SecurityEvent**: id, type, severity, description, userId, ipAddress, userAgent, metadata, resolved, resolvedAt, resolvedBy, resolution
- **CryptoKey**: id, type, key, algorithm, status, createdAt, expiresAt, createdBy
- **SecurityHash**: id, hash, data, algorithm, createdAt
- **RefreshToken**: id, token, userId, expiresAt, revoked, replacedBy
- **VerificationToken**: id, token, userId, type, expiresAt

### System Models
- **SystemConfig**: id, key, value, dataType, category, description, isPublic, updatedBy
- **Notification**: id, userId, type, title, message, data, read, readAt, priority, createdAt
- **ElectionNotification**: id, electionId, notificationId, type
- **Analytics**: id, userId, sessionId, eventType, pageUrl, referrer, userAgent, ipAddress, metadata, duration, createdAt
- **Backup**: id, type, status, size, filePath, checksum, includesPersonalData, createdBy, createdAt, completedAt, errorMessage
- **DashboardWidget**: id, userId, type, title, position, size, config, dataSource, refreshInterval, isVisible
- **WebSocketConnection**: id, userId, socketId, connectionStatus, connectedAt, disconnectedAt

### Extended Models
- **VoterEligibility**: id, electionId, userId, faculty, department, course, yearOfStudy, isEligible
- **File**: id, filename, originalName, mimeType, size, path, category, accessLevel, uploadedBy, virusScanStatus
- **FileMetadata**: id, fileId, processingStatus, processingError, thumbnailPath, dimensions, duration
- **Achievement**: id, type, name, description, icon, points, criteria
- **UserAchievement**: id, userId, achievementId, earnedAt, progress
- **SocialMedia**: id, userId, platform, url, isPublic
- **UserPreferences**: id, userId, emailNotifications, smsNotifications, pushNotifications, notificationTypes, theme, language, accessibility, profileVisibility, emailFrequency
- **IssueReport**: id, title, description, category, priority, status, reportedBy, assignedTo, screenshots, resolution, createdAt, resolvedAt
- **Campaign**: id, candidateId, status, slogan, manifesto, images, socialMediaLinks, startDate, endDate, viewCount, engagementMetrics
- **Task**: id, title, description, assignedTo, createdBy, type, priority, status, dueDate, completedDate, relatedEntityType, relatedEntityId
- **ReportTemplate**: id, name, description, type, filters, schedule, format, status, createdBy
- **GeneratedReport**: id, templateId, type, status, format, fileUrl, generatedBy, createdAt, completedAt, errorMessage
- **CandidatePreRegistration**: id, studentId, email, firstName, lastName, middleName, phone, faculty, department, course, yearOfStudy, intendedPosition, electionId, positionId, reason, status, approvalToken, approvedBy, approvedAt, reviewNotes, rejectionReason
- **AdminInvitation**: id, email, role, token, status, invitedBy, expiresAt, completedAt, studentId, firstName, lastName, middleName, phone, faculty, department, course, yearOfStudy, admissionYear

---

## 28. Enums Reference

### User Roles
`SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `VOTER`

### Election
- **Type**: `PRESIDENTIAL`, `STUDENT_UNION`, `DEPARTMENTAL`, `FACULTY`, `CLUB`, `SOCIETY`, `REFERENDUM`, `POLL`
- **Status**: `DRAFT`, `SCHEDULED`, `ACTIVE`, `COMPLETED`, `CANCELLED`, `ARCHIVED`

### Candidate
- **Status**: `PENDING`, `APPROVED`, `REJECTED`, `DISQUALIFIED`, `WITHDRAWN`
- **PreRegStatus**: `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `COMPLETED`

### Voting Session
- **Status**: `ACTIVE`, `COMPLETED`, `EXPIRED`, `ABANDONED`, `TERMINATED`

### Audit
- **Category**: `AUTH`, `ELECTION`, `VOTE`, `CANDIDATE`, `VOTER`, `ADMIN`, `SYSTEM`, `SECURITY`, `REPORT`, `FILE`, `BACKUP`, `NOTIFICATION`
- **Severity**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

### Notifications
- **Type**: `ELECTION`, `SYSTEM`, `REMINDER`, `SECURITY`, `CAMPAIGN`, `CANDIDATE`
- **Priority**: `LOW`, `MEDIUM`, `HIGH`, `URGENT`

### Tokens
- **TokenType**: `VERIFICATION`, `PASSWORD_RESET`, `INVITATION`, `CANDIDATE_APPROVAL`, `SESSION`

### Files
- **FileCategory**: `PROFILE_IMAGE`, `CANDIDATE_PHOTO`, `MANIFESTO`, `BANNER_IMAGE`, `ELECTION_COVER`, `DOCUMENT`, `GENERAL`
- **AccessLevel**: `PUBLIC`, `AUTHENTICATED`, `ADMIN_ONLY`, `OWNER_ONLY`
- **FileProcessingStatus**: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`
- **VirusScanStatus**: `PENDING`, `SCANNING`, `CLEAN`, `INFECTED`, `SKIPPED`

### Analytics
- **AnalyticsEventType**: `PAGE_VIEW`, `LOGIN`, `LOGOUT`, `REGISTER`, `VOTE_CAST`, `ELECTION_VIEW`, `CANDIDATE_VIEW`, `RESULTS_VIEW`, `REPORT_GENERATED`, `FILE_UPLOAD`, `SEARCH`, `SESSION_START`, `SESSION_END`, `ERROR`, `CUSTOM`

### Backup
- **BackupType**: `FULL`, `INCREMENTAL`, `MANUAL`, `AUTOMATIC`
- **BackupStatus**: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `RESTORED`

### Achievements
- **AchievementType**: `FIRST_VOTE`, `VOTED_IN_ALL_ELECTIONS`, `EARLY_VOTER`, `PERFECT_ATTENDANCE`, `ELECTION_PARTICIPATION`, `CANDIDATE_SUPPORTER`, `CIVIC_DUTY`, `VETERAN_VOTER`, `TRENDSETTER`, `INFLUENCER`

### Social Media
- **SocialPlatform**: `TWITTER`, `FACEBOOK`, `INSTAGRAM`, `LINKEDIN`, `TIKTOK`, `YOUTUBE`, `WHATSAPP`, `TELEGRAM`

### User Preferences
- **ProfileVisibility**: `PUBLIC`, `VOTERS_ONLY`, `PRIVATE`
- **Theme**: `LIGHT`, `DARK`, `SYSTEM`

### Issues
- **IssueCategory**: `BUG`, `FEATURE_REQUEST`, `SECURITY`, `PERFORMANCE`, `UI_UX`, `ACCESSIBILITY`, `OTHER`
- **IssuePriority**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- **IssueStatus**: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED`

### Campaign
- **CampaignStatus**: `DRAFT`, `ACTIVE`, `PAUSED`, `ENDED`, `SUSPENDED`

### Tasks
- **TaskType**: `ELECTION_SETUP`, `VOTER_VERIFICATION`, `CANDIDATE_REVIEW`, `RESULT_COMPILATION`, `AUDIT_REVIEW`, `SYSTEM_MAINTENANCE`, `USER_SUPPORT`, `REPORT_GENERATION`, `BACKUP_VERIFICATION`, `CUSTOM`
- **TaskPriority**: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- **TaskStatus**: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `OVERDUE`

### Security Events
- **SecurityEventType**: `LOGIN_ATTEMPT`, `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `PASSWORD_CHANGE`, `PASSWORD_RESET`, `2FA_SETUP`, `2FA_DISABLE`, `2FA_VERIFY`, `SUSPICIOUS_ACTIVITY`, `ACCOUNT_LOCKOUT`, `PERMISSION_DENIED`, `UNAUTHORIZED_ACCESS`, `TOKEN_REFRESH`, `SESSION_EXPIRED`, `RATE_LIMIT_EXCEEDED`, `API_KEY_USED`, `DATA_EXPORT`, `ADMIN_ACTION`, `CONFIG_CHANGE`

### Crypto
- **CryptoKeyType**: `ENCRYPTION`, `SIGNING`, `VERIFICATION`

### WebSocket
- **ConnectionStatus**: `CONNECTED`, `DISCONNECTED`, `RECONNECTING`, `ERROR`

### Dashboard
- **WidgetType**: `STATS_CARD`, `CHART`, `TABLE`, `GRAPH`, `PROGRESS`, `CUSTOM`

### Reports
- **ReportType**: `ELECTION_SUMMARY`, `VOTER_TURNOUT`, `CANDIDATE_PERFORMANCE`, `AUDIT_TRAIL`, `SYSTEM_HEALTH`, `USER_ACTIVITY`, `VOTING_ANALYTICS`, `COMPLIANCE`, `CUSTOM`
- **ReportFormat**: `PDF`, `EXCEL`, `CSV`, `JSON`, `HTML`
- **ReportStatus**: `PENDING`, `GENERATING`, `COMPLETED`, `FAILED`, `EXPIRED`

### System Status
- **SystemStatus**: `OPERATIONAL`, `DEGRADED`, `MAINTENANCE`, `EMERGENCY`, `OFFLINE`

### Permissions
`MANAGE_ELECTIONS`, `MANAGE_CANDIDATES`, `MANAGE_VOTERS`, `VIEW_RESULTS`, `GENERATE_REPORTS`, `VIEW_AUDIT_LOGS`, `MANAGE_USERS`, `MANAGE_SYSTEM`, `VIEW_ANALYTICS`, `DELETE_VOTERS`, `MANAGE_BACKUPS`

---

## University Configuration

### Faculties (JKUAT)
- Computing & Information Technology
- Engineering & Technology
- Science
- Agriculture
- Business
- Economics
- Education
- Medical Sciences
- Pharmacy
- Health Sciences
- Architecture & Building Sciences
- Art & Design

### Year of Study
Year 1 through Year 6

### Student ID Format
`XX###-####/####` (e.g., `ABC123-1234/2023`)

### Phone Number Format
Kenyan format: `+254` or `0` followed by `7` or `1` and 8 digits

---

*This document was generated from a comprehensive analysis of the UniElect voting system codebase, including the Prisma schema, backend routes/controllers/services/middleware/utils, frontend pages/components/hooks/stores/utils/api, and configuration files.*
