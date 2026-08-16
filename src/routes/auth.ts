import { Router } from "express";
import {  verifyOtp , changePassword, getCurrentUser, logIn, logOut, signUp } from "../controllers/auth.js";
import { verifyJWT } from "../middlewares/verifyjwt.js";
import { makeAdmin } from "../controllers/makeadmin.js";
import{makeUser } from "../controllers/makeuser.js"
import { verifyAdmin } from "../middlewares/verifyAdmin.js";

const router = Router();

// Public routes
router.post("/signup", signUp);
router.post("/login", logIn);
router.post("/verify-otp", verifyOtp);

// Protected routes
router.post("/logout", verifyJWT, logOut);
router.post("/change-password", verifyJWT, changePassword);
router.get("/me", verifyJWT, getCurrentUser);
//router.get("/update-account-details", verifyJWT, updateAccountDetails);

// Role routes (Protected)
router.patch("/users/:userId/make-admin", verifyJWT, verifyAdmin, makeAdmin);
router.patch("/users/:userId/make-user", verifyJWT, verifyAdmin, makeUser);
// Future routes
// 

export default router;


















