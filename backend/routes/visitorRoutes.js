import express from "express";
import Visitor from "../models/Visitor.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────
// @route   POST /api/v1/visitors
// @desc    Resident pre-approves a visitor
// @access  Resident only
// ─────────────────────────────────────────
router.post("/", protect, authorize("resident"), async (req, res) => {
  try {
    const { name, phone, purpose, society, flat, vehicleNumber, note } =
      req.body;

    if (!name || !phone || !purpose || !society || !flat) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    const visitor = await Visitor.create({
      name,
      phone,
      purpose,
      society,
      flat,
      host: req.user._id,
      vehicleNumber: vehicleNumber || "",
      note: note || "",
      approvalStatus: "approved",
    });

    res
      .status(201)
      .json({ message: "Visitor pre-approved successfully", visitor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   POST /api/v1/visitors/walkin
// @desc    Security registers a walk-in visitor
// @access  Security only
// ─────────────────────────────────────────
router.post("/walkin", protect, authorize("security"), async (req, res) => {
  try {
    const { name, phone, purpose, society, flat, host, vehicleNumber, note } =
      req.body;

    if (!name || !phone || !purpose || !society || !flat || !host) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    const visitor = await Visitor.create({
      name,
      phone,
      purpose,
      society,
      flat,
      host,
      vehicleNumber: vehicleNumber || "",
      note: note || "",
      approvalStatus: "pending",
      checkedInBy: req.user._id,
      entryTime: new Date(),
    });

    res
      .status(201)
      .json({ message: "Walk-in visitor registered successfully", visitor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/visitors
// @desc    Admin gets all visitors
// @access  Admin only
// ─────────────────────────────────────────
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { society, purpose, approvalStatus } = req.query;

    const filter = {};
    if (society) filter.society = society;
    if (purpose) filter.purpose = purpose;
    if (approvalStatus) filter.approvalStatus = approvalStatus;

    const visitors = await Visitor.find(filter)
      .populate("host", "name email phone")
      .populate("flat", "flatNumber block")
      .populate("society", "name")
      .populate("checkedInBy", "name role")
      .sort({ createdAt: -1 });

    res.json({ count: visitors.length, visitors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/visitors/my-visitors
// @desc    Resident gets their visitors
// @access  Resident only
// ─────────────────────────────────────────
router.get("/my-visitors", protect, authorize("resident"), async (req, res) => {
  try {
    const visitors = await Visitor.find({ host: req.user._id })
      .populate("flat", "flatNumber block")
      .populate("society", "name")
      .sort({ createdAt: -1 });

    res.json({ count: visitors.length, visitors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/visitors/blacklisted
// @desc    Get all blacklisted visitors
// @access  Admin & Security
// ─────────────────────────────────────────
router.get(
  "/blacklisted",
  protect,
  authorize("admin", "security"),
  async (req, res) => {
    try {
      const visitors = await Visitor.find({ isBlacklisted: true })
        .populate("host", "name email")
        .populate("flat", "flatNumber block")
        .populate("society", "name")
        .sort({ updatedAt: -1 });

      res.json({ count: visitors.length, visitors });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ─────────────────────────────────────────
// @route   GET /api/v1/visitors/:id
// @desc    Get single visitor
// @access  Admin & Security
// ─────────────────────────────────────────
router.get(
  "/:id",
  protect,
  authorize("admin", "security"),
  async (req, res) => {
    try {
      const visitor = await Visitor.findById(req.params.id)
        .populate("host", "name email phone")
        .populate("flat", "flatNumber block floor")
        .populate("society", "name address")
        .populate("checkedInBy", "name role");

      if (!visitor) {
        return res.status(404).json({ message: "Visitor not found" });
      }

      res.json({ visitor });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ─────────────────────────────────────────
// @route   PUT /api/v1/visitors/:id/checkin
// @desc    Security checks in a visitor
// @access  Security only
// ─────────────────────────────────────────
router.put("/:id/checkin", protect, authorize("security"), async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    if (visitor.isBlacklisted) {
      return res
        .status(403)
        .json({ message: "Visitor is blacklisted — entry denied" });
    }

    if (visitor.entryTime) {
      return res.status(400).json({ message: "Visitor already checked in" });
    }

    visitor.entryTime = new Date();
    visitor.checkedInBy = req.user._id;
    visitor.approvalStatus = "approved";
    await visitor.save();

    res.json({ message: "Visitor checked in successfully", visitor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/visitors/:id/checkout
// @desc    Security checks out a visitor
// @access  Security only
// ─────────────────────────────────────────
router.put(
  "/:id/checkout",
  protect,
  authorize("security"),
  async (req, res) => {
    try {
      const visitor = await Visitor.findById(req.params.id);

      if (!visitor) {
        return res.status(404).json({ message: "Visitor not found" });
      }

      if (!visitor.entryTime) {
        return res
          .status(400)
          .json({ message: "Visitor has not checked in yet" });
      }

      if (visitor.exitTime) {
        return res.status(400).json({ message: "Visitor already checked out" });
      }

      visitor.exitTime = new Date();
      await visitor.save();

      res.json({ message: "Visitor checked out successfully", visitor });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ─────────────────────────────────────────
// @route   PUT /api/v1/visitors/:id/blacklist
// @desc    Admin blacklists a visitor
// @access  Admin only
// ─────────────────────────────────────────
router.put("/:id/blacklist", protect, authorize("admin"), async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    visitor.isBlacklisted = true;
    await visitor.save();

    res.json({ message: "Visitor blacklisted successfully", visitor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   DELETE /api/v1/visitors/:id
// @desc    Delete visitor record
// @access  Admin only
// ─────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    await visitor.deleteOne();
    res.json({ message: "Visitor record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
