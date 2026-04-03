import express from "express";
import Notice from "../models/Notice.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────
// @route   POST /api/v1/notices
// @desc    Admin creates a notice
// @access  Admin only
// ─────────────────────────────────────────
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { title, description, category, priority, society, expiresAt } =
      req.body;

    if (!title || !description || !society) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    const notice = await Notice.create({
      title,
      description,
      category: category || "general",
      priority: priority || "medium",
      society,
      createdBy: req.user._id,
      expiresAt: expiresAt || null,
    });

    res.status(201).json({ message: "Notice created successfully", notice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/notices
// @desc    Get all active notices for a society
// @access  Private
// ─────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const { society, category, priority } = req.query;

    const filter = { isActive: true };
    if (society) filter.society = society;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const notices = await Notice.find(filter)
      .populate("createdBy", "name role")
      .populate("society", "name")
      .sort({ createdAt: -1 });

    res.json({ count: notices.length, notices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/notices/:id
// @desc    Get single notice
// @access  Private
// ─────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate("createdBy", "name role")
      .populate("society", "name")
      .populate("acknowledgedBy.user", "name email");

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.json({ notice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/notices/:id/acknowledge
// @desc    Resident acknowledges a notice
// @access  Resident only
// ─────────────────────────────────────────
router.put(
  "/:id/acknowledge",
  protect,
  authorize("resident"),
  async (req, res) => {
    try {
      const notice = await Notice.findById(req.params.id);

      if (!notice) {
        return res.status(404).json({ message: "Notice not found" });
      }

      // Check already acknowledged
      const alreadyAcknowledged = notice.acknowledgedBy.find(
        (a) => a.user.toString() === req.user._id.toString(),
      );

      if (alreadyAcknowledged) {
        return res
          .status(400)
          .json({ message: "You have already acknowledged this notice" });
      }

      notice.acknowledgedBy.push({
        user: req.user._id,
        acknowledgedAt: new Date(),
      });

      await notice.save();

      res.json({ message: "Notice acknowledged successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ─────────────────────────────────────────
// @route   PUT /api/v1/notices/:id
// @desc    Admin updates a notice
// @access  Admin only
// ─────────────────────────────────────────
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    const { title, description, category, priority, isActive, expiresAt } =
      req.body;

    notice.title = title || notice.title;
    notice.description = description || notice.description;
    notice.category = category || notice.category;
    notice.priority = priority || notice.priority;
    notice.isActive = isActive !== undefined ? isActive : notice.isActive;
    notice.expiresAt = expiresAt || notice.expiresAt;

    await notice.save();

    res.json({ message: "Notice updated successfully", notice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   DELETE /api/v1/notices/:id
// @desc    Admin deletes a notice
// @access  Admin only
// ─────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    await notice.deleteOne();
    res.json({ message: "Notice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
