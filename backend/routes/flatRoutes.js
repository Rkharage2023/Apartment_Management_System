import express from "express";
import Flat from "../models/Flat.js";
import User from "../models/User.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────
// @route   POST /api/v1/flats
// @desc    Create a flat
// @access  Admin only
// ─────────────────────────────────────────
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      society,
      flatNumber,
      block,
      floor,
      type,
      monthlyRent,
      maintenanceCharge,
      parkingSlot,
    } = req.body;

    if (!society || !flatNumber || !floor || !type) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    // Check duplicate flat in same society
    const flatExists = await Flat.findOne({ society, flatNumber });
    if (flatExists) {
      return res
        .status(400)
        .json({ message: "Flat number already exists in this society" });
    }

    const flat = await Flat.create({
      society,
      flatNumber,
      block: block || "A",
      floor,
      type,
      monthlyRent: monthlyRent || 0,
      maintenanceCharge: maintenanceCharge || 0,
      parkingSlot: parkingSlot || "",
    });

    res.status(201).json({ message: "Flat created successfully", flat });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/flats
// @desc    Get all flats — filter by status/block
// @access  Admin only
// ─────────────────────────────────────────
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, block, society } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (block) filter.block = block;
    if (society) filter.society = society;

    const flats = await Flat.find(filter)
      .populate("society", "name address")
      .populate("owner", "name email phone")
      .populate("tenant", "name email phone");

    res.json({ count: flats.length, flats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/flats/my-flat
// @desc    Resident gets their own flat
// @access  Resident only
// ─────────────────────────────────────────
router.get("/my-flat", protect, authorize("resident"), async (req, res) => {
  try {
    const flat = await Flat.findOne({
      $or: [{ owner: req.user._id }, { tenant: req.user._id }],
    })
      .populate("society", "name address amenities")
      .populate("owner", "name email phone")
      .populate("tenant", "name email phone");

    if (!flat) {
      return res.status(404).json({ message: "No flat assigned to you yet" });
    }

    res.json({ flat });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/flats/:id
// @desc    Get single flat by id
// @access  Admin only
// ─────────────────────────────────────────
router.get("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id)
      .populate("society", "name address")
      .populate("owner", "name email phone")
      .populate("tenant", "name email phone");

    if (!flat) {
      return res.status(404).json({ message: "Flat not found" });
    }

    res.json({ flat });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/flats/:id/assign
// @desc    Assign owner or tenant to flat
// @access  Admin only
// ─────────────────────────────────────────
router.put("/:id/assign", protect, authorize("admin"), async (req, res) => {
  try {
    const { userId, assignAs } = req.body;

    if (!userId || !assignAs) {
      return res
        .status(400)
        .json({ message: "Please provide userId and assignAs (owner/tenant)" });
    }

    if (!["owner", "tenant"].includes(assignAs)) {
      return res
        .status(400)
        .json({ message: "assignAs must be owner or tenant" });
    }

    const flat = await Flat.findById(req.params.id);
    if (!flat) {
      return res.status(404).json({ message: "Flat not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Assign user to flat
    flat[assignAs] = userId;
    flat.status = "occupied";
    await flat.save();

    // Update user's flatNumber and society
    user.flatNumber = flat.flatNumber;
    user.society = flat.society;
    await user.save();

    res.json({ message: `User assigned as ${assignAs} successfully`, flat });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/flats/:id/unassign
// @desc    Remove owner or tenant from flat
// @access  Admin only
// ─────────────────────────────────────────
router.put("/:id/unassign", protect, authorize("admin"), async (req, res) => {
  try {
    const { assignAs } = req.body;

    if (!["owner", "tenant"].includes(assignAs)) {
      return res
        .status(400)
        .json({ message: "assignAs must be owner or tenant" });
    }

    const flat = await Flat.findById(req.params.id);
    if (!flat) {
      return res.status(404).json({ message: "Flat not found" });
    }

    // Clear user from flat
    const userId = flat[assignAs];
    flat[assignAs] = null;

    // If both owner and tenant are null — mark vacant
    if (!flat.owner && !flat.tenant) {
      flat.status = "vacant";
    }

    await flat.save();

    // Clear flatNumber from user
    if (userId) {
      await User.findByIdAndUpdate(userId, { flatNumber: "", society: null });
    }

    res.json({ message: `${assignAs} removed from flat successfully`, flat });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/flats/:id
// @desc    Update flat details
// @access  Admin only
// ─────────────────────────────────────────
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) {
      return res.status(404).json({ message: "Flat not found" });
    }

    const {
      block,
      floor,
      type,
      status,
      monthlyRent,
      maintenanceCharge,
      parkingSlot,
    } = req.body;

    flat.block = block || flat.block;
    flat.floor = floor || flat.floor;
    flat.type = type || flat.type;
    flat.status = status || flat.status;
    flat.monthlyRent = monthlyRent || flat.monthlyRent;
    flat.maintenanceCharge = maintenanceCharge || flat.maintenanceCharge;
    flat.parkingSlot = parkingSlot || flat.parkingSlot;

    await flat.save();

    res.json({ message: "Flat updated successfully", flat });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   DELETE /api/v1/flats/:id
// @desc    Delete flat
// @access  Admin only
// ─────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id);
    if (!flat) {
      return res.status(404).json({ message: "Flat not found" });
    }

    await flat.deleteOne();
    res.json({ message: "Flat deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
