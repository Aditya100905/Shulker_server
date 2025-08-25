# 🚀 Shulker Backend (v2 of [VConnect](https://github.com/vansh-000/vconnect))

> **Ongoing Group Project**  
> This repository contains the backend API for **Shulker**, the new version 2 iteration of my earlier personal project, VConnect.  
> While VConnect was developed individually, Shulker is a collaborative group effort to build a more scalable, feature-rich backend service.  

A modular, production-ready Node.js/Express backend for user management, authentication, profile updates, and file handling. Integrates JWT, Google OAuth, secure password reset, Cloudinary media storage, and a modern scalable architecture.

---

## 📦 Features

- User authentication (JWT, Google OAuth)
- Session management with refresh tokens
- Secure password reset via email OTP
- File uploads (avatars, etc.) stored on Cloudinary
- RESTful API structure (controllers, models, middlewares)
- Centralized error handling
- Email notifications for key events (reset, register)
- Passport.js strategies (Google)
- Easily extensible for other resources

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT, Passport.js (Google OAuth)
- **Media:** Cloudinary
- **Email:** Nodemailer
- **Upload:** Multer
- **Config:** dotenv

---

## 📁 Project Structure
```
├── .env.sample
├── .gitignore
├── README.md
├── package-lock.json
├── package.json
├── public/
│ └── default.webp
└── src/
├── app.js
├── controllers/
│ └── user.controller.js
├── db/
│ └── index.js
├── middlewares/
│ ├── auth.middleware.js
│ ├── error.middleware.js
│ └── multer.middleware.js
├── models/
│ └── user.model.js
├── routes/
│ └── user.routes.js
├── server.js
└── utils/
├── ApiError.js
├── ApiResponse.js
├── FileHelper.js
├── asyncHandler.js
├── cloudinary.js
├── cookiesOptions.js
├── passport.js
└── sendEmail.js
```
---

## ⚙️ Setup & Installation

### 1. Clone the Repo

git clone https://https://github.com/vansh-000/Shulker_server.git

### 2. Install Dependencies

npm install

### 3. Configure Environment Variables

- Copy `.env.sample` ➡️ `.env`
- Fill in required values (see sample below):
```
PORT=
FRONTEND_URL=
EMAIL_USER=
EMAIL_PASS=
MONGODB_URI=
ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SESSION_SECRET=
BACKEND_URL=
NODE_ENV=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_URL=
```

### 4. Start the Server

npm run dev
or
nodemon src/server.js

The app runs at `http://localhost:<PORT>`

---

## 🚀 API Endpoints (Examples)

- `POST   /api/user/register`         — Register new user
- `POST   /api/user/login`            — Authenticate user
- `GET    /api/user/profile`          — Get user profile (protected)
- `PUT    /api/user/profile`          — Update profile info
- `POST   /api/user/reset-password`   — Request password reset
- `POST   /api/user/upload-avatar`    — Upload profile picture
- `GET    /api/user/oauth/google`     — Google OAuth login/initiate

*For detailed endpoints and usage, see* `src/routes/user.routes.js`

---

## 🧩 Extending & Customization

- Add new models/controllers for additional resources (e.g., admins, roles, notifications)
- Integrate additional Passport.js strategies (Facebook, GitHub, etc.)
- Connect external services for analytics, logging, and monitoring

---

## 🤝 Contributing

This is a collaborative team project. Pull requests and issues are welcome.  
Please communicate major changes with the team before submitting significant PRs.

---

*Powered by Node.js, built for Shulker — the collaborative v2 evolution of VConnect.*
