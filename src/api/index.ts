import app from "../app.js";
import connectDB from "../db/index.js";

let dbConnected = false;

export default async function handler(req: any, res: any) {
  try {
    if (!dbConnected) {
      await connectDB();
      dbConnected = true;
    }

    return app(req, res);
  } catch (error) {
    console.error("API ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Internal server error",
    });
  }
}