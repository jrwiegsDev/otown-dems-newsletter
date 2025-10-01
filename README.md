# O'Town Dems Newsletter App

A full-stack web application built for the O'Fallon Area Democratic Club to provide a simple, secure, and private way to manage their email newsletter subscribers and send out monthly updates.

![App Screenshot](/frontend/public/newsletter.png) 

---

## The Problem It Solves

The group's existing method of sending emails exposed all recipient email addresses in the "To" field, creating a significant privacy issue. This application provides a password-protected admin dashboard where organizers can manage the subscriber list and send HTML-formatted newsletters without revealing any personal information.

## Features

* **Secure Authentication:** A private, token-based (JWT) login system for administrators.
* **Subscriber Management (CRUD):**
    * View the entire subscriber list.
    * Add new subscribers.
    * Delete subscribers with a confirmation step.
    * Live search/filter the list by name or email.
* **Newsletter Composition:** A rich text editor (`react-quill`) for composing formatted HTML emails.
* **Email Service:** Uses Nodemailer and a dedicated Gmail account to send newsletters to all subscribers. Includes a "test mode" to send only to a test address during development.
* **Modern UI:** A responsive, full-screen layout built with **Chakra UI**, featuring a dark mode toggle.

## Tech Stack

* **Frontend:** React.js, Vite, Chakra UI, React Router, Axios, React Quill
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (with Mongoose)
* **Authentication:** JWT (JSON Web Tokens), bcrypt
* **Email:** Nodemailer

---

## Environment Variables

To run this project locally, you will need to create a `.env` file in the `backend` directory with the following variables:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_sending_gmail_address
EMAIL_PASS=your_16_character_gmail_app_password
NODE_ENV=development
TEST_EMAIL_RECIPIENT=your_personal_test_email
```

---

## Local Setup

1.  Clone the repository.
2.  **Backend Setup:**
    * `cd backend`
    * `npm install`
    * Create your `.env` file as described above.
    * Run `npm run dev` (or `nodemon server.js`).
3.  **Frontend Setup:**
    * `cd frontend`
    * `npm install`
    * Run `npm run dev`.