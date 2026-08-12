import { Router } from "express";

import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  adminCancelBooking,
} from "../controllers/bookings.js";

import { verifyJWT } from "../middlewares/verifyjwt.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.js";

const router = Router();

// ======================================================
// USER ROUTES
// ======================================================

// ------------------------------------------------------
// Book event
//
// POST /api/bookings/:eventId
//
// Body:
// {
//   quantity: 1
// }
// ------------------------------------------------------

router.post(
  "/:eventId",
  verifyJWT,
  createBooking,
);


// ------------------------------------------------------
// Get my bookings
//
// GET /api/bookings/my
// ------------------------------------------------------

router.get(
  "/my",
  verifyJWT,
  getMyBookings,
);


// ------------------------------------------------------
// Get one booking
//
// GET /api/bookings/:id
// ------------------------------------------------------

router.get(
  "/:id",
  verifyJWT,
  getBookingById,
);


// ------------------------------------------------------
// Cancel own booking
//
// PATCH /api/bookings/:id/cancel
// ------------------------------------------------------

router.patch(
  "/:id/cancel",
  verifyJWT,
  cancelBooking,
);


// ======================================================
// ADMIN ROUTES
// ======================================================

// ------------------------------------------------------
// Get all bookings
//
// GET /api/bookings
// ------------------------------------------------------

router.get(
  "/",
  verifyJWT,
  verifyAdmin,
  getAllBookings,
);


// ------------------------------------------------------
// Admin cancel booking
//
// PATCH /api/bookings/admin/:id/cancel
// ------------------------------------------------------

router.patch(
  "/admin/:id/cancel",
  verifyJWT,
  verifyAdmin,
  adminCancelBooking,
);

export default router;