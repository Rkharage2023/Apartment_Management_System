import express from "express";
import Society from "../models/Society.js";
import User from "../models/User.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────
// @route   POST /api/v1/societies
// @desc    Create a society
// @access  Admin only
// ─────────────────────────────────────────
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, address, totalFlats, totalBlocks, amenities } = req.body;

    if (!name || !address || !totalFlats) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    const society = await Society.create({
      name,
      address,
      totalFlats,
      totalBlocks: totalBlocks || 1,
      amenities: amenities || [],
      createdBy: req.user._id,
    });

    // Link society to admin user
    await User.findByIdAndUpdate(req.user._id, { society: society._id });

    res.status(201).json({ message: "Society created successfully", society });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/societies
// @desc    Get all societies
// @access  Admin only
// ─────────────────────────────────────────
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const societies = await Society.find().populate("createdBy", "name email");
    res.json({ count: societies.length, societies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/societies/:id
// @desc    Get single society
// @access  Private
// ─────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const society = await Society.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );

    if (!society) {
      return res.status(404).json({ message: "Society not found" });
    }

    res.json({ society });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/societies/:id
// @desc    Update society
// @access  Admin only
// ─────────────────────────────────────────
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const society = await Society.findById(req.params.id);

    if (!society) {
      return res.status(404).json({ message: "Society not found" });
    }

    const { name, address, totalFlats, totalBlocks, amenities, isActive } =
      req.body;

    society.name = name || society.name;
    society.address = address || society.address;
    society.totalFlats = totalFlats || society.totalFlats;
    society.totalBlocks = totalBlocks || society.totalBlocks;
    society.amenities = amenities || society.amenities;
    society.isActive = isActive !== undefined ? isActive : society.isActive;

    await society.save();

    res.json({ message: "Society updated successfully", society });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   DELETE /api/v1/societies/:id
// @desc    Delete society
// @access  Admin only
// ─────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const society = await Society.findById(req.params.id);

    if (!society) {
      return res.status(404).json({ message: "Society not found" });
    }

    await society.deleteOne();
    res.json({ message: "Society deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
