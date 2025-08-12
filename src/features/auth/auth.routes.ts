import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUser,
} from "./auth.controller";
import {
  authenticateToken,
  requireAdmin,
  requireLibrarian,
} from "../../middlewares/auth";
import {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateUserUpdate,
} from "./auth.validator";

const router = Router();

// Public routes
router.post("/auth/register", validateRegister, register);
router.post("/auth/login", validateLogin, login);

// Protected routes (require authentication)
router.get("/auth/profile", authenticateToken, getProfile);
router.put(
  "/auth/profile",
  authenticateToken,
  validateProfileUpdate,
  updateProfile
);
router.put(
  "/auth/change-password",
  authenticateToken,
  validatePasswordChange,
  changePassword
);

// Admin only routes
router.get("/auth/users", authenticateToken, requireAdmin, getAllUsers);
router.put(
  "/auth/users/:id",
  authenticateToken,
  requireAdmin,
  validateUserUpdate,
  updateUser
);

export default router;
