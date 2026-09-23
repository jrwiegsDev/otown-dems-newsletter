# O'Town Dems Newsletter - Backend API & Admin Dashboard

**This is the backend.** A Node.js/Express REST and WebSocket API, MongoDB data model, and SMTP email pipeline (MailerSend) that powered the O'Fallon Area Democratic Club's newsletter and public website, plus the password-protected React admin dashboard staff used to run it. The public-facing frontend lives in [otown-dems-hub](https://github.com/jrwiegsDev/otown-dems-hub).

![App Screenshot](/frontend/public/newsletter.png) 

---

## Status: sunset September 2026

This project is archived and no longer running. The API, admin dashboard, and email sending were in production from October 2025 to September 2026. The code is kept here, read-only, for reference.

- **Operating period:** October 1, 2025 – September 23, 2026
- **Mailing list:** grew from 118 contacts at launch to 179 subscribers
- **Email delivered:** 3,233 emails via MailerSend in the final six months alone (April – September 2026; earlier volume is past the provider's retention window)
- **Weekly community poll:** 42 weeks of results aggregated and archived
- **Events:** 26+ managed through the admin calendar

---

## Overview

This application serves as the central hub for the O'Fallon Area Democratic Club, providing organizers with powerful tools to:
- Manage newsletter subscribers and send HTML-formatted emails
- Track events and volunteers
- Conduct weekly polls on political issues with real-time analytics
- All while maintaining privacy and security for member data

## The Problem It Solves

The group's existing method of sending emails exposed all recipient email addresses in the "To" field, creating a significant privacy issue. This application provides a password-protected admin dashboard where organizers can manage the subscriber list and send newsletters without revealing any personal information.

## Key Features

### Newsletter Management
* **Secure Authentication:** Token-based (JWT) login system for administrators
* **Subscriber Management (CRUD):**
    * View, add, and delete subscribers
    * Live search/filter by name or email
    * Import/export capabilities
* **Rich Text Editor:** Compose formatted HTML emails with `react-quill`
* **Email Service:** Nodemailer with Gmail integration
    * Test mode for development
    * BCC to all subscribers for privacy

### Weekly Poll System
* **Dynamic Issue Management:**
    * Admin UI to add, edit, delete, and toggle poll topics
    * Two-tier system: Active issues (visible to voters) vs. All issues (historical data preserved)
    * Database-persisted configuration
* **Real-time Polling:**
    * WebSocket integration for live vote updates
    * Email-based voting with SHA-256 hashing for privacy
    * Multi-select voting (up to 3 issues)
* **Analytics Dashboard:**
    * 52-week historical trend charts
    * Current week statistics with live updates
    * Issue-by-issue breakdowns with Chart.js
    * Monthly CSV exports
* **Automated Archival:**
    * Weekly cron job archives completed polls
    * Manual override capability for admins

### Event Management
* **Full Calendar Dashboard:** View all upcoming events
* **Add Events with:**
    * Google Places autocomplete for locations
    * Date, time, and description fields
    * Easy editing and deletion
* **Public Display:** Events feed for community members

### Volunteer Management
* **Track volunteer signups** with contact information
* **Manage interests and availability**
* **Export volunteer lists** for outreach

### Modern UI/UX
* **Responsive Design:** Works on desktop, tablet, and mobile
* **Chakra UI Components:** Clean, accessible interface
* **Dark Mode Support:** User preference toggle
* **Dashboard Layout:** Organized navigation with tabbed sections

---

## Tech Stack

### Frontend
* **React.js** (v18) with **Vite** build tool
* **Chakra UI** for component library
* **React Router** for navigation
* **Axios** for API requests
* **React Quill** for rich text editing
* **Chart.js** with react-chartjs-2 for analytics
* **WebSocket** for real-time updates

### Backend
* **Node.js** with **Express.js** framework
* **MongoDB** with **Mongoose** ODM
* **JWT** authentication with bcrypt
* **Nodemailer** for email delivery
* **WebSocket (ws)** for real-time features
* **node-cron** for scheduled tasks
* **validator** for email validation

---

## Project Structure

```
otown-dems-newsletter/
├── backend/
│   ├── models/           # Mongoose schemas
│   │   ├── userModel.js
│   │   ├── subscriberModel.js
│   │   ├── eventModel.js
│   │   ├── pollVoteModel.js
│   │   ├── pollAnalyticsModel.js
│   │   └── pollConfigModel.js
│   ├── routes/           # API endpoints
│   │   ├── userRoutes.js
│   │   ├── subscriberRoutes.js
│   │   ├── newsletterRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── pollRoutes.js
│   │   └── volunteerRoutes.js
│   ├── middleware/       # Auth middleware
│   ├── utils/            # Helpers & schedulers
│   │   ├── pollScheduler.js
│   │   ├── checkWeekData.js
│   │   └── seeder.js
│   └── server.js         # App entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page views
│   │   ├── services/     # API service layer
│   │   ├── context/      # Auth context
│   │   └── hooks/        # Custom React hooks
│   └── index.html
└── README.md
```

---

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=8000

# Database
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key

# Email (any SMTP provider; production used MailerSend)
EMAIL_HOST=smtp.mailersend.net
EMAIL_PORT=587
EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password

# Environment
NODE_ENV=development

# Optional email routing
TEST_EMAIL_RECIPIENT=your_test_inbox          # development: newsletters go only to this address
VOLUNTEER_TEST_EMAIL=your_test_inbox          # development: volunteer emails go only to this address
PRIORITY_EMAIL_RECIPIENT=an_address_to_send_first   # moved to the front of every send
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=your_maps_key   # event location autocomplete
```

**Note:** SMTP uses STARTTLS on port 587 (`secure: false` in Nodemailer). Newsletters are sent one recipient at a time, 15 seconds apart, to stay within provider rate limits.

---

## Local Setup & Installation

### Prerequisites
* Node.js (v16 or higher)
* MongoDB (local or Atlas)
* SMTP credentials (production used MailerSend)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jrwiegsDev/otown-dems-newsletter.git
   cd otown-dems-newsletter
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create .env file with variables above
   npm run server
   ```
   Server runs on `http://localhost:8000`

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Client runs on `http://localhost:5173`

4. **Seed Database (Optional):**
   ```bash
   cd backend
   npm run data:import
   ```
   Loads placeholder users and subscribers from `backend/data/`. **This deletes all existing users and subscribers first**, so only run it against a local database.

---

## API Endpoints

"Protected" routes require a JWT (`Authorization: Bearer <token>`). "Superadmin" routes also require the superadmin role. Public form endpoints are rate-limited and use a honeypot field and submission-timing check to block spam.

### Authentication & Staff
* `POST /api/users/login` - Staff login, returns a 30-day JWT (public)
* `POST /api/users/change-password` - Change own password (protected)
* `GET /api/users/staff` - List staff accounts (superadmin)
* `POST /api/users/staff` - Create staff account (superadmin)
* `PUT /api/users/staff/:id` - Update staff account (superadmin)
* `DELETE /api/users/staff/:id` - Delete staff account (superadmin)
* `POST /api/users/staff/:id/reset-password` - Reset a staff password (superadmin)

### Subscribers
* `GET /api/subscribers` - Get all subscribers (protected)
* `POST /api/subscribers` - Subscribe, or update name if the email already exists (public, spam-protected)
* `PUT /api/subscribers/:id` - Update subscriber (protected)
* `DELETE /api/subscribers/:id` - Delete subscriber (protected)

### Newsletter
* `POST /api/newsletter/send` - Send newsletter to all or selected subscribers (protected)
* `GET /api/newsletter/drafts` - List drafts (protected)
* `GET /api/newsletter/drafts/:id` - Get draft (protected)
* `POST /api/newsletter/drafts` - Save draft (protected)
* `PUT /api/newsletter/drafts/:id` - Update draft (protected)
* `DELETE /api/newsletter/drafts/:id` - Delete draft (protected)

### Events
* `GET /api/events` - Get calendar events: recurring events expanded up to 6 months out, past events included (public)
* `GET /api/events/raw` - Get stored event records (protected)
* `GET /api/events/archived` - Get archived events (protected)
* `POST /api/events` - Create event (protected)
* `PUT /api/events/:id` - Update event (protected)
* `PUT /api/events/:id/banner` - Set banner event (protected)
* `DELETE /api/events/:id` - Delete event (protected)

### Announcements
* `GET /api/announcements` - Get announcements (public)
* `GET /api/announcements/archived` - Get archived announcements
* `POST /api/announcements` - Create announcement
* `PUT /api/announcements/:id` - Update announcement
* `DELETE /api/announcements/:id` - Delete announcement

### Poll System
* `GET /api/poll/active-issues` - Get active poll issues (public)
* `POST /api/poll/check-email` - Check if an email has voted this week (public)
* `POST /api/poll/vote` - Submit poll vote; emails are stored only as hashes (public, spam-protected)
* `GET /api/poll/results` - Get current week results (public)
* `GET /api/poll/analytics` - Get historical weekly analytics (public)
* `GET /api/poll/all-issues` - Get all issues including inactive (protected)
* `POST /api/poll/update-active-issues` - Toggle issues on/off (protected)
* `POST /api/poll/add-issue` - Add new poll issue (protected)
* `PUT /api/poll/edit-issue` - Edit issue name (protected)
* `DELETE /api/poll/delete-issue` - Delete issue (protected)
* `POST /api/poll/archive-completed-week` - Archive the finished week's results (protected)
* `POST /api/poll/reset-week` - Emergency reset current week (protected)
* `GET /api/poll/monthly-export/:year/:month` - Export vote totals as CSV (protected)

### Volunteers
* `GET /api/volunteers` - Get all volunteers (protected)
* `POST /api/volunteers` - Volunteer sign-up; emails the club and the volunteer (public, spam-protected)
* `PUT /api/volunteers/:id` - Update volunteer (protected)
* `DELETE /api/volunteers/:id` - Delete volunteer (protected)

### Site Config
* `GET /api/config/snowfall` - Get seasonal snowfall toggle (public)
* `POST /api/config/snowfall` - Set snowfall toggle, broadcast to clients over WebSocket (superadmin)

---

## Poll System Deep Dive

### Two-Tier Issue Management
The poll system uses a sophisticated two-list approach:

1. **Active Issues** - Currently available for voting on the public form
2. **All Valid Issues** - Complete list including inactive issues (preserves historical data)

This allows you to:
- Rotate issues in/out organically as political topics change
- Preserve historical voting data for all past issues
- Maintain data integrity across 52 weeks of analytics

### How It Works
1. **Admin adds/edits issues** via the "Manage Issues" tab
2. **Issues are toggled active/inactive** with a switch (real-time update to public form)
3. **Voters see only active issues** on the public voting form
4. **Analytics show all historical data** regardless of current active status
5. **Every Sunday at 11:59 PM** the system automatically archives the week's votes

### Data Flow
```
Public Voter → Votes on Active Issues → PollVote (current week)
                                              ↓
                                    (Sunday night cron job)
                                              ↓
                                      PollAnalytics (archived)
                                              ↓
                                    Analytics Dashboard Charts
```

---

## WebSocket Integration

The app uses WebSocket for real-time updates:

* **Poll Results:** Live vote counts update without refreshing
* **New Votes:** All connected admins see votes as they come in
* **Poll Resets:** Instant notification when a poll is reset

WebSocket server runs on port `8000` alongside the Express API.

---

## Deployment Notes

### Backend (Railway/Render/Heroku)
* Set all environment variables
* Ensure `NODE_ENV=production`
* MongoDB Atlas recommended for database

### Frontend (Vercel/Netlify)
* Update API base URL in `axiosConfig.js`
* Update WebSocket URL in components
* Build command: `npm run build`
* Output directory: `dist`

---

## Future Enhancements

- [ ] Email templates library
- [ ] Scheduled newsletter sending
- [ ] Member portal with self-service subscription management
- [ ] SMS notifications for events
- [ ] Advanced analytics dashboard with demographics
- [ ] Multi-user admin roles with permissions

---

## Contributing

This is a private project for the O'Fallon Area Democratic Club. For questions or issues, contact the maintainer.

---

## License

Private - All Rights Reserved

---

## Contact

**Developer:** jrwiegsDev  
**Organization:** O'Fallon Area Democratic Club