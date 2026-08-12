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
// Body:
// {
//   quantity: 1
// }
//
// User must be logged in.
//
// Flow:
// 1. Verify authentication
// 2. Get event
// 3. Get quantity
// 4. Check available seats
// 5. Calculate price
// 6. Create booking
// 7. Reduce available seats
// 8. Send booking confirmation email
//

export const createBooking = async (
  req: Request,
  res: Response,
) => {
  try {
    // --------------------------------------------------
    // 1. Check authentication
    // --------------------------------------------------

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // --------------------------------------------------
    // 2. Get event ID from URL
    // --------------------------------------------------

    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    // --------------------------------------------------
    // 3. Get quantity from request body
    // --------------------------------------------------

    const { quantity = 1 } = req.body ?? {};

    // We currently allow one or more tickets.
    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    // --------------------------------------------------
    // 4. Find event
    // --------------------------------------------------

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // --------------------------------------------------
    // 5. Check available seats
    // --------------------------------------------------

    if (event.availableSeats < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${event.availableSeats} seat(s) are available`,
      });
    }

    // --------------------------------------------------
    // 6. Calculate price
    // --------------------------------------------------

    // NEVER trust price from frontend.
    const ticketPrice = event.price;

    const totalPrice =
      ticketPrice * quantity;

    // --------------------------------------------------
    // 7. Create booking
    // --------------------------------------------------

    const booking = await Booking.create({
      user: req.user._id,
      event: event._id,
      quantity,
      ticketPrice,
      totalPrice,
      status: "confirmed",
    });

    // --------------------------------------------------
    // 8. Reduce available seats
    // --------------------------------------------------

    event.availableSeats -= quantity;

    await event.save();

    // --------------------------------------------------
    // 9. Send confirmation email
    // --------------------------------------------------

    try {
      await sendBookingEmail(
        req.user.email,
        req.user.name,
        event.title,
        `Your booking has been confirmed.

Event: ${event.title}
Tickets: ${quantity}
Ticket price: ₹${ticketPrice}
Total amount: ₹${totalPrice}

Thank you for booking with Eventora.`,
      );
    } catch (emailError) {
      // Email failure should NOT undo the booking.
      //
      // The booking has already been successfully
      // created, so only log the email problem.
      console.error(
        "Booking created, but confirmation email failed:",
        emailError,
      );
    }

    // --------------------------------------------------
    // 10. Send response
    // --------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Event booked successfully",
      booking,
    });

  } catch (error) {
    console.error(
      "Create booking error:",
      error,
    );

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

export const getMyBookings = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const bookings = await Booking.find({
      user: req.user._id,
    })
      .populate("event")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });

  } catch (error) {
    console.error(
      "Get my bookings error:",
      error,
    );

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

export const getBookingById = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    const booking = await Booking.findOne({
      _id: id,
      user: req.user._id,
    }).populate("event");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });

  } catch (error) {
    console.error(
      "Get booking error:",
      error,
    );

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

export const cancelBooking = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    const booking = await Booking.findOne({
      _id: id,
      user: req.user._id,
    });

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

    const event = await Event.findById(
      booking.event,
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Return tickets to event.
    event.availableSeats += booking.quantity;

    await event.save();

    // Cancel booking.
    booking.status = "cancelled";

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });

  } catch (error) {
    console.error(
      "Cancel booking error:",
      error,
    );

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
// ADMIN ONLY
//

export const getAllBookings = async (
  req: Request,
  res: Response,
) => {
  try {
    const bookings = await Booking.find()
      .populate(
        "user",
        "name email",
      )
      .populate(
        "event",
        "title date location price",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });

  } catch (error) {
    console.error(
      "Get all bookings error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// ======================================================
// ADMIN CANCEL BOOKING
// ======================================================
//
// PATCH /api/bookings/admin/:id/cancel
//

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

    const event = await Event.findById(
      booking.event,
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Return tickets.
    event.availableSeats += booking.quantity;

    await event.save();

    // Cancel booking.
    booking.status = "cancelled";

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled by admin",
      booking,
    });

  } catch (error) {
    console.error(
      "Admin cancel booking error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};