# O'Town Dems Newsletter App

A simple and secure web application built for the O'Fallon Area Democratic Club to manage their email newsletter subscribers and send out monthly updates. This tool solves the privacy concern of sending mass emails with all recipient addresses visible.

## Tech Stack

This is a full-stack MERN project:

* **MongoDB:** NoSQL database for storing user and subscriber data.
* **Express.js:** Backend framework for building the RESTful API.
* **React.js:** Frontend library for building the user interface.
* **Node.js:** JavaScript runtime for the server.

## Current Features (Backend)

The backend API is currently in development. The following features are complete and tested:

* **Subscriber Management (CRUD):**
    * `POST /api/subscribers` - Add a new subscriber to the mailing list.
    * `GET /api/subscribers` - Retrieve a list of all subscribers.
    * `DELETE /api/subscribers/:id` - Remove a subscriber from the list.
* **Secure Environment:** Sensitive information like database connection strings and API keys are managed securely using environment variables.

## Project Roadmap

-   [ ] **Phase 1: Authentication** - Build user registration and login routes with JWT for secure access.
-   [ ] **Phase 2: Frontend UI** - Develop the React frontend with a component library (MUI or Chakra UI) for the admin dashboard.
-   [ ] **Phase 3: Email Service** - Integrate Nodemailer to handle the composition and sending of the newsletter.
-   [ ] **Phase 4: Deployment** - Deploy the full-stack application to a hosting service like Render.