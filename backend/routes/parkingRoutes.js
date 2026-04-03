import express from "express";
import Parking from "../models/Parking.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────
// @route   POST /api/v1/parking
// @desc    Admin creates a parking slot
// @access  Admin only
// ─────────────────────────────────────────
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { society, slotNumber, slotType, monthlyCharge, isEVCharging, note } =
      req.body;

    if (!society || !slotNumber || !slotType) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    // Check duplicate slot in same society
    const slotExists = await Parking.findOne({ society, slotNumber });
    if (slotExists) {
      return res
        .status(400)
        .json({ message: "Slot number already exists in this society" });
    }

    const slot = await Parking.create({
      society,
      slotNumber,
      slotType,
      monthlyCharge: monthlyCharge || 0,
      isEVCharging: isEVCharging || false,
      note: note || "",
    });

    res
      .status(201)
      .json({ message: "Parking slot created successfully", slot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/parking
// @desc    Get all parking slots — filter by status/type
// @access  Admin only
// ─────────────────────────────────────────
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, slotType, society } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (slotType) filter.slotType = slotType;
    if (society) filter.society = society;

    const slots = await Parking.find(filter)
      .populate("assignedTo", "name email phone")
      .populate("flat", "flatNumber block")
      .populate("society", "name")
      .sort({ slotNumber: 1 });

    res.json({ count: slots.length, slots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/parking/my-slot
// @desc    Resident gets their parking slot
// @access  Resident only
// ─────────────────────────────────────────
router.get("/my-slot", protect, authorize("resident"), async (req, res) => {
  try {
    const slot = await Parking.findOne({ assignedTo: req.user._id })
      .populate("society", "name")
      .populate("flat", "flatNumber block");

    if (!slot) {
      return res
        .status(404)
        .json({ message: "No parking slot assigned to you" });
    }

    res.json({ slot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/parking/available
// @desc    Get all available slots
// @access  Private
// ─────────────────────────────────────────
router.get("/available", protect, async (req, res) => {
  try {
    const { society, slotType } = req.query;

    const filter = { status: "available" };
    if (society) filter.society = society;
    if (slotType) filter.slotType = slotType;

    const slots = await Parking.find(filter)
      .populate("society", "name")
      .sort({ slotNumber: 1 });

    res.json({ count: slots.length, slots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/parking/:id
// @desc    Get single parking slot
// @access  Admin only
// ─────────────────────────────────────────
router.get("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const slot = await Parking.findById(req.params.id)
      .populate("assignedTo", "name email phone")
      .populate("flat", "flatNumber block floor")
      .populate("society", "name address");

    if (!slot) {
      return res.status(404).json({ message: "Parking slot not found" });
    }

    res.json({ slot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/parking/:id/assign
// @desc    Admin assigns parking slot to resident
// @access  Admin only
// ─────────────────────────────────────────
router.put("/:id/assign", protect, authorize("admin"), async (req, res) => {
  try {
    const { userId, flatId, vehicleNumber, vehicleType } = req.body;

    if (!userId || !flatId) {
      return res
        .status(400)
        .json({ message: "Please provide userId and flatId" });
    }

    const slot = await Parking.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "Parking slot not found" });
    }

    if (slot.status === "occupied") {
      return res.status(400).json({ message: "Slot is already occupied" });
    }

    slot.assignedTo = userId;
    slot.flat = flatId;
    slot.vehicleNumber = vehicleNumber || "";
    slot.vehicleType = vehicleType || "";
    slot.status = "occupied";
    await slot.save();

    res.json({ message: "Parking slot assigned successfully", slot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/parking/:id/unassign
// @desc    Admin unassigns parking slot
// @access  Admin only
// ─────────────────────────────────────────
router.put("/:id/unassign", protect, authorize("admin"), async (req, res) => {
  try {
    const slot = await Parking.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "Parking slot not found" });
    }

    slot.assignedTo = null;
    slot.flat = null;
    slot.vehicleNumber = "";
    slot.vehicleType = "";
    slot.status = "available";
    await slot.save();

    res.json({ message: "Parking slot unassigned successfully", slot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/parking/:id
// @desc    Update parking slot details
// @access  Admin only
// ─────────────────────────────────────────
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const slot = await Parking.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "Parking slot not found" });
    }

    const { slotType, status, monthlyCharge, isEVCharging, note } = req.body;

    slot.slotType = slotType || slot.slotType;
    slot.status = status || slot.status;
    slot.monthlyCharge = monthlyCharge || slot.monthlyCharge;
    slot.isEVCharging =
      isEVCharging !== undefined ? isEVCharging : slot.isEVCharging;
    slot.note = note || slot.note;

    await slot.save();

    res.json({ message: "Parking slot updated successfully", slot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   DELETE /api/v1/parking/:id
// @desc    Delete parking slot
// @access  Admin only
// ─────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const slot = await Parking.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "Parking slot not found" });
    }

    await slot.deleteOne();
    res.json({ message: "Parking slot deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
