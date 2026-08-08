import type {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Define what we expect to find inside the JWT.
interface JwtPayload {
  _id: string;
}

export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get the access token from the browser cookie.
    const token = req.cookies?.accessToken;

    // If there is no token, the user is not authenticated.
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token missing",
      });
    }

    // Verify the JWT using the secret stored in .env.
    //
    // If the token is expired, invalid, or modified,
    // jwt.verify() will throw an error.
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!,
    ) as JwtPayload;

    // Find the user whose ID is stored inside the JWT.
    //
    // We don't return password or refreshToken because
    // they are not needed for authentication here.
    const currentUser = await User.findById(decoded._id)
      .select("-password -refreshToken");

    // The token may be valid but the user may have been
    // deleted from the database.
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    // Attach the authenticated user to the Express request.
    //
    // This is where req.user is created.
    req.user = currentUser;

    // Continue to the next middleware/controller.
    next();

  } catch (error) {
    // Handles expired, invalid, malformed, or otherwise
    // unusable JWTs.
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
};