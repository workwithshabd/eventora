import type { Request, Response } from "express";

import Booking from "../models/bookings.js";
import Event from "../models/event.js";

import { sendBookingEmail } from "../utils/mail.js";


// ======================================================
// CREATE BOOKING
// ======================================================
//
// POST /api/bookings/:eventId
//
// User must be logged in.
//
// Flow:
// 1. Check authentication
// 2. Get event
// 3. Validate ticket quantity
// 4. Check available seats
// 5. Calculate total price
// 6. Create booking
// 7. Reduce available seats
// 8. Send confirmation email
//

export const createBooking = async (
  req: Request,
  res: Response,
) => {
  try {
    // Make sure the user is authenticated.
    //
    // verifyJWT should have added req.user.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get event ID from URL.
    const { eventId } = req.params;

    // Get ticket quantity from request body.
    const { quantity } = req.body;

    // Check whether quantity was provided.
    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Ticket quantity is required",
      });
    }

    // Quantity must be a positive integer.
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    // Get the authenticated user's ID.
    //
    // We NEVER take the user ID from req.body.
    const userId = req.user._id;

    // Find the event.
    const event = await Event.findById(eventId);

    // Event doesn't exist.
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check whether enough seats are available.
    if (event.availableSeats < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${event.availableSeats} seats are available`,
      });
    }

    // Get the current event price.
    //
    // Never trust the price sent by the frontend.
    const ticketPrice = event.price;

    // Calculate total booking price.
    const totalPrice = ticketPrice * quantity;

    // Create the booking.
    const booking = await Booking.create({
      // Authenticated user
      user: userId,

      // Event being booked
      event: event._id,

      // Number of tickets
      quantity,

      // Price at time of booking
      ticketPrice,

      // Total amount
      totalPrice,

      // Booking status
      status: "confirmed",
    });

    // Reduce available seats.
    event.availableSeats -= quantity;

    // Save updated event.
    await event.save();

    // Send booking confirmation email.
    await sendBookingEmail(
      req.user.email,
      req.user.name,
      event.title,
      `You booked ${quantity} ticket(s).
Total amount: ₹${totalPrice}.`,
    );

    // Return successful response.
    return res.status(201).json({
      success: true,
      message: "Event booked successfully",
      booking,
    });

  } catch (error) {
    // Log actual error on server.
    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// ======================================================
// GET MY BOOKINGS
// ======================================================
//
// GET /api/bookings/my
//
// Returns bookings belonging only to the logged-in user.
//

export const getMyBookings = async (
  req: Request,
  res: Response,
) => {
  try {
    // Check authentication.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get logged-in user's ID.
    const userId = req.user._id;

    // Find bookings belonging to this user.
    const bookings = await Booking.find({
      user: userId,
    })
      // Replace event ObjectId with event information.
      .populate("event")
      // Newest bookings first.
      .sort({ createdAt: -1 });

    // Return bookings.
    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });

  } catch (error) {
    console.error("Get my bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// ======================================================
// GET SINGLE BOOKING
// ======================================================
//
// GET /api/bookings/:id
//
// A user can only see their own booking.
//

export const getBookingById = async (
  req: Request,
  res: Response,
) => {
  try {
    // Check authentication.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get booking ID from URL.
    const { id } = req.params;

    // Get logged-in user's ID.
    const userId = req.user._id;

    // Find booking belonging to this user.
    const booking = await Booking.findOne({
      _id: id,
      user: userId,
    }).populate("event");

    // Booking doesn't exist or belongs to another user.
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Return booking.
    return res.status(200).json({
      success: true,
      booking,
    });

  } catch (error) {
    console.error("Get booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// ======================================================
// CANCEL BOOKING
// ======================================================
//
// PATCH /api/bookings/:id/cancel
//
// Cancelling a booking returns the tickets to the event.
//

export const cancelBooking = async (
  req: Request,
  res: Response,
) => {
  try {
    // Check authentication.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get booking ID.
    const { id } = req.params;

    // Get logged-in user's ID.
    const userId = req.user._id;

    // Find the user's booking.
    const booking = await Booking.findOne({
      _id: id,
      user: userId,
    });

    // Booking doesn't exist.
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Prevent cancelling an already cancelled booking.
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    // Find the event.
    const event = await Event.findById(booking.event);

    // Event doesn't exist.
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Return tickets to available seats.
    event.availableSeats += booking.quantity;

    // Save event.
    await event.save();

    // Mark booking as cancelled.
    booking.status = "cancelled";

    // Save booking.
    await booking.save();

    // Return successful response.
    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });

  } catch (error) {
    console.error("Cancel booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// ======================================================
// GET ALL BOOKINGS
// ======================================================
//
// GET /api/bookings
//
// ADMIN ONLY.
//
// Your route should use:
// verifyJWT → isAdmin → getAllBookings
//

export const getAllBookings = async (
  req: Request,
  res: Response,
) => {
  try {
    // Find all bookings.
    const bookings = await Booking.find()
      // Include user name and email.
      .populate("user", "name email")

      // Include useful event information.
      .populate(
        "event",
        "title date location price",
      )

      // Newest bookings first.
      .sort({ createdAt: -1 });

    // Return bookings.
    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });

  } catch (error) {
    console.error("Get all bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const adminCancelBooking = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    const event = await Event.findById(booking.event);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Return the booked seats to the event.
    event.availableSeats += booking.quantity;

    await event.save();

    // Cancel the booking.
    booking.status = "cancelled";

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled by admin",
      booking,
    });

  } catch (error) {
    console.error("Admin cancel booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};