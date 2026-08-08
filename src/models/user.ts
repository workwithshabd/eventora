import { Schema, model, Document } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  refreshToken?: string;

  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 8,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.generateAccessToken = function (): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRY;
  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET is missing");
  }

  if (!expiresIn) {
    throw new Error("ACCESS_TOKEN_EXPIRY is missing");
  }

  return jwt.sign(
    {
      _id: this._id.toString(),

      email: this.email,

      role: this.role,
    },

    secret,

    {
        expiresIn: expiresIn as StringValue,
    },
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRY;

  if (!secret) {
    throw new Error("REFRESH_TOKEN_SECRET is missing");
  }
  if (!expiresIn) {
    throw new Error("ACCESS_TOKEN_EXPIRY is missing");
  }

  return jwt.sign(
    {
      _id: this._id.toString(),
    },

    secret,

    {
        expiresIn: expiresIn as StringValue,
    },
  );
};

const user = model<IUser>("User", userSchema);
export default user;
