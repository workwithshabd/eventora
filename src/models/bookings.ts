import { Schema, model, Document, Types } from "mongoose";

export interface IBooking extends Document {
  user: Types.ObjectId;
  event: Types.ObjectId;
  quantity: number;
  ticketPrice: number;
  totalPrice: number;
  status: "confirmed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    ticketPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Booking = model<IBooking>("Booking", bookingSchema);

export default Booking;