# TutorHunt Backend 🎯

This is the backend server for the TutorHunt web application, a platform designed to connect students with language tutors. The server is built with Node.js, Express.js, and MongoDB, and it handles all API requests, data management, and user authentication.

## 🚀 Key Features

  * **RESTful API**: A well-structured API to manage tutors, users, and bookings.
  * **JWT Authentication**: Secure, token-based authentication for protecting private routes.
  * **Cookie Management**: Handles JWT tokens via secure HTTP-only cookies.
  * **Database Integration**: Connects to a MongoDB database to perform CRUD operations.
  * **Data Aggregation**: Uses MongoDB aggregation pipelines to calculate statistics such as total tutors, unique languages, and total reviews.
  * **Search and Pagination**: Implements search functionality for tutors by language and dynamic pagination to handle large datasets efficiently.
  * **CORS Configuration**: Securely handles cross-origin requests from the frontend.

\<br\>

## 🛠️ Technologies Used

  * **Node.js & Express.js**: The core runtime and web framework for the server.
  * **MongoDB**: The database.
  * **JWT**: For creating and verifying secure tokens.
  * **`cookie-parser`**: A middleware to parse cookies from incoming requests.
  * **`cors`**: For enabling Cross-Origin Resource Sharing.
  * **`@dotenvx/dotenvx`**: For securely managing environment variables.
  * **`express`, `cors`, `mongodb`**: Core npm packages.

\<br\>

## 📁 API Endpoints

### 🔒 Authentication Endpoints

  * `POST /jwt`: Generates a new JWT token and sets it as an HTTP-only cookie.
  * `GET /logout`: Clears the JWT cookie to log the user out.

### 📚 Tutor Endpoints

  * `GET /find-tutors`: Retrieves all tutors. Supports **search by `language`** and **pagination** using `page` and `limit` query parameters.
  * `POST /tutors`: **(Private)** Adds a new tutor to the database.
  * `GET /tutors/:id`: Retrieves a single tutor's details by their unique ID.
  * `PATCH /tutors/:id`: **(Private)** Updates a tutor's details by their unique ID.
  * `DELETE /tutors/:id`: **(Private)** Deletes a tutor by their unique ID.
  * `GET /find-tutors/:category`: Retrieves tutors filtered by a specific language category.
  * `PATCH /tutors/:id/review`: **(Private)** Increments the review count for a specific tutor after a booking.

### 📖 Booking Endpoints

  * `POST /booked-tutors`: **(Private)** Adds a new booked tutor entry.
  * `GET /booked-tutors`: **(Private)** Retrieves all booked tutors for the logged-in user.

### 📊 Statistics Endpoint

  * `GET /stats`: Returns key statistics from the database, including the total number of tutors, reviews, distinct languages, and users.

\<br\>

## ⚙️ Getting Started

### Prerequisites

  * Node.js
  * MongoDB Atlas account or a local MongoDB instance.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/programmerjewel/TutorHunt-backend.git
    cd tutorhunt-backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create `.env` file:**
    Create a `.env` file in the root directory and add your environment variables:
    ```
    DB_USER=your_db_username
    DB_PASS=your_db_password
    SECRET_KEY=your_jwt_secret_key
    PORT=4000
    NODE_ENV=development
    ```
4.  **Run the server:**
    ```bash
    npm start
    ```
    The server will start on the specified port (e.g., `http://localhost:4000`).

\<br\>

## 📝 Folder Structure

```
/
├── node_modules/
├── .env
├── package.json
├── index.js    # The main server file with all API routes and logic
└── ...
```