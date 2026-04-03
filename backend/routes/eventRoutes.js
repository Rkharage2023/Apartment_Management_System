import express from "express";
import Event from "../models/Event.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────
// @route   POST /api/v1/events
// @desc    Admin creates an event
// @access  Admin only
// ─────────────────────────────────────────
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      society,
      venue,
      eventDate,
      startTime,
      endTime,
      maxAttendees,
      isRSVPRequired,
    } = req.body;

    if (
      !title ||
      !description ||
      !society ||
      !venue ||
      !eventDate ||
      !startTime ||
      !endTime
    ) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    const event = await Event.create({
      title,
      description,
      category: category || "other",
      society,
      venue,
      eventDate,
      startTime,
      endTime,
      maxAttendees: maxAttendees || 0,
      isRSVPRequired: isRSVPRequired || false,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: "Event created successfully", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/events
// @desc    Get all events
// @access  Private
// ─────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const { society, status, category } = req.query;

    const filter = { isActive: true };
    if (society) filter.society = society;
    if (status) filter.status = status;
    if (category) filter.category = category;

    const events = await Event.find(filter)
      .populate("createdBy", "name role")
      .populate("society", "name")
      .sort({ eventDate: 1 });

    res.json({ count: events.length, events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/events/upcoming
// @desc    Get all upcoming events
// @access  Private
// ─────────────────────────────────────────
router.get("/upcoming", protect, async (req, res) => {
  try {
    const { society } = req.query;

    const filter = {
      status: "upcoming",
      eventDate: { $gte: new Date() },
      isActive: true,
    };
    if (society) filter.society = society;

    const events = await Event.find(filter)
      .populate("createdBy", "name")
      .populate("society", "name")
      .sort({ eventDate: 1 });

    res.json({ count: events.length, events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/events/:id
// @desc    Get single event
// @access  Private
// ─────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "name role")
      .populate("society", "name address")
      .populate("rsvpList.user", "name email phone");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/events/:id/rsvp
// @desc    Resident RSVPs for an event
// @access  Resident only
// ─────────────────────────────────────────
router.put("/:id/rsvp", protect, authorize("resident"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Cannot RSVP for a cancelled event" });
    }

    // Check already rsvped
    const alreadyRSVP = event.rsvpList.find(
      (r) => r.user.toString() === req.user._id.toString(),
    );

    if (alreadyRSVP) {
      return res
        .status(400)
        .json({ message: "You have already RSVPed for this event" });
    }

    // Check max attendees
    if (event.maxAttendees > 0 && event.rsvpList.length >= event.maxAttendees) {
      return res.status(400).json({ message: "Event is fully booked" });
    }

    event.rsvpList.push({
      user: req.user._id,
      rsvpAt: new Date(),
    });

    await event.save();

    res.json({
      message: "RSVP confirmed successfully",
      totalAttendees: event.rsvpList.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/events/:id/cancel-rsvp
// @desc    Resident cancels their RSVP
// @access  Resident only
// ─────────────────────────────────────────
router.put(
  "/:id/cancel-rsvp",
  protect,
  authorize("resident"),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const rsvpIndex = event.rsvpList.findIndex(
        (r) => r.user.toString() === req.user._id.toString(),
      );

      if (rsvpIndex === -1) {
        return res
          .status(400)
          .json({ message: "You have not RSVPed for this event" });
      }

      event.rsvpList.splice(rsvpIndex, 1);
      await event.save();

      res.json({ message: "RSVP cancelled successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ─────────────────────────────────────────
// @route   PUT /api/v1/events/:id/status
// @desc    Admin updates event status
// @access  Admin only
// ─────────────────────────────────────────
router.put("/:id/status", protect, authorize("admin"), async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ["upcoming", "ongoing", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.status = status;
    await event.save();

    res.json({ message: `Event marked as ${status}`, event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/events/:id
// @desc    Admin updates event details
// @access  Admin only
// ─────────────────────────────────────────
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const {
      title,
      description,
      category,
      venue,
      eventDate,
      startTime,
      endTime,
      maxAttendees,
      isRSVPRequired,
    } = req.body;

    event.title = title || event.title;
    event.description = description || event.description;
    event.category = category || event.category;
    event.venue = venue || event.venue;
    event.eventDate = eventDate || event.eventDate;
    event.startTime = startTime || event.startTime;
    event.endTime = endTime || event.endTime;
    event.maxAttendees = maxAttendees || event.maxAttendees;
    event.isRSVPRequired =
      isRSVPRequired !== undefined ? isRSVPRequired : event.isRSVPRequired;

    await event.save();

    res.json({ message: "Event updated successfully", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   DELETE /api/v1/events/:id
// @desc    Admin deletes an event
// @access  Admin only
// ─────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await event.deleteOne();
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
