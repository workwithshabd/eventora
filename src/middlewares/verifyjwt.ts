import type {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";
import User from "../models/user.js";

interface JwtPayload {
  _id: string;
}

export const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.accessToken;

    console.log("========== VERIFY JWT ==========");
    console.log("Access token exists:", !!token);

    if (!token) {
      console.log("NO ACCESS TOKEN COOKIE");

      return res.status(401).json({
        success: false,
        message: "Access token missing",
      });
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
      console.error("ACCESS_TOKEN_SECRET is missing");

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error",
      });
    }

    const decoded = jwt.verify(
      token,
      secret,
    ) as JwtPayload;

    console.log("JWT decoded:", decoded);

    if (!decoded._id) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    const currentUser = await User.findById(decoded._id)
      .select("-password -refreshToken");

    if (!currentUser) {
      console.log("User from token not found");

      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    console.log("Authenticated user:", currentUser.email);

    req.user = currentUser;

    next();
  } catch (error) {
    console.error("JWT verification failed:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
};