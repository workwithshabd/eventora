import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "./models/user.js";
import Event from "./models/event.js";
import Booking from "./models/bookings.js";

// ======================================================
// LOAD ENVIRONMENT VARIABLES
// ======================================================

dotenv.config();

const MONGO_URI = process.env.MONGO_DB_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_DB_URI is not defined in .env");
}

// ======================================================
// SEED FUNCTION
// ======================================================

const seed = async () => {
  try {
    console.log("========================================");
    console.log("Starting Eventora database seed...");
    console.log("========================================");

    // ==================================================
    // CONNECT TO MONGODB
    // ==================================================

    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected successfully.");

    // ==================================================
    // CLEAR EXISTING DATA
    // ==================================================

    console.log("Clearing existing data...");

    await Booking.deleteMany({});
    await Event.deleteMany({});
    await User.deleteMany({});

    console.log("Existing data cleared.");

    // ==================================================
    // CREATE ADMIN
    // ==================================================
    //
    // IMPORTANT:
    // Do NOT bcrypt the password here.
    //
    // Your User model already has:
    //
    // userSchema.pre("save", async function () {
    //   this.password = await bcrypt.hash(this.password, 10);
    // });
    //
    // Therefore User.create() will hash this password once.
    // ==================================================

    const admin = await User.create({
      name: "Admin",
      email: "admin@eventora.com",
      password: "Admin@123",
      role: "admin",
      isVerified: true,
    });

    console.log("Admin created.");

    // ==================================================
    // CREATE NORMAL USERS
    // ==================================================

    const user1 = await User.create({
      name: "Rahul",
      email: "rahul@eventora.com",
      password: "User@123",
      role: "user",
      isVerified: true,
    });

    const user2 = await User.create({
      name: "Priya",
      email: "priya@eventora.com",
      password: "User@123",
      role: "user",
      isVerified: true,
    });

    console.log("Normal users created.");

    // ==================================================
    // CREATE EVENTS
    // ==================================================

    const event1 = await Event.create({
      title: "Music Concert",
      description:
        "Live music concert featuring local artists.",
      date: new Date("2026-09-15T18:00:00"),
      location: "Jaipur Exhibition Centre",
      price: 500,
      availableSeats: 100,
      createdBy: admin._id,
    });

    const event2 = await Event.create({
      title: "Tech Conference 2026",
      description:
        "A conference covering modern web development and AI.",
      date: new Date("2026-10-10T10:00:00"),
      location: "JECC Jaipur",
      price: 1000,
      availableSeats: 200,
      createdBy: admin._id,
    });

    const event3 = await Event.create({
      title: "Photography Workshop",
      description:
        "Hands-on photography workshop for beginners.",
      date: new Date("2026-11-05T11:00:00"),
      location: "City Palace Jaipur",
      price: 750,
      availableSeats: 30,
      createdBy: admin._id,
    });

    console.log("Events created.");

    // ==================================================
    // CREATE BOOKINGS
    // ==================================================

    // Rahul books 2 tickets for Music Concert

    await Booking.create({
      user: user1._id,
      event: event1._id,
      quantity: 2,
      ticketPrice: event1.price,
      totalPrice: event1.price * 2,
      status: "confirmed",
    });

    // Priya books 3 tickets for Music Concert

    await Booking.create({
      user: user2._id,
      event: event1._id,
      quantity: 3,
      ticketPrice: event1.price,
      totalPrice: event1.price * 3,
      status: "confirmed",
    });

    // Rahul books 1 ticket for Tech Conference

    await Booking.create({
      user: user1._id,
      event: event2._id,
      quantity: 1,
      ticketPrice: event2.price,
      totalPrice: event2.price,
      status: "confirmed",
    });

    console.log("Bookings created.");

    // ==================================================
    // UPDATE AVAILABLE SEATS
    // ==================================================

    // Music Concert:
    //
    // 100 seats
    // - 2 Rahul
    // - 3 Priya
    // = 95 remaining

    event1.availableSeats -= 5;

    await event1.save();

    // Tech Conference:
    //
    // 200 seats
    // - 1 Rahul
    // = 199 remaining

    event2.availableSeats -= 1;

    await event2.save();

    // Photography Workshop:
    //
    // No bookings
    // = 30 remaining

    console.log("Available seats updated.");

    // ==================================================
    // SUCCESS
    // ==================================================

    console.log("");
    console.log("========================================");
    console.log("SEED COMPLETED SUCCESSFULLY");
    console.log("========================================");

    console.log("");
    console.log("Seed accounts:");
    console.log("");

    console.log(
      "Admin: admin@eventora.com / Admin@123",
    );

    console.log(
      "User 1: rahul@eventora.com / User@123",
    );

    console.log(
      "User 2: priya@eventora.com / User@123",
    );

    console.log("");
    console.log("Events created: 3");
    console.log("Bookings created: 3");
    console.log("");

    // ==================================================
    // CLOSE DATABASE
    // ==================================================

    await mongoose.connection.close();

    console.log("MongoDB connection closed.");
    console.log("Seed process finished.");
  } catch (error) {
    // ==================================================
    // HANDLE ERROR
    // ==================================================

    console.error("");
    console.error("========================================");
    console.error("SEED FAILED");
    console.error("========================================");

    console.error(error);

    console.error("");

    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");
    } catch (closeError) {
      console.error(
        "Failed to close MongoDB connection:",
        closeError,
      );
    }

    process.exit(1);
  }
};

// ======================================================
// RUN SEED
// ======================================================

seed();