🍽️ Restaurant Reservation Management System

A production-ready full-stack Restaurant Reservation Management System built using React, Node.js, Express, MongoDB Atlas, and JWT Authentication. The application enables customers to make reservations seamlessly while providing administrators with advanced tools to manage reservations, restaurant settings, tables, and analytics.

🚀 Live Demo

Frontend + Backend
https://table-reservation-internship.onrender.com
📂 GitHub Repository
https://github.com/boinasathvika05/table-reservation
📖 Project Overview

This application streamlines restaurant reservation management by providing:

Secure customer authentication
Intelligent table allocation
Prevention of double bookings
Reservation lifecycle management
Administrator dashboard
Restaurant configuration management
Real-time analytics
Swagger API documentation
MongoDB Atlas integration
Production-ready architecture
✨ Features
👤 Customer
Register
Login
Logout
JWT Authentication
View Profile
Create Reservation
View Reservations
Update Reservation
Cancel Reservation
Reservation History
👨‍💼 Administrator
Dashboard
Total Reservations
Today's Reservations
Available Tables
Occupied Tables
Occupancy Rate
Estimated Revenue
Peak Booking Hours
Cancellation Rate
Average Guests
Repeat Customers
Reservation Management
View All Reservations
Search Reservations
Filter Reservations
Update Reservation
Cancel Reservation
Change Reservation Status

Status Flow

Pending
Confirmed
Checked In
Completed
Cancelled
No Show
Table Management
Add Table
Edit Table
Delete Table
Maintenance Mode
Available Mode
Capacity Management
Restaurant Configuration
Opening Hours
Closing Hours
Reservation Duration
Buffer Time
Maximum Guests
Advance Booking Window
Cancellation Window
Average Spend Per Guest
Currency Selection
Holiday Management
Weekend Restrictions
Enable Table Joining
Maximum Tables Per Reservation
Email Notification Settings
Booking Reminder Settings
Reset to Factory Defaults
Analytics
Estimated Revenue
Peak Booking Hours
Occupancy Percentage
Cancellation Rate
Average Guests
Most Popular Tables
Repeat Customers
Booking Heatmap
🧠 Smart Reservation Engine

The reservation engine automatically:

Finds the best-fit table
Minimizes wasted seating capacity
Prevents overlapping reservations
Prevents double bookings
Supports multi-table allocation
Respects maintenance tables
Validates operating hours
Respects holidays
Applies weekend restrictions
Enforces guest limits
Applies configurable reservation duration
Uses configurable buffer time
🔒 Security Features
JWT Authentication
Role-Based Access Control
HTTP Only Cookies
Helmet Security Headers
Rate Limiting
Input Validation
Express Validator
MongoDB Sanitization
XSS Protection
Secure Error Handling
Centralized Logging
🏗️ Tech Stack
Frontend
React
Vite
React Router
Axios
Context API
Lucide React
CSS3
Backend
Node.js
Express.js
JWT
Mongoose
Express Validator
Helmet
Winston
Morgan
Node Cron
Database
MongoDB Atlas
Documentation
Swagger/OpenAPI
📁 Project Structure
restaurant-system/

│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── contexts/
│   ├── hooks/
│   ├── styles/
│   └── utils/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── scripts/
│   │   ├── utils/
│   │   └── tests/
│   │
│   ├── package.json
│   └── .env.example
│
├── package.json
└── README.md
⚙️ Installation
Clone Repository
git clone https://github.com/boinasathvika05/table-reservation.git

cd table-reservation
Install Dependencies
npm run install-all
Environment Variables

Create

backend/.env

Add

PORT=5000

NODE_ENV=development

MONGO_URI=your_mongodb_atlas_connection_string

JWT_SECRET=your_super_secret_key
▶️ Running Locally

Development

npm run dev

Production

npm run build

npm start
🌐 API Documentation

Swagger Documentation

http://localhost:5000/api-docs

Health Check

http://localhost:5000/health
📚 REST APIs
Authentication
POST /api/auth/register

POST /api/auth/login

POST /api/auth/logout

GET /api/auth/me
Reservations
GET    /api/reservations

POST   /api/reservations

PUT    /api/reservations/:id

PUT    /api/reservations/:id/cancel
Tables
GET    /api/tables

POST   /api/tables

PUT    /api/tables/:id

DELETE /api/tables/:id
Settings
GET  /api/settings

PUT  /api/settings

POST /api/settings/reset
Dashboard
GET /api/dashboard/stats
🗄️ Database Collections
Users
Tables
Reservations
Settings
Audit Logs
🧪 Testing

Run Tests

npm test

The project includes:

Authentication Tests
Reservation Tests
Admin Tests
Reservation Engine Tests
Integration Tests
API Tests
🐳 Docker

Build

docker compose up --build
📈 Production Features
Production Ready Architecture
Repository Pattern
Service Layer
Clean Code
Modular Design
JWT Authentication
MongoDB Atlas
Swagger Documentation
Logging
Error Handling
Validation
Security Middleware
Responsive UI
Environment Configuration
Docker Support
Automated Testing
Background Cron Jobs
🔮 Future Enhancements
Email Notifications
SMS Notifications
Payment Gateway Integration
QR Code Check-in
Waitlist Management
AI-based Table Recommendations
Multi-Branch Restaurant Support
POS Integration
Customer Loyalty Program
Real-Time Notifications
Calendar Integration
👩‍💻 Author

Boina Sathvika

Computer Science Engineering Student

GitHub: https://github.com/boinasathvika05
LinkedIn: (Add your LinkedIn profile URL here)
📄 License

This project is developed for educational purposes and internship evaluation.

⭐ If you find this project useful, consider giving it a Star on GitHub!
