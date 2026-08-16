import { Request, Response } from "express";
import Event from "../models/event.js";

// ==========================================
// GET ALL EVENTS - PUBLIC
// ==========================================
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    // Find all events in the database
    const events = await Event.find()
      .sort({ date: 1 });

    // Return all events
    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    // Log the error on the server
    console.error("Get all events error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// ==========================================
// GET SINGLE EVENT - PUBLIC
// ==========================================
export const getEventById = async (req: Request, res: Response) => {
  try {
    // Get event ID from URL
    const { id } = req.params;

    // Find event using MongoDB ID
    const event = await Event.findById(id);

    // If event doesn't exist
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Return event
    return res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    // Log the error
    console.error("Get event error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// ==========================================
// CREATE EVENT - ADMIN ONLY
// ==========================================
export const createEvent = async (req: Request, res: Response) => {
  try {

      // Make sure the request is authenticated.

    // req.user is added by the verifyJWT middleware.

    if (!req.user) {

      return res.status(401).json({

        success: false,

        message: "Unauthorized",

      });

    }
    // Get event data from request body
    const {
      title,
      description,
      date,
      location,
      price,
      availableSeats,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !date ||
      !location ||
      price === undefined ||
      availableSeats === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Create event
    const event = await Event.create({
      title,
      description,
      date,
      location,
      price,
      availableSeats,

      // Admin who created the event
      createdBy: req.user._id,
    });

    // Return created event
    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    // Log error
    console.error("Create event error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// ==========================================
// UPDATE EVENT - ADMIN ONLY
// ==========================================
export const updateEvent = async (req: Request, res: Response) => {
  try {
    // Get event ID from URL
    const { id } = req.params;

    // Get updated information from request body
    const {
      title,
      description,
      date,
      location,
      price,
      availableSeats,
    } = req.body;

    // Find event and update it
    const event = await Event.findByIdAndUpdate(
      id,
      {
        title,
        description,
        date,
        location,
        price,
        availableSeats,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    // Event doesn't exist
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Return updated event
    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    // Log error
    console.error("Update event error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// ==========================================
// DELETE EVENT - ADMIN ONLY
// ==========================================
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    // Get event ID from URL
    const { id } = req.params;

    // Find and delete the event
    const event = await Event.findByIdAndDelete(id);

    // Event doesn't exist
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Return success
    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    // Log error
    console.error("Delete event error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};