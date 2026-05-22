# Flavora — Recipe Social Sharing Platform

Flavora is a full-stack, feature-rich social platform designed for home chefs and food enthusiasts to discover, create, share, and bookmark recipes. The project was built and deployed from scratch within a 24-hour hackathon window.

## 🚀 Features

- **User Authentication & Profiles**: Secure sign-up/login, bio updates, custom avatars, and a secure password reset flow powered by real-time email OTP verification.
- **Recipe Feed & Interactive Socials**: Discover recipes from fellow cooks, search by keyword, filter by diet types (Veg, Vegan, Gluten-Free, etc.), like, and comment on recipes.
- **Tastemakers**: Follow other creators to build a personalized recipe feed on your homepage.
- **Bookmarks/Saved Recipes**: Save your favorite recipes in one central library for offline/quick reference.
- **Admin Dashboard**: Comprehensive analytics panel showing registered users, total likes/comments, top recipe trends, and platform moderation.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (responsive grid & flexbox design, modern CSS variables), Modern ES6 JavaScript.
- **Backend**: Python, Flask, Flask-Mail (SMTP setup for OTPs), CORS, `mysql-connector-python` connection pool.
- **Database**: Relational MySQL schema capturing profiles, posts, metrics, and relationships.

---

## 📦 Getting Started

### 1. Database Setup
1. Open your MySQL client and run the SQL script under `database/schema.sql` to initialize tables:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
2. Run the DB setup utility to seed initial data:
   ```bash
   cd database
   python setup_db.py
   ```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install flask flask-cors mysql-connector-python flask-mail python-dotenv
   ```
3. Create a `.env` file in the `/backend` folder with the following configuration:
   ```env
   FLASK_SECRET=your_secret_key
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_password
   DB_NAME=flavora
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   MAIL_USERNAME=your.email@gmail.com
   MAIL_PASSWORD=your_app_password
   ```
4. Start the Flask application:
   ```bash
   python app.py
   ```
   The backend will run on `http://127.0.0.1:5000`.

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install development tools:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:8080/login.html` to run the application.

---
*Developed by Sameer Sangam – [GitHub Profile](https://github.com/samyy009)*
