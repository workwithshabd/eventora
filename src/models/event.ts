// models/event.ts

import {
  Schema,
  model,
  Document,
  Types,
} from "mongoose";

export interface IEvent extends Document {
  // Event title
  title: string;

  // Event description
  description: string;

  // Event date
  date: Date;

  // Event location
  location: string;

  // Ticket price
  price: number;

  // Number of available seats
  availableSeats: number;

  // ID of the admin who created the event
  createdBy: Types.ObjectId;

  // Automatically created timestamps
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    // Event title
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Event description
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Event date and time
    date: {
      type: Date,
      required: true,
    },

    // Event location
    location: {
      type: String,
      required: true,
      trim: true,
    },

    // Ticket price
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Number of seats available
    availableSeats: {
      type: Number,
      required: true,
      min: 0,
    },

    // Admin who created the event
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Create Event model
const Event = model<IEvent>("Event", eventSchema);

export default Event;