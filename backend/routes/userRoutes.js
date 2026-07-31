import express from "express";
import User from "../models/User.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// Get all users
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new user (Admin)
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, email, password, phone, role, flatNumber, society } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || "",
      role: role || "resident",
      flatNumber: flatNumber || "",
      society: society || null,
      isVerified: true,
    });
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user details
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, email, phone, role, flatNumber, isVerified } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (flatNumber !== undefined) user.flatNumber = flatNumber;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle user verification
router.put("/:id/verify", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isVerified = !user.isVerified;
    await user.save();
    res.json({ message: `User ${user.isVerified ? "verified" : "unverified"} successfully`, isVerified: user.isVerified });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Change user role
router.put("/:id/role", protect, authorize("admin"), async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["admin", "resident", "security", "staff"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Role updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
