import express from "express";
import Parking from "../models/Parking.js";
import Flat from "../models/Flat.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────
// @route   POST /api/v1/parking
// @desc    Admin & Security creates a parking slot
// @access  Admin & Security
// ─────────────────────────────────────────
router.post("/", protect, authorize("admin", "security"), async (req, res) => {
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
router.get("/", protect, authorize("admin", "security", "staff"), async (req, res) => {
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
    let slot = await Parking.findOne({ assignedTo: req.user._id })
      .populate("society", "name")
      .populate("flat", "flatNumber block");

    if (!slot) {
      const userFlat = await Flat.findOne({
        $or: [{ owner: req.user._id }, { tenant: req.user._id }],
      }).populate("society", "name");

      if (userFlat && userFlat.parkingSlot) {
        let existingSlot = await Parking.findOne({
          society: userFlat.society._id || userFlat.society,
          slotNumber: userFlat.parkingSlot,
        });

        if (!existingSlot) {
          existingSlot = await Parking.create({
            society: userFlat.society._id || userFlat.society,
            slotNumber: userFlat.parkingSlot,
            slotType: "four_wheeler",
            status: "occupied",
            assignedTo: req.user._id,
            flat: userFlat._id,
            monthlyCharge: 0,
            note: "Auto-synced from Flat assignment",
          });
        } else {
          existingSlot.assignedTo = req.user._id;
          existingSlot.flat = userFlat._id;
          existingSlot.status = "occupied";
          await existingSlot.save();
        }

        slot = await Parking.findById(existingSlot._id)
          .populate("society", "name")
          .populate("flat", "flatNumber block");
      }
    }

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
// @desc    Admin & Security assigns parking slot to resident
// @access  Admin & Security
// ─────────────────────────────────────────
router.put("/:id/assign", protect, authorize("admin", "security"), async (req, res) => {
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
// @desc    Admin & Security unassigns parking slot
// @access  Admin & Security
// ─────────────────────────────────────────
router.put("/:id/unassign", protect, authorize("admin", "security"), async (req, res) => {
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
// @route   PUT /api/v1/parking/my-slot/vehicle-info
// @desc    Resident submits vehicle information for their assigned slot (locked after submission)
// @access  Resident only
// ─────────────────────────────────────────
router.put("/my-slot/vehicle-info", protect, authorize("resident"), async (req, res) => {
  try {
    const slot = await Parking.findOne({ assignedTo: req.user._id });
    if (!slot) {
      return res.status(404).json({ message: "No parking slot assigned to you" });
    }

    if (slot.detailsSubmitted) {
      return res.status(400).json({
        message: "Vehicle details have already been submitted and locked. Only an Admin can update your parking information.",
      });
    }

    const { vehicleNumber, vehicleType, isEVCharging, note } = req.body;

    if (!vehicleNumber) {
      return res.status(400).json({ message: "Please provide vehicle number" });
    }

    slot.vehicleNumber = String(vehicleNumber).trim().toUpperCase();
    slot.vehicleType = vehicleType || "four_wheeler";
    if (isEVCharging !== undefined) {
      slot.isEVCharging = Boolean(isEVCharging);
    }
    if (note) {
      slot.note = note;
    }
    slot.detailsSubmitted = true;

    await slot.save();

    const updatedSlot = await Parking.findById(slot._id)
      .populate("society", "name")
      .populate("flat", "flatNumber block");

    res.json({ message: "Vehicle details submitted and locked successfully", slot: updatedSlot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/parking/:id
// @desc    Update parking slot details
// @access  Admin & Security
// ─────────────────────────────────────────
router.put("/:id", protect, authorize("admin", "security"), async (req, res) => {
  try {
    const slot = await Parking.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "Parking slot not found" });
    }

    const {
      slotType,
      status,
      monthlyCharge,
      isEVCharging,
      note,
      vehicleNumber,
      vehicleType,
      detailsSubmitted,
    } = req.body;

    slot.slotType = slotType || slot.slotType;
    slot.status = status || slot.status;
    slot.monthlyCharge =
      monthlyCharge !== undefined ? monthlyCharge : slot.monthlyCharge;
    slot.isEVCharging =
      isEVCharging !== undefined ? isEVCharging : slot.isEVCharging;
    slot.note = note !== undefined ? note : slot.note;
    slot.vehicleNumber =
      vehicleNumber !== undefined ? vehicleNumber : slot.vehicleNumber;
    slot.vehicleType =
      vehicleType !== undefined ? vehicleType : slot.vehicleType;
    slot.detailsSubmitted =
      detailsSubmitted !== undefined ? detailsSubmitted : slot.detailsSubmitted;

    await slot.save();

    res.json({ message: "Parking slot updated successfully", slot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/parking/:id/request
// @desc    Resident requests/self-assigns an available parking slot
// @access  Resident only
// ─────────────────────────────────────────
router.put("/:id/request", protect, authorize("resident"), async (req, res) => {
  try {
    const { vehicleNumber, vehicleType } = req.body;

    if (!vehicleNumber) {
      return res.status(400).json({ message: "Please provide vehicle number" });
    }

    const slot = await Parking.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "Parking slot not found" });
    }

    if (slot.status !== "available") {
      return res.status(400).json({ message: "Slot is not available" });
    }

    // Check if resident already has a slot assigned
    const existingSlot = await Parking.findOne({ assignedTo: req.user._id });
    if (existingSlot) {
      return res.status(400).json({ message: "You already have a parking slot assigned" });
    }

    // Find resident's flat
    const flat = await Flat.findOne({
      $or: [{ owner: req.user._id }, { tenant: req.user._id }],
    });

    if (!flat) {
      return res.status(400).json({ message: "No flat assigned to your account yet. Cannot book parking." });
    }

    slot.assignedTo = req.user._id;
    slot.flat = flat._id;
    slot.vehicleNumber = vehicleNumber;
    slot.vehicleType = vehicleType || "";
    slot.status = "occupied";
    await slot.save();

    res.json({ message: "Parking slot booked successfully", slot });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   DELETE /api/v1/parking/:id
// @desc    Delete parking slot
// @access  Admin & Security
// ─────────────────────────────────────────
router.delete("/:id", protect, authorize("admin", "security"), async (req, res) => {
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

// ─────────────────────────────────────────
// @route   PUT /api/v1/parking/:id/release
// @desc    Resident releases their assigned parking slot
// @access  Resident only
// ─────────────────────────────────────────
router.put("/:id/release", protect, authorize("resident"), async (req, res) => {
  try {
    const slot = await Parking.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "Parking slot not found" });
    }

    // Verify the slot is assigned to the requesting resident
    if (!slot.assignedTo || slot.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "This slot is not assigned to you" });
    }

    // Release slot
    slot.assignedTo = null;
    slot.flat = null;
    slot.vehicleNumber = "";
    slot.vehicleType = "";
    slot.status = "available";

    await slot.save();

    res.json({ message: "Parking slot released successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
