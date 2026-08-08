import { Router } from "express";

import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/event";

import { verifyJWT } from "../middlewares/verifyjwt.ts";
import { verifyAdmin } from "../middlewares/verifyAdmin.ts";

const eventsRouter = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Anyone can see all events
eventsRouter.get("/", getAllEvents);

// Anyone can see a specific event
eventsRouter.get("/:id", getEventById);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Only logged-in admins can create an event
eventsRouter.post("/", verifyJWT, verifyAdmin, createEvent);

// Only logged-in admins can update an event
eventsRouter.patch("/:id", verifyJWT, verifyAdmin, updateEvent);

// Only logged-in admins can delete an event
eventsRouter.delete("/:id", verifyJWT, verifyAdmin, deleteEvent);

export default eventsRouter;
