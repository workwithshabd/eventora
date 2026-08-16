import type { Request, Response } from "express";
import { sendAccountEmail } from "../utils/mail.ts";
import user from "../models/user.js";
import bcrypt from "bcrypt";
import Otp from "../models/otp.ts";


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production"
      ? ("none" as const)
      : ("strict" as const),
};
export const signUp = async (req: Request, res: Response) => {
  try {
    console.log("========== SIGNUP START ==========");

    console.log("Request body:", req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.log("Missing signup fields");

      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    console.log("Checking existing user...");

    const existingUser = await user.findOne({ email });

    console.log("Existing user:", existingUser ? "YES" : "NO");

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    console.log("Hashing password...");

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Password hashed");

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const otpExpiresAt = new Date(
      Date.now() + 3 * 60 * 1000
    );

    console.log("Deleting previous OTP...");

    await Otp.deleteMany({ email });

    console.log("Creating OTP...");

    await Otp.create({
  name,
  email,
  password: hashedPassword,
  otp,
  otpExpiresAt,
  action: "account-verification",
});

    console.log("OTP created successfully");

    console.log("Sending email...");

    await sendAccountEmail(
      email,
      otp,
      "email verification",
      "Please enter this OTP to complete your registration."
    );

    console.log("Email sent successfully");

    console.log("========== SIGNUP SUCCESS ==========");

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email. Please verify your email.",
    });

  } catch (error) {
    console.error("========== SIGNUP ERROR ==========");

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Internal server error",
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    // -----------------------------------------
    // Validate request
    // -----------------------------------------

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // -----------------------------------------
    // Find pending OTP
    // -----------------------------------------

    const pendingUser = await Otp.findOne({
      email,
      action: "account-verification",
    });

    if (!pendingUser) {
      return res.status(404).json({
        success: false,
        message: "OTP not found or signup session expired",
      });
    }

    // -----------------------------------------
    // Check OTP expiration
    // -----------------------------------------

    if (pendingUser.otpExpiresAt < new Date()) {
      await Otp.deleteOne({
        _id: pendingUser._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // -----------------------------------------
    // Check OTP
    // -----------------------------------------

    if (pendingUser.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // -----------------------------------------
    // OTP IS VALID
    // -----------------------------------------
    //
    // IMPORTANT:
    // Do NOT use user.create() yet.
    //
    // We first create the Mongoose document in memory.
    // This means the user is NOT saved to MongoDB yet.
    //

    const newUser = new user({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,

      // IMPORTANT:
      // User is verified because the OTP was correct.
      isVerified: true,
    });

    // -----------------------------------------
    // Generate tokens BEFORE saving user
    // -----------------------------------------
    //
    // If ACCESS_TOKEN_SECRET or
    // REFRESH_TOKEN_SECRET is missing,
    // this will throw an error.
    //
    // Since the user hasn't been saved yet,
    // no unverified user will remain in MongoDB.
    //

    const accessToken = newUser.generateAccessToken();

    const refreshToken = newUser.generateRefreshToken();

    // Store refresh token in the user document
    newUser.refreshToken = refreshToken;

    // -----------------------------------------
    // NOW save the verified user
    // -----------------------------------------

    await newUser.save();

    // -----------------------------------------
    // Delete OTP only after user was successfully
    // created and authenticated.
    // -----------------------------------------

    await Otp.deleteOne({
      _id: pendingUser._id,
    });

    // -----------------------------------------
    // Return successful response
    // -----------------------------------------

    return res
      .status(201)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        success: true,
        message: "Email verified and account created successfully",
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isVerified: newUser.isVerified,
        },
      });

  } catch (error) {
    console.error("OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Internal server error",
    });
  }
};




export const logIn = async (req: Request, res: Response) => {
  console.log("========== LOGIN START ==========");

  try {
    const { email, password } = req.body;

    console.log("Login email:", email);

    // -----------------------------------------
    // Validate fields
    // -----------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // -----------------------------------------
    // Find user
    // -----------------------------------------

    const existingUser = await user
      .findOne({ email })
      .select("+password");

    console.log(
      "User found:",
      existingUser ? "YES" : "NO"
    );

    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "Email or password is wrong",
      });
    }

    // -----------------------------------------
    // Check email verification
    // -----------------------------------------

    if (!existingUser.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    // -----------------------------------------
    // Check password
    // -----------------------------------------

    console.log(
      "Stored password exists:",
      existingUser.password ? "YES" : "NO"
    );

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );

    console.log(
      "Password correct:",
      isPasswordCorrect
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Email or password is wrong",
      });
    }

    // -----------------------------------------
    // Generate tokens
    // -----------------------------------------

    const accessToken =
      existingUser.generateAccessToken();

    const refreshToken =
      existingUser.generateRefreshToken();

    // -----------------------------------------
    // Save refresh token
    // -----------------------------------------

    existingUser.refreshToken = refreshToken;

    await existingUser.save({
      validateBeforeSave: false,
    });

    // -----------------------------------------
    // Successful login
    // -----------------------------------------

    console.log("========== LOGIN SUCCESS ==========");

    return res
      .status(200)
      .cookie(
        "accessToken",
        accessToken,
        cookieOptions
      )
      .cookie(
        "refreshToken",
        refreshToken,
        cookieOptions
      )
      .json({
        success: true,
        message: "User logged in successfully",

        user: {
          _id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          isVerified: existingUser.isVerified,
        },
      });

  } catch (error) {
    console.error("========== LOGIN ERROR ==========");
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Internal server error",
    });
  }
};

export const logOut = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;

    await user.findByIdAndUpdate(
      userId,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      },
    );

    return res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json({
        success: true,
        message: "loged out successfully",
      });
  } catch (error) {
    console.log("this message from auth api", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "An error occurred",
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Old password and new password are required",
    });
  }

  const existingUser = await user.findById(req.user!._id).select("+password");

  if (!existingUser) {
    return res.status(404).json({
      success: false,
      message: "User doesn't exist",
    });
  }

  const isPasswordCorrect = await bcrypt.compare(
    oldPassword,
    existingUser.password,
  );

  if (!isPasswordCorrect) {
    return res.status(401).json({
      success: false,
      message: "Old password is incorrect",
    });
  }

  existingUser.password = newPassword;

  await existingUser.save();

  return res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
) => {
  try {
    const currentUser = await user
      .findById(req.user!._id)
      .select("-password -refreshToken");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Current user fetched successfully",
      user: currentUser,
    });
  } catch (error) {
    console.error("Failed to fetch current user:", error);

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

