import type { Request, Response } from "express";
import User from "../models/user.ts";

export const makeUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (targetUser.role === "user") {
      return res.status(400).json({
        success: false,
        message: "User is already a user",
      });
    }

    targetUser.role = "user";
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: "Admin demoted to user",
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
