# Eventora — Event Booking Platform

Eventora is a full-stack event booking application built with the MERN stack.

Users can browse events, create accounts, book tickets, view their bookings, cancel bookings, and receive booking confirmation emails.

Admins have access to a dedicated admin dashboard where they can create and delete events, view bookings, and manage booking requests.

---

## Features

### User Features

- User registration with email OTP verification
- Secure login and logout
- JWT-based authentication using HTTP-only cookies
- Browse available events
- View detailed event information
- Select ticket quantity
- Book event tickets
- Receive booking confirmation email
- View personal bookings
- Cancel bookings
- View user profile
- Change password

### Admin Features

- Dedicated admin dashboard
- Admin-only access control
- View all events
- Create new events
- Delete events
- View all bookings
- View booking and user information
- Approve bookings
- Cancel bookings
- Monitor available seats
- View total revenue
- View paid clients
- View pending booking requests

---

## Tech Stack

### Frontend

- React
- TypeScript
- React Router
- Axios
- Tailwind CSS
- React Icons

### Backend

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JWT
- bcrypt
- Nodemailer

---

## Authentication

Eventora uses JWT authentication with HTTP-only cookies.

The authentication flow is:

```text
User Login
    ↓
Backend verifies email/password
    ↓
Backend generates Access Token
    ↓
Backend generates Refresh Token
    ↓
Tokens are stored in HTTP-only cookies
    ↓
React sends authenticated requests
    ↓
Backend verifies JWT
    ↓
User is authenticated
```

The user's role is also included in the access token.

Example:

```json
{
  "_id": "user_id",
  "email": "user@example.com",
  "role": "user"
}
```

or:

```json
{
  "_id": "admin_id",
  "email": "admin@example.com",
  "role": "admin"
}
```

---

## Project Structure

```text
Eventora/
│
├── client/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   └── ...
│   │   │
│   │   ├── context/
│   │   │   └── authcontext.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── EventDetail.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── ...
│   │   │
│   │   ├── utils/
│   │   │   └── axios.ts
│   │   │
│   │   └── App.tsx
│   │
│   └── package.json
│
├── server/
│   │
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.ts
│   │   │   ├── bookings.ts
│   │   │   └── events.ts
│   │   │
│   │   ├── models/
│   │   │   ├── user.ts
│   │   │   ├── event.ts
│   │   │   ├── bookings.ts
│   │   │   └── otp.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── events.ts
│   │   │   └── bookings.ts
│   │   │
│   │   ├── middlewares/
│   │   │   ├── verifyjwt.ts
│   │   │   └── verifyAdmin.ts
│   │   │
│   │   ├── utils/
│   │   │   └── mail.ts
│   │   │
│   │   ├── db/
│   │   │   └── index.ts
│   │   │
│   │   ├── seed.ts
│   │   └── index.ts
│   │
│   └── package.json
│
└── README.md
```

---

# How Event IDs Work

Each event receives a unique `_id` from MongoDB when it is created.

For example:

```json
{
  "_id": "68a123456789abcdef123456",
  "title": "Music Festival",
  "location": "Delhi"
}
```

React receives this event from the backend.

When displaying the events, React can create a link using the event's `_id`:

```tsx
<Link to={`/events/${event._id}`}>
  View Event
</Link>
```

For example, if:

```text
event._id = 68a123456789abcdef123456
```

the URL becomes:

```text
/events/68a123456789abcdef123456
```

React Router can define the route as:

```tsx
<Route
  path="/events/:id"
  element={<EventDetail />}
/>
```

The `:id` does not generate an ID.

It is simply a route parameter that receives whatever value appears in that position.

Inside `EventDetail`:

```tsx
const { id } = useParams();
```

If the URL is:

```text
/events/68a123456789abcdef123456
```

then:

```text
id = "68a123456789abcdef123456"
```

The frontend can then request:

```tsx
api.get(`/events/${id}`);
```

The backend receives the value through:

```ts
req.params.id
```

and can find the event:

```ts
const event = await Event.findById(req.params.id);
```

The complete flow is:

```text
MongoDB creates _id
       ↓
Backend sends event to React
       ↓
React receives event._id
       ↓
React creates /events/:id
       ↓
User opens the URL
       ↓
useParams() gets the ID
       ↓
React requests /api/events/:id
       ↓
Express receives req.params.id
       ↓
Event.findById(req.params.id)
       ↓
MongoDB returns the event
       ↓
Backend sends event data to React
       ↓
React displays the event
```

---

# Booking Flow

Users do not need OTP verification when booking an event.

OTP is only used during account registration and email verification.

The booking process is:

```text
User opens an event
       ↓
User selects ticket quantity
       ↓
React sends event ID + quantity
       ↓
Backend verifies JWT
       ↓
Backend finds the event
       ↓
Backend validates ticket quantity
       ↓
Backend checks available seats
       ↓
Backend gets ticket price from database
       ↓
Backend calculates total price
       ↓
Booking is created
       ↓
Available seats are reduced
       ↓
Booking confirmation email is sent
       ↓
Backend sends success response
       ↓
React displays booking success
```

The frontend sends the booking request:

```tsx
await api.post(`/bookings/${event._id}`, {
  quantity,
});
```

The backend receives:

```ts
req.params.eventId
```

and:

```ts
req.body.quantity
```

The backend does not trust the ticket price sent by React.

Instead, it gets the price directly from the database:

```ts
const ticketPrice = event.price;
const totalPrice = ticketPrice * quantity;
```

This prevents users from manipulating the price from the frontend.

---

# Booking Cancellation

Users can cancel their own bookings.

The frontend sends a request such as:

```text
PATCH /api/bookings/:id/cancel
```

The backend checks:

1. The user is authenticated.
2. The booking exists.
3. The booking belongs to the logged-in user.
4. The booking is not already cancelled.
5. The event still exists.

Then the seats are returned:

```ts
event.availableSeats += booking.quantity;
```

The booking is then marked as cancelled:

```ts
booking.status = "cancelled";
```

The flow is:

```text
User clicks Cancel Booking
       ↓
React sends booking ID
       ↓
Backend verifies JWT
       ↓
Backend finds user's booking
       ↓
Backend returns seats to event
       ↓
Booking status becomes cancelled
       ↓
Backend sends response
       ↓
React updates the UI
```

---

# Email Verification

During registration, the user receives an OTP through email.

The registration flow is:

```text
User enters name/email/password
       ↓
React sends registration request
       ↓
Backend validates the data
       ↓
Password is hashed
       ↓
OTP is generated
       ↓
OTP is temporarily stored
       ↓
OTP is sent by email
       ↓
User enters OTP
       ↓
Backend verifies OTP
       ↓
User account is created
       ↓
User is marked as verified
       ↓
JWT tokens are generated
       ↓
User is logged in
```

OTP is only used for account verification.

Booking does not require OTP.

After a successful booking, Eventora sends a booking confirmation email directly.

---

# Admin Authorization

Authentication and authorization are two different things.

### Authentication

`verifyJWT` checks:

```text
"Is the user logged in?"
```

### Authorization

`verifyAdmin` checks:

```text
"Is the logged-in user an administrator?"
```

For example:

```ts
router.get(
  "/",
  verifyJWT,
  verifyAdmin,
  getAllBookings
);
```

The request must pass both middleware functions before the controller is executed.

```text
Request
   ↓
verifyJWT
   ↓
Is user logged in?
   ↓
verifyAdmin
   ↓
Is user an admin?
   ↓
getAllBookings
```

The user's role is stored in MongoDB:

```json
{
  "role": "admin"
}
```

The role is also included in the access token.

---

# User Dashboard vs Admin Dashboard

When a user logs in, the backend returns the user information:

```json
{
  "success": true,
  "user": {
    "_id": "123",
    "name": "John",
    "email": "john@example.com",
    "role": "user"
  }
}
```

For an admin:

```json
{
  "success": true,
  "user": {
    "_id": "456",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

React stores the logged-in user in the authentication context.

The navbar checks:

```tsx
user.role
```

and sends the user to the appropriate dashboard:

```tsx
user.role === "admin"
  ? "/admin"
  : "/dashboard"
```

This allows normal users and administrators to have different dashboards.

---

# Environment Variables

Create a `.env` file in the backend.

Example:

```env
PORT=8000

MONGODB_URI=your_mongodb_connection_string

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

CLIENT_URL=http://localhost:5173

NODE_ENV=development
```

Do not commit `.env` to Git.

Add the following to `.gitignore`:

```gitignore
.env
node_modules/
dist/
```

---

# Installation

Clone the repository:

```bash
git clone <your-repository-url>
```

Go to the backend:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Go to the frontend:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

---

# Running the Backend

From the backend directory:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:8000
```

---

# Running the Frontend

From the frontend directory:

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

---

# Database Seeding

The project includes a seed script that creates sample users, events, and bookings.

Run:

```bash
npm run seed
```

Example seed accounts:

```text
Admin:
admin@eventora.com
Admin@123

User:
rahul@eventora.com
User@123

User:
priya@eventora.com
User@123
```

These credentials are for development only.

Change them before using the application in production.

---

# API Endpoints

## Authentication

```text
POST /api/signup
POST /api/verify-otp
POST /api/login
POST /api/logout
GET  /api/me
```

## Events

```text
GET    /api/events
GET    /api/events/:id
POST   /api/events
DELETE /api/events/:id
```

## Bookings

```text
POST  /api/bookings/:eventId
GET   /api/bookings/my
GET   /api/bookings/:id
PATCH /api/bookings/:id/cancel
GET   /api/bookings
PATCH /api/bookings/admin/:id/cancel
```

Admin-only endpoints are protected with:

```text
verifyJWT → verifyAdmin
```

---

# Security

Eventora uses several security measures:

- Passwords are hashed using bcrypt.
- JWTs are stored in HTTP-only cookies.
- Access tokens have an expiration time.
- Refresh tokens are stored in the database.
- Users cannot access another user's bookings.
- Admin routes require administrator authorization.
- Event prices are taken from the database.
- Booking quantity is validated on the backend.
- Available seats are checked before creating a booking.
- Passwords are excluded from normal user responses.
- Refresh tokens are excluded from normal user responses.
- Email verification is required before login.

---

# Frontend and Backend Architecture

The application follows a typical frontend/backend architecture:

```text
                React Frontend
                      │
                      │ Axios HTTP Request
                      ↓
                Express Backend
                      │
                      ↓
                   Middleware
                      │
                      ↓
                  Controller
                      │
                      ↓
                   Mongoose
                      │
                      ↓
                    MongoDB
                      │
                      ↓
                 JSON Response
                      │
                      ↓
                React Frontend
```

### React

React is responsible for:

- Displaying the user interface
- Handling user interaction
- Managing frontend state
- Sending API requests
- Displaying API responses

### Express

Express is responsible for:

- Receiving HTTP requests
- Routing requests
- Running middleware
- Authentication
- Authorization
- Calling controllers

### Controllers

Controllers contain the application's business logic.

For example, the booking controller:

- Finds the event
- Validates ticket quantity
- Checks available seats
- Calculates the price
- Creates the booking
- Updates available seats
- Sends the confirmation email

### Mongoose

Mongoose connects the backend application to MongoDB and provides models and schemas.

### MongoDB

MongoDB permanently stores:

- Users
- Events
- Bookings
- OTP records

---

# Request Example

When a user books an event, the process looks like this:

```text
React
  │
  │ POST /api/bookings/68a123...
  │ { quantity: 2 }
  ↓
Express
  │
  ↓
verifyJWT
  │
  ↓
createBooking()
  │
  ├── Find Event
  ├── Check Seats
  ├── Calculate Price
  ├── Create Booking
  ├── Reduce Available Seats
  └── Send Email
  │
  ↓
MongoDB
  │
  ↓
Booking Saved
  │
  ↓
JSON Response
  │
  ↓
React
  │
  ↓
"Event booked successfully"
```

---

# Future Improvements

Possible future improvements include:

- Online payment integration
- Event search
- Event filtering
- Pagination
- Event editing
- Admin analytics charts
- Booking history filters
- QR-code tickets
- Automated cancellation emails
- Transaction-safe seat reservation
- Image upload
- Cloud image storage
- Production deployment
- Better form validation
- Improved error handling

---

# License

This project is intended for educational, learning, and portfolio purposes.
