# O'Town Dems Newsletter & Community Hub

A comprehensive full-stack web application built for the O'Fallon Area Democratic Club to manage email newsletters, track events, conduct weekly polls, and engage their community.

![App Screenshot](/frontend/public/newsletter.png) 

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
# Database
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key

# Email Configuration
EMAIL_USER=your_sending_gmail_address
EMAIL_PASS=your_16_character_gmail_app_password

# Environment
NODE_ENV=development

# Testing
TEST_EMAIL_RECIPIENT=your_personal_test_email
```

**Note:** For Gmail, you'll need to generate an [App Password](https://support.google.com/accounts/answer/185833) (not your regular Gmail password).

---

## Local Setup & Installation

### Prerequisites
* Node.js (v16 or higher)
* MongoDB (local or Atlas)
* Gmail account with App Password

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
   node utils/seeder.js
   ```

---

## API Endpoints

### Authentication
* `POST /api/users/login` - Admin login
* `GET /api/users/profile` - Get user profile (protected)

### Subscribers
* `GET /api/subscribers` - Get all subscribers (protected)
* `POST /api/subscribers` - Add new subscriber (protected)
* `DELETE /api/subscribers/:id` - Delete subscriber (protected)

### Newsletter
* `POST /api/newsletter/send` - Send newsletter to all subscribers (protected)

### Events
* `GET /api/events` - Get all events
* `POST /api/events` - Create event (protected)
* `PUT /api/events/:id` - Update event (protected)
* `DELETE /api/events/:id` - Delete event (protected)

### Poll System
* `GET /api/poll/active-issues` - Get active poll issues (public)
* `GET /api/poll/all-issues` - Get all issues including inactive (protected)
* `POST /api/poll/vote` - Submit poll vote (public, email required)
* `POST /api/poll/check-email` - Check if email has voted this week (public)
* `GET /api/poll/results` - Get current week results (protected)
* `GET /api/poll/analytics/:weeks` - Get historical analytics (protected)
* `POST /api/poll/update-active-issues` - Toggle issues on/off (protected)
* `POST /api/poll/add-issue` - Add new poll issue (protected)
* `PUT /api/poll/edit-issue` - Edit issue name (protected)
* `DELETE /api/poll/delete-issue` - Delete issue (protected)
* `POST /api/poll/reset-week` - Emergency reset current week (protected)
* `GET /api/poll/monthly-export/:year/:month` - Export CSV (protected)

### Volunteers
* `GET /api/volunteers` - Get all volunteers (protected)
* `POST /api/volunteers` - Add volunteer (protected)
* `DELETE /api/volunteers/:id` - Delete volunteer (protected)

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