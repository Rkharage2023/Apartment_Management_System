import express from "express";
import WasteLog from "../models/WasteLog.js";
import Flat from "../models/Flat.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────
// @route   POST /api/v1/waste
// @desc    Admin creates daily waste schedule for all flats
// @access  Admin only
// ─────────────────────────────────────────
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { society, date, wasteType } = req.body;

    if (!society || !date) {
      return res
        .status(400)
        .json({ message: "Please provide society and date" });
    }

    // Get all occupied flats
    const flats = await Flat.find({
      society,
      status: "occupied",
    });

    if (flats.length === 0) {
      return res
        .status(404)
        .json({ message: "No occupied flats found in this society" });
    }

    const logs = [];
    const skipped = [];

    for (const flat of flats) {
      const resident = flat.owner || flat.tenant;
      if (!resident) continue;

      // Check if log already exists for this flat on this date
      const logExists = await WasteLog.findOne({
        flat: flat._id,
        date: new Date(date),
      });

      if (logExists) {
        skipped.push(flat.flatNumber);
        continue;
      }

      logs.push({
        society,
        flat: flat._id,
        resident,
        date: new Date(date),
        wasteType: wasteType || "mixed",
        status: "pending",
      });
    }

    const createdLogs = await WasteLog.insertMany(logs);

    res.status(201).json({
      message: `${createdLogs.length} waste logs created successfully`,
      skipped: skipped.length > 0 ? `Skipped: ${skipped.join(", ")}` : "None",
      logs: createdLogs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/waste
// @desc    Admin gets all waste logs — filter by date/status
// @access  Admin only
// ─────────────────────────────────────────
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { society, status, date, wasteType } = req.query;

    const filter = {};
    if (society) filter.society = society;
    if (status) filter.status = status;
    if (wasteType) filter.wasteType = wasteType;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const logs = await WasteLog.find(filter)
      .populate("flat", "flatNumber block floor")
      .populate("resident", "name email phone")
      .populate("collectedBy", "name role")
      .populate("society", "name")
      .sort({ date: -1 });

    res.json({ count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/waste/my-logs
// @desc    Resident gets their waste logs
// @access  Resident only
// ─────────────────────────────────────────
router.get("/my-logs", protect, authorize("resident"), async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { resident: req.user._id };
    if (status) filter.status = status;

    const logs = await WasteLog.find(filter)
      .populate("flat", "flatNumber block")
      .populate("society", "name")
      .populate("collectedBy", "name")
      .sort({ date: -1 });

    res.json({ count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/waste/missed
// @desc    Get all missed collections
// @access  Admin only
// ─────────────────────────────────────────
router.get("/missed", protect, authorize("admin"), async (req, res) => {
  try {
    const { society, date } = req.query;

    const filter = { status: "missed" };
    if (society) filter.society = society;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const logs = await WasteLog.find(filter)
      .populate("flat", "flatNumber block floor")
      .populate("resident", "name email phone")
      .populate("society", "name")
      .sort({ date: -1 });

    res.json({ count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/waste/analytics
// @desc    Get collection analytics for a society
// @access  Admin only
// ─────────────────────────────────────────
router.get("/analytics", protect, authorize("admin"), async (req, res) => {
  try {
    const { society, date } = req.query;

    if (!society) {
      return res.status(400).json({ message: "Please provide society id" });
    }

    const filter = { society };
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const total = await WasteLog.countDocuments(filter);
    const collected = await WasteLog.countDocuments({
      ...filter,
      status: "collected",
    });
    const missed = await WasteLog.countDocuments({
      ...filter,
      status: "missed",
    });
    const pending = await WasteLog.countDocuments({
      ...filter,
      status: "pending",
    });

    const collectionRate =
      total > 0 ? ((collected / total) * 100).toFixed(2) : 0;

    res.json({
      total,
      collected,
      missed,
      pending,
      collectionRate: `${collectionRate}%`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/waste/:id
// @desc    Get single waste log
// @access  Admin only
// ─────────────────────────────────────────
router.get("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const log = await WasteLog.findById(req.params.id)
      .populate("flat", "flatNumber block floor")
      .populate("resident", "name email phone")
      .populate("collectedBy", "name role")
      .populate("society", "name address");

    if (!log) {
      return res.status(404).json({ message: "Waste log not found" });
    }

    res.json({ log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/waste/:id/collect
// @desc    Staff marks flat as collected
// @access  Staff only
// ─────────────────────────────────────────
router.put("/:id/collect", protect, authorize("staff"), async (req, res) => {
  try {
    const log = await WasteLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: "Waste log not found" });
    }

    if (log.status === "collected") {
      return res
        .status(400)
        .json({ message: "Waste already marked as collected" });
    }

    log.status = "collected";
    log.collectedBy = req.user._id;
    log.collectedAt = new Date();
    await log.save();

    res.json({ message: "Waste marked as collected", log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/waste/:id/miss
// @desc    Admin or staff marks collection as missed
// @access  Admin & Staff
// ─────────────────────────────────────────
router.put(
  "/:id/miss",
  protect,
  authorize("admin", "staff"),
  async (req, res) => {
    try {
      const { missedReason } = req.body;

      const log = await WasteLog.findById(req.params.id);

      if (!log) {
        return res.status(404).json({ message: "Waste log not found" });
      }

      if (log.status === "collected") {
        return res
          .status(400)
          .json({ message: "Cannot mark collected waste as missed" });
      }

      log.status = "missed";
      log.missedReason = missedReason || "No reason provided";
      await log.save();

      res.json({ message: "Waste marked as missed", log });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ─────────────────────────────────────────
// @route   PUT /api/v1/waste/:id/report
// @desc    Resident reports missed collection
// @access  Resident only
// ─────────────────────────────────────────
router.put("/:id/report", protect, authorize("resident"), async (req, res) => {
  try {
    const { note } = req.body;

    const log = await WasteLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: "Waste log not found" });
    }

    // Only the resident of that flat can report
    if (log.resident.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to report this log" });
    }

    log.reportedByResident = true;
    log.status = "missed";
    log.note = note || "Reported by resident";
    await log.save();

    res.json({ message: "Missed collection reported successfully", log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   DELETE /api/v1/waste/:id
// @desc    Delete waste log
// @access  Admin only
// ─────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const log = await WasteLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: "Waste log not found" });
    }

    await log.deleteOne();
    res.json({ message: "Waste log deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
