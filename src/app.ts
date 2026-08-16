import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import router from "./routes/auth.js";
import eventsRouter from "./routes/events.js";
import bookingRoutes from "./routes/bookings.js";

const app = express();

const allowedOrigin =
  process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use((req, res, next) => {
  console.log("content-Type:", req.headers["content-type"]);
  console.log("Body:", req.body);
  next();
});

app.use("/api/bookings", bookingRoutes);
app.use("/api", router);
app.use("/api/events", eventsRouter);

app.get("/", (req, res) => {
  res.json({
    message: "Eventora API is running",
  });
});

export default app;