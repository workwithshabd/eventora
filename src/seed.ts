import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import User from "./models/user.js";
import Event from "./models/event.js";
import Booking from "./models/bookings.js";


// ======================================================
// LOAD ENVIRONMENT VARIABLES
// ======================================================

// Load values from .env
dotenv.config();


// ======================================================
// DATABASE CONNECTION
// ======================================================

// Get MongoDB URL from .env
const MONGO_URI = process.env.MONGO_DB_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined in .env");
}


// ======================================================
// SEED FUNCTION
// ======================================================
const seed = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected");

    // rest of seed...

    
    // ==================================================
    // CLEAR EXISTING DATA
    // ==================================================

    // Delete existing bookings
    await Booking.deleteMany({});

    // Delete existing events
    await Event.deleteMany({});

    // Delete existing users
    await User.deleteMany({});

    console.log("Existing data cleared");


    // ==================================================
    // CREATE PASSWORDS
    // ==================================================

    // Hash admin password
    const adminPassword = await bcrypt.hash(
      "Admin@123",
      10,
    );

    // Hash normal user password
    const userPassword = await bcrypt.hash(
      "User@123",
      10,
    );


    // ==================================================
    // CREATE ADMIN
    // ==================================================

    const admin = await User.create({
      name: "Admin",
      email: "admin@eventora.com",
      password: adminPassword,

      // Admin role
      role: "admin",

      // Seeded users are already verified
      isVerified: true,
    });

    console.log("Admin created");


    // ==================================================
    // CREATE NORMAL USERS
    // ==================================================

    const user1 = await User.create({
      name: "Rahul",
      email: "rahul@eventora.com",
      password: userPassword,

      // Normal user
      role: "user",

      // Already verified for testing
      isVerified: true,
    });

    const user2 = await User.create({
      name: "Priya",
      email: "priya@eventora.com",
      password: userPassword,

      // Normal user
      role: "user",

      // Already verified for testing
      isVerified: true,
    });

    console.log("Users created");


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

      // Initially 100 seats
      availableSeats: 100,

      // Event created by admin
      createdBy: admin._id,
    });


    const event2 = await Event.create({
      title: "Tech Conference 2026",
      description:
        "A conference covering modern web development and AI.",
      date: new Date("2026-10-10T10:00:00"),
      location: "JECC Jaipur",
      price: 1000,

      // Initially 200 seats
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

      // Initially 30 seats
      availableSeats: 30,

      createdBy: admin._id,
    });

    console.log("Events created");


    // ==================================================
    // CREATE BOOKINGS
    // ==================================================

    // Rahul books 2 tickets for Music Concert
    const booking1 = await Booking.create({
      user: user1._id,
      event: event1._id,

      quantity: 2,

      // Take price from event
      ticketPrice: event1.price,

      // 2 × 500
      totalPrice: event1.price * 2,

      status: "confirmed",
    });


    // Priya books 3 tickets for Music Concert
    const booking2 = await Booking.create({
      user: user2._id,
      event: event1._id,

      quantity: 3,

      // Take price from event
      ticketPrice: event1.price,

      // 3 × 500
      totalPrice: event1.price * 3,

      status: "confirmed",
    });


    // Rahul books 1 ticket for Tech Conference
    const booking3 = await Booking.create({
      user: user1._id,
      event: event2._id,

      quantity: 1,

      // Take price from event
      ticketPrice: event2.price,

      // 1 × 1000
      totalPrice: event2.price,

      status: "confirmed",
    });

    console.log("Bookings created");


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


    // Photography Workshop has no bookings,
    // so it remains at 30 seats.


    // ==================================================
    // SUCCESS
    // ==================================================

    console.log("Seed completed successfully");

    console.log("\nSeed accounts:");

    console.log(
      "Admin: admin@eventora.com / Admin@123",
    );

    console.log(
      "User 1: rahul@eventora.com / User@123",
    );

    console.log(
      "User 2: priya@eventora.com / User@123",
    );


    // Close database connection
    await mongoose.connection.close();

    console.log("MongoDB connection closed");

  } catch (error) {
    // Log seed error
    console.error("Seed failed:", error);

    // Close database connection
    await mongoose.connection.close();

    // Exit with failure status
    process.exit(1);
  }
};


// ======================================================
// RUN SEED
// ======================================================

seed();