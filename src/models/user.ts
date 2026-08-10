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

// ======================================================
// PASSWORD HASHING
// ======================================================
//
// Signup already hashes the password before putting it
// into the temporary OTP document.
//
// Therefore, when the verified user is saved, we must
// NOT hash an already-hashed bcrypt password again.
//
// At the same time, when a password is changed manually,
// the new plain-text password WILL be hashed here.
//

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  // If password is already a bcrypt hash,
  // don't hash it again.
  if (
    this.password.startsWith("$2a$") ||
    this.password.startsWith("$2b$") ||
    this.password.startsWith("$2y$")
  ) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// ======================================================
// ACCESS TOKEN
// ======================================================

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

// ======================================================
// REFRESH TOKEN
// ======================================================

userSchema.methods.generateRefreshToken = function (): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRY;

  if (!secret) {
    throw new Error("REFRESH_TOKEN_SECRET is missing");
  }

  if (!expiresIn) {
    throw new Error("REFRESH_TOKEN_EXPIRY is missing");
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