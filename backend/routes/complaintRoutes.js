import express from "express";
import Complaint from "../models/Complaint.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────
// @route   POST /api/v1/complaints
// @desc    Resident raises a complaint
// @access  Resident only
// ─────────────────────────────────────────
router.post("/", protect, authorize("resident"), async (req, res) => {
  try {
    const { title, description, category, priority, society, flat } = req.body;

    if (!title || !description || !category || !society || !flat) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority: priority || "medium",
      society,
      flat,
      raisedBy: req.user._id,
    });

    res
      .status(201)
      .json({ message: "Complaint raised successfully", complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/complaints
// @desc    Admin gets all complaints — filter by status/category/priority
// @access  Admin only
// ─────────────────────────────────────────
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, category, priority, society } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (society) filter.society = society;

    const complaints = await Complaint.find(filter)
      .populate("raisedBy", "name email phone")
      .populate("assignedTo", "name email")
      .populate("flat", "flatNumber block floor")
      .populate("society", "name")
      .sort({ createdAt: -1 });

    res.json({ count: complaints.length, complaints });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/complaints/my-complaints
// @desc    Resident gets their own complaints
// @access  Resident only
// ─────────────────────────────────────────
router.get(
  "/my-complaints",
  protect,
  authorize("resident"),
  async (req, res) => {
    try {
      const { status } = req.query;

      const filter = { raisedBy: req.user._id };
      if (status) filter.status = status;

      const complaints = await Complaint.find(filter)
        .populate("assignedTo", "name email")
        .populate("flat", "flatNumber block")
        .populate("society", "name")
        .sort({ createdAt: -1 });

      res.json({ count: complaints.length, complaints });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ─────────────────────────────────────────
// @route   GET /api/v1/complaints/escalated
// @desc    Get all escalated complaints
// @access  Admin only
// ─────────────────────────────────────────
router.get("/escalated", protect, authorize("admin"), async (req, res) => {
  try {
    const complaints = await Complaint.find({ status: "escalated" })
      .populate("raisedBy", "name email phone")
      .populate("assignedTo", "name email")
      .populate("flat", "flatNumber block")
      .populate("society", "name")
      .sort({ escalatedAt: -1 });

    res.json({ count: complaints.length, complaints });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/complaints/auto-escalate
// @desc    Auto escalate complaints open for more than 3 days
// @access  Admin only
// ─────────────────────────────────────────
router.get("/auto-escalate", protect, authorize("admin"), async (req, res) => {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const result = await Complaint.updateMany(
      {
        status: { $in: ["open", "in_progress"] },
        createdAt: { $lt: threeDaysAgo },
        escalatedAt: null,
      },
      {
        status: "escalated",
        escalatedAt: new Date(),
      },
    );

    res.json({
      message: `${result.modifiedCount} complaints escalated automatically`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/complaints/:id
// @desc    Get single complaint
// @access  Private
// ─────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("raisedBy", "name email phone")
      .populate("assignedTo", "name email")
      .populate("flat", "flatNumber block floor type")
      .populate("society", "name address")
      .populate("comments.commentedBy", "name role");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({ complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/complaints/:id/assign
// @desc    Admin assigns complaint to staff
// @access  Admin only
// ─────────────────────────────────────────
router.put("/:id/assign", protect, authorize("admin"), async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Please provide userId" });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.assignedTo = userId;
    complaint.status = "in_progress";
    await complaint.save();

    res.json({ message: "Complaint assigned successfully", complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/complaints/:id/status
// @desc    Update complaint status
// @access  Admin & Staff
// ─────────────────────────────────────────
router.put(
  "/:id/status",
  protect,
  authorize("admin", "staff"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const validStatuses = [
        "open",
        "in_progress",
        "resolved",
        "closed",
        "escalated",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      complaint.status = status;

      if (status === "resolved") complaint.resolvedAt = new Date();
      if (status === "closed") complaint.closedAt = new Date();
      if (status === "escalated") complaint.escalatedAt = new Date();

      await complaint.save();

      res.json({ message: `Complaint marked as ${status}`, complaint });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ─────────────────────────────────────────
// @route   PUT /api/v1/complaints/:id/comment
// @desc    Add comment to complaint
// @access  Private — any logged in user
// ─────────────────────────────────────────
router.put("/:id/comment", protect, async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.comments.push({
      commentedBy: req.user._id,
      comment,
      commentedAt: new Date(),
    });

    await complaint.save();

    res.json({ message: "Comment added successfully", complaint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/complaints/:id/feedback
// @desc    Resident gives rating after resolution
// @access  Resident only
// ─────────────────────────────────────────
router.put(
  "/:id/feedback",
  protect,
  authorize("resident"),
  async (req, res) => {
    try {
      const { rating, feedback } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ message: "Rating must be between 1 and 5" });
      }

      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      if (complaint.status !== "resolved") {
        return res
          .status(400)
          .json({ message: "Can only rate resolved complaints" });
      }

      // Only the person who raised it can rate
      if (complaint.raisedBy.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to rate this complaint" });
      }

      complaint.rating = rating;
      complaint.feedback = feedback || "";
      complaint.status = "closed";
      complaint.closedAt = new Date();

      await complaint.save();

      res.json({ message: "Feedback submitted successfully", complaint });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ─────────────────────────────────────────
// @route   DELETE /api/v1/complaints/:id
// @desc    Delete complaint
// @access  Admin only
// ─────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    await complaint.deleteOne();
    res.json({ message: "Complaint deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
