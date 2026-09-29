import express from "express";
import Flat from "../models/Flat.js";
import User from "../models/User.js";
import Parking from "../models/Parking.js";
import FlatRequest from "../models/FlatRequest.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

const syncParkingForFlat = async (flat) => {
  if (!flat || !flat.parkingSlot || !flat.society) return;
  try {
    let slot = await Parking.findOne({
      society: flat.society,
      slotNumber: flat.parkingSlot,
    });

    const activeUserId = flat.tenant || flat.owner || null;
    const newStatus = activeUserId ? "occupied" : "available";

    if (!slot) {
      await Parking.create({
        society: flat.society,
        slotNumber: flat.parkingSlot,
        slotType: "four_wheeler",
        status: newStatus,
        assignedTo: activeUserId,
        flat: flat._id,
        monthlyCharge: 0,
        note: "Auto-synced from Flat",
      });
    } else {
      slot.flat = flat._id;
      slot.assignedTo = activeUserId;
      slot.status = newStatus;
      await slot.save();
    }
  } catch (err) {
    console.error("Error syncing parking slot:", err);
  }
};

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

    // Check society & validate block against totalBlocks
    const Society = (await import("../models/Society.js")).default;
    const societyDoc = await Society.findById(society);
    if (!societyDoc) {
      return res.status(404).json({ message: "Selected society not found" });
    }

    const maxAllowedBlocks = societyDoc.totalBlocks || 1;
    const allowedBlockList = Array.from({ length: maxAllowedBlocks }, (_, i) => String.fromCharCode(65 + i));
    const targetBlock = (block || "A").toUpperCase();

    if (!allowedBlockList.includes(targetBlock)) {
      const lastBlockChar = String.fromCharCode(64 + maxAllowedBlocks);
      const rangeStr = maxAllowedBlocks === 1 ? "Block A" : `Block A to Block ${lastBlockChar}`;
      return res.status(400).json({
        message: `Invalid Block '${block}'. Society '${societyDoc.name}' only has ${maxAllowedBlocks} block(s) (${rangeStr}).`,
      });
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
      block: targetBlock,
      floor,
      type,
      monthlyRent: monthlyRent || 0,
      maintenanceCharge: maintenanceCharge || 0,
      parkingSlot: parkingSlot || "",
    });

    await syncParkingForFlat(flat);

    res.status(201).json({ message: "Flat created successfully", flat });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/flats
// @desc    Get all flats — filter by status/block
// @access  Admin & Authenticated Users
// ─────────────────────────────────────────
router.get("/", protect, async (req, res) => {
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
// @route   POST /api/v1/flats/request
// @desc    Resident requests a vacant flat
// @access  Resident only
// ─────────────────────────────────────────
router.post("/request", protect, authorize("resident"), async (req, res) => {
  try {
    const { flatId, requestAs, vehicleDetails, vehicleType, note } = req.body;

    if (!flatId) {
      return res.status(400).json({ message: "Please select a flat to request" });
    }

    const flat = await Flat.findById(flatId);
    if (!flat) {
      return res.status(404).json({ message: "Flat not found" });
    }

    if (flat.status !== "vacant") {
      return res
        .status(400)
        .json({ message: "This flat is not vacant or available for request" });
    }

    const existingRequest = await FlatRequest.findOne({
      user: req.user._id,
      flat: flatId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "You already have a pending request for this flat",
      });
    }

    const requestDoc = await FlatRequest.create({
      user: req.user._id,
      flat: flatId,
      society: flat.society,
      requestAs: requestAs || "tenant",
      vehicleDetails: vehicleDetails || "",
      vehicleType: vehicleType || "none",
      note: note || "",
      status: "pending",
    });

    res.status(201).json({
      message: "Flat allocation request submitted! Awaiting Admin approval.",
      request: requestDoc,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/flats/requests/my-requests
// @desc    Resident gets their submitted flat requests
// @access  Resident only
// ─────────────────────────────────────────
router.get("/requests/my-requests", protect, authorize("resident"), async (req, res) => {
  try {
    const requests = await FlatRequest.find({ user: req.user._id })
      .populate("flat", "flatNumber block floor type monthlyRent maintenanceCharge status parkingSlot")
      .populate("society", "name address")
      .sort({ createdAt: -1 });

    res.json({ count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/flats/requests
// @desc    Admin gets all flat requests
// @access  Admin only
// ─────────────────────────────────────────
router.get("/requests", protect, authorize("admin"), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const requests = await FlatRequest.find(filter)
      .populate("user", "name email phone")
      .populate("flat", "flatNumber block floor type monthlyRent status parkingSlot")
      .populate("society", "name")
      .sort({ createdAt: -1 });

    res.json({ count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/flats/requests/:id/approve
// @desc    Admin approves flat request and assigns flat to user
// @access  Admin only
// ─────────────────────────────────────────
router.put("/requests/:id/approve", protect, authorize("admin"), async (req, res) => {
  try {
    const flatReq = await FlatRequest.findById(req.params.id);
    if (!flatReq) {
      return res.status(404).json({ message: "Flat request not found" });
    }

    if (flatReq.status === "approved") {
      return res.status(400).json({ message: "Request is already approved" });
    }

    const flat = await Flat.findById(flatReq.flat);
    if (!flat) {
      return res.status(404).json({ message: "Flat not found" });
    }

    const user = await User.findById(flatReq.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const assignField = flatReq.requestAs === "owner" ? "owner" : "tenant";
    flat[assignField] = user._id;
    flat.status = "occupied";
    await flat.save();

    user.flatNumber = flat.flatNumber;
    user.society = flat.society;
    await user.save();

    flatReq.status = "approved";
    flatReq.adminNote = req.body.adminNote || "Approved & Flat Assigned";
    await flatReq.save();

    await syncParkingForFlat(flat);

    res.json({
      message: `Flat request approved and Flat ${flat.flatNumber} assigned to ${user.name}`,
      request: flatReq,
      flat,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/flats/requests/:id/reject
// @desc    Admin rejects flat request
// @access  Admin only
// ─────────────────────────────────────────
router.put("/requests/:id/reject", protect, authorize("admin"), async (req, res) => {
  try {
    const flatReq = await FlatRequest.findById(req.params.id);
    if (!flatReq) {
      return res.status(404).json({ message: "Flat request not found" });
    }

    flatReq.status = "rejected";
    flatReq.adminNote = req.body.adminNote || "Rejected by Admin";
    await flatReq.save();

    res.json({ message: "Flat request rejected", request: flatReq });
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

    await syncParkingForFlat(flat);

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

    await syncParkingForFlat(flat);

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

    await syncParkingForFlat(flat);

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
