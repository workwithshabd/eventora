import type { Request, Response } from "express";
import { sendAccountEmail } from "../utils/mail.ts";
import user from "../models/user.js";
import bcrypt from "bcrypt";
import Otp from "../models/otp.ts";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

export const signUp = async (req: Request, res: Response) => {
  try {
    // Get signup information from the request body
    const { name, email, password } = req.body;

    // Check that all required fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check whether the user already exists
    const existingUser = await user.findOne({ email });

    // Stop signup if the account already exists
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // Generate a salt for password hashing
    const salt = await bcrypt.genSalt(10);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a random 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Set OTP expiration to 3 minutes from now
    const otpExpiresAt = new Date(
      Date.now() + 3 * 60 * 1000
    );

    // Remove any previous pending signup for this email
    await Otp.deleteMany({ email });

    // Store signup information temporarily
    await Otp.create({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiresAt,
    });

    // Send OTP to the user's email
    await sendAccountEmail(
      email,
      otp,
      "email verification",
      "Please enter this OTP to complete your registration."
    );

    // Don't create the user yet.
    // Don't generate access/refresh tokens yet.
    return res.status(200).json({
      success: true,
      message: "OTP sent to your email. Please verify your email.",
    });

  } catch (error) {
    // Log the actual server-side error
    console.error("Signup error:", error);

    // Send generic error to the client
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const verifyOtp = async (req: Request, res: Response) => {
  try {
    // Get email and OTP from the request body
    const { email, otp } = req.body;

    // Make sure both values were provided
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find the temporary signup information
    const pendingUser = await Otp.findOne({ email });

    // No pending signup found
    if (!pendingUser) {
      return res.status(404).json({
        success: false,
        message: "OTP not found or signup session expired",
      });
    }

    // Check whether the OTP has expired
    if (pendingUser.otpExpiresAt < new Date()) {
      // Delete expired signup information
      await Otp.deleteOne({ _id: pendingUser._id });

      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Compare the OTP entered by the user with the stored OTP
    if (pendingUser.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // OTP is correct.
    // NOW create the actual user.
    const newUser = await user.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
    });

    // Generate access token after successful verification
    const accessToken = newUser.generateAccessToken();

    // Generate refresh token after successful verification
    const refreshToken = newUser.generateRefreshToken();

    // Save refresh token in the user document
    newUser.refreshToken = refreshToken;

    // Save the user
    await newUser.save({
      validateBeforeSave: false,
    });

    // Delete the temporary OTP/signup data
    await otp.deleteOne({
      _id: pendingUser._id,
    });

    // Return successful response and authenticate the user
    return res
      .status(201)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        success: true,
        message: "Email verified and account created successfully",
        user: newUser,
      });

  } catch (error) {
    // Log server-side error
    console.error("OTP verification error:", error);

    // Return generic error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logIn = async (req: Request, res: Response) => {
  console.log("login controller reached");
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "all fields are required",
      });
    }

    const existingUser = await user.findOne({ email }).select("+password");

    if (!existingUser) {
      return res.status(409).json({
        success: false,
        message: "user does not exist",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password,
    );
    if (!isPasswordCorrect) {
      return res.status(409).json({
        success: false,
        message: "email or password is wrong",
      });
    }

    const accessToken = existingUser.generateAccessToken();
    const refreshToken = existingUser.generateRefreshToken();

    existingUser.refreshToken = refreshToken;
    await existingUser.save({
      validateBeforeSave: false,
    });

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        success: true,
        message: "User logIn successfully",
        user: {
          _id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
      });
  } catch (error) {
    console.log("this message from auth api", error);
    return res.status(500).json({
      success: false,
      message: "internal server error",
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

export const getCurrentUser = async ( req: Request,res: Response,) => {
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

