import { Schema, model, Document } from "mongoose";

// Interface describing the temporary signup/OTP document
export interface IOtp extends Document {
  // User's name entered during signup
  name: string;

  // User's email entered during signup
  email: string;

  // Hashed password
  password: string;

  // OTP sent to the user's email
  otp: string;

  // Purpose of this OTP
  action: "account-verification" | "event-booking";

  // Time when the OTP expires
  otpExpiresAt: Date;

  // Document creation time
  createdAt: Date;

  // Document update time
  updatedAt: Date;
}

// Create the OTP schema
const otpSchema = new Schema<IOtp>(
  {
    // Store the user's name temporarily
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Store the user's email temporarily
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // Store the hashed password temporarily
    password: {
      type: String,
      required: true,
    },

    // Store the OTP
    otp: {
      type: String,
      required: true,
    },

    // Store what the OTP is being used for
    action: {
      type: String,
      enum: ["account-verification", "event-booking"],
      required: true,
    },

    // OTP will expire after 3 minutes
    otpExpiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    // Automatically creates createdAt and updatedAt
    timestamps: true,
  },
);

// Create the OTP Mongoose model
const Otp = model<IOtp>("OTP", otpSchema);

// Export the model
export default Otp;