import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../../middlewares/auth";

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, role = "USER" } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({
        error: "Missing required fields",
        message: "Username, email, and password are required.",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        error: "Invalid password",
        message: "Password must be at least 6 characters long.",
      });
      return;
    }

    // check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      res.status(409).json({
        error: "User already exists",
        message: "A user with this email or username already exists.",
      });
      return;
    }

    // hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role.toUpperCase(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Registration failed",
      message: "An error occurred during user registration.",
    });
  }
};

// login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        error: "Missing credentials",
        message: "Username and password are required.",
      });
      return;
    }

    // find user (can login with username or email)
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: username }, { username }],
        isActive: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: "Invalid credentials",
        message: "Username or password is incorrect.",
      });
      return;
    }

    // check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        error: "Invalid credentials",
        message: "Username or password is incorrect.",
      });
      return;
    }

    // generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({
        error: "Server configuration error",
        message: "JWT secret is not configured.",
      });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Login failed",
      message: "An error occurred during login.",
    });
  }
};

// get current user profile
export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        message: "User must be authenticated to access profile.",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        error: "User not found",
        message: "User profile not found.",
      });
      return;
    }

    res.status(200).json({
      message: "Profile retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Profile retrieval error:", error);
    res.status(500).json({
      error: "Profile retrieval failed",
      message: "An error occurred while retrieving user profile.",
    });
  }
};

// update user profile
export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        message: "User must be authenticated to update profile.",
      });
      return;
    }

    const { username, email } = req.body;
    const updateData: any = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        error: "No data to update",
        message: "Please provide username or email to update.",
      });
      return;
    }

    // check if new username/email already exists
    if (username || email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: req.user.id } },
            {
              OR: [
                ...(username ? [{ username }] : []),
                ...(email ? [{ email }] : []),
              ],
            },
          ],
        },
      });

      if (existingUser) {
        res.status(409).json({
          error: "Data already exists",
          message: "Username or email is already taken by another user.",
        });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      error: "Profile update failed",
      message: "An error occurred while updating user profile.",
    });
  }
};

// change password
export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        message: "User must be authenticated to change password.",
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        error: "Missing passwords",
        message: "Current password and new password are required.",
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        error: "Invalid new password",
        message: "New password must be at least 6 characters long.",
      });
      return;
    }

    // get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      res.status(404).json({
        error: "User not found",
        message: "User not found.",
      });
      return;
    }

    // verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      res.status(401).json({
        error: "Invalid current password",
        message: "Current password is incorrect.",
      });
      return;
    }

    // hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword },
    });

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({
      error: "Password change failed",
      message: "An error occurred while changing password.",
    });
  }
};

// admin: get all users
export const getAllUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      message: "Users retrieved successfully",
      users,
      total: users.length,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      error: "Failed to retrieve users",
      message: "An error occurred while retrieving users.",
    });
  }
};

// admin: update user role or status
export const updateUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    const updateData: any = {};
    if (role) updateData.role = role.toUpperCase();
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        error: "No data to update",
        message: "Please provide role or isActive status to update.",
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      error: "Failed to update user",
      message: "An error occurred while updating user.",
    });
  }
};
