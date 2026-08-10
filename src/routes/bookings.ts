import { Router } from "express";

// Import booking controllers
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  adminCancelBooking,
} from "../controllers/bookings.ts";

// Authentication middleware
// Makes sure the user is logged in.
import { verifyJWT } from "../middlewares/verifyjwt.ts";

// Admin middleware
// Makes sure the logged-in user has role = "admin".
import { verifyAdmin } from "../middlewares/verifyAdmin.ts";

const router = Router();

// ======================================================
// USER ROUTES
// ======================================================

// Book an event
//
// POST /api/bookings/:eventId
//
// Example:
// POST /api/bookings/66abc123
//
// Only logged-in users can book.
router.post("/:eventId", verifyJWT, createBooking);

// Get all bookings belonging to the logged-in user
//
// GET /api/bookings/my
//
// Only logged-in users can access their bookings.
router.get("/my", verifyJWT, getMyBookings);

// Get a specific booking
//
// GET /api/bookings/:id
//
// The controller should make sure the booking
// belongs to the logged-in user.
router.get("/:id", verifyJWT, getBookingById);

// Cancel a booking
//
// PATCH /api/bookings/:id/cancel
//
// Only the user who owns the booking should be
// allowed to cancel it.
router.patch("/:id/cancel", verifyJWT, cancelBooking);

// ======================================================
// ADMIN ROUTES
// ======================================================

// Get all bookings
//
// GET /api/bookings
//
// Only admins can see all users' bookings.
router.get("/", verifyJWT, verifyAdmin, getAllBookings);

router.patch("/admin/:id/cancel", verifyJWT, verifyAdmin, adminCancelBooking);

export default router;
