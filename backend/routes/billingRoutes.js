import express from "express";
import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";
import Flat from "../models/Flat.js";
import protect from "../middleware/authMiddleware.js";
import authorize from "../middleware/roleMiddleware.js";

const router = express.Router();

// ─────────────────────────────────────────
// @route   POST /api/v1/billing
// @desc    Admin creates a single bill
// @access  Admin only
// ─────────────────────────────────────────
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    let { flat, society, resident, billType, amount, dueDate, month, note } =
      req.body;

    // Validate flat field
    if (!flat) return res.status(400).json({ message: "Please select a flat" });

    // Fetch flat document to auto-populate society/resident if missing
    const flatDoc = await Flat.findById(flat).populate("owner tenant society");
    if (!flatDoc) {
      return res.status(404).json({ message: "Selected flat not found" });
    }

    // Fallback society if not passed
    if (!society && flatDoc.society) {
      society = flatDoc.society._id ? flatDoc.society._id.toString() : flatDoc.society.toString();
    }

    // Fallback resident if not passed
    if (!resident) {
      const resUser = flatDoc.owner || flatDoc.tenant;
      if (resUser) {
        resident = resUser._id ? resUser._id.toString() : resUser.toString();
      }
    }

    if (!society) return res.status(400).json({ message: "Society is required (select a flat first)" });
    if (!resident || resident === "") return res.status(400).json({ message: "Resident not found for this flat. Please select a resident or assign an owner/tenant to the flat." });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ message: "Please enter a valid amount" });
    if (!month) return res.status(400).json({ message: "Please select a billing month" });
    if (!dueDate) return res.status(400).json({ message: "Please select a due date" });

    // Check duplicate bill for same flat same month same type
    const billExists = await Bill.findOne({ flat, month, billType: billType || "maintenance" });
    if (billExists) {
      return res.status(400).json({
        message: `A ${billType || "maintenance"} bill already exists for ${month}. Cannot generate duplicate.`,
      });
    }

    const bill = await Bill.create({
      flat,
      society,
      resident,
      billType: billType || "maintenance",
      amount: Number(amount),
      dueDate,
      month,
      note: note || "",
    });

    res.status(201).json({ message: "Bill created successfully", bill });
  } catch (error) {
    // Return specific Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   POST /api/v1/billing/generate-bulk
// @desc    Auto generate bills for all occupied flats
// @access  Admin only
// ─────────────────────────────────────────
router.post("/generate-bulk", protect, authorize("admin"), async (req, res) => {
  try {
    const { society, month, billType, dueDate } = req.body;

    if (!society || !month || !dueDate) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    // Get all occupied flats in this society
    const flats = await Flat.find({ society, status: "occupied" }).populate(
      "owner tenant",
    );

    if (flats.length === 0) {
      return res.status(404).json({ message: "No occupied flats found" });
    }

    const bills = [];
    const skipped = [];

    for (const flat of flats) {
      // Determine resident — owner takes priority over tenant
      const resident = flat.owner || flat.tenant;
      if (!resident) continue;

      const amount =
        billType === "maintenance" ? flat.maintenanceCharge : flat.monthlyRent;

      // Skip if bill already exists
      const billExists = await Bill.findOne({
        flat: flat._id,
        month,
        billType: billType || "maintenance",
      });

      if (billExists) {
        skipped.push(flat.flatNumber);
        continue;
      }

      bills.push({
        flat: flat._id,
        society,
        resident: resident._id,
        billType: billType || "maintenance",
        amount,
        dueDate,
        month,
      });
    }

    // Insert all bills at once
    const createdBills = await Bill.insertMany(bills);

    res.status(201).json({
      message: `${createdBills.length} bills generated successfully`,
      skipped: skipped.length > 0 ? `Skipped: ${skipped.join(", ")}` : "None",
      bills: createdBills,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/billing
// @desc    Admin gets all bills — filter by status/month/society
// @access  Admin only
// ─────────────────────────────────────────
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { status, month, society, billType } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (month) filter.month = month;
    if (society) filter.society = society;
    if (billType) filter.billType = billType;

    const bills = await Bill.find(filter)
      .populate("flat", "flatNumber block floor")
      .populate("resident", "name email phone")
      .populate("society", "name")
      .sort({ createdAt: -1 });

    res.json({ count: bills.length, bills });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/billing/my-bills
// @desc    Resident gets their own bills
// @access  Resident only
// ─────────────────────────────────────────
router.get("/my-bills", protect, authorize("resident"), async (req, res) => {
  try {
    const { status, month } = req.query;

    const filter = { resident: req.user._id };
    if (status) filter.status = status;
    if (month) filter.month = month;

    const bills = await Bill.find(filter)
      .populate("flat", "flatNumber block floor")
      .populate("society", "name address")
      .sort({ createdAt: -1 });

    res.json({ count: bills.length, bills });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/billing/stats
// @desc    Get billing and revenue summary stats
// @access  Admin only
// ─────────────────────────────────────────
router.get("/stats", protect, authorize("admin"), async (req, res) => {
  try {
    const totalBills = await Bill.countDocuments();
    const paidBills = await Bill.countDocuments({ status: "paid" });
    const unpaidBills = await Bill.countDocuments({ status: "unpaid" });
    const overdueBills = await Bill.countDocuments({ status: "overdue" });

    const totalCollectedAgg = await Bill.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalPendingAgg = await Bill.aggregate([
      { $match: { status: { $in: ["unpaid", "overdue"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      totalBills,
      paidBills,
      unpaidBills,
      overdueBills,
      totalCollected: totalCollectedAgg[0]?.total || 0,
      totalPending: totalPendingAgg[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/billing/overdue
// @desc    Get all overdue bills — mark unpaid past due date
// @access  Admin only
// ─────────────────────────────────────────
router.get("/overdue", protect, authorize("admin"), async (req, res) => {
  try {
    // Auto mark overdue
    await Bill.updateMany(
      {
        status: "unpaid",
        dueDate: { $lt: new Date() },
      },
      { status: "overdue" },
    );

    const overdueBills = await Bill.find({ status: "overdue" })
      .populate("flat", "flatNumber block")
      .populate("resident", "name email phone")
      .populate("society", "name")
      .sort({ dueDate: 1 });

    res.json({ count: overdueBills.length, overdueBills });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/billing/:id
// @desc    Get single bill
// @access  Private
// ─────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate("flat", "flatNumber block floor type")
      .populate("resident", "name email phone")
      .populate("society", "name address");

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json({ bill });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/billing/:id/pay-cash
// @desc    Admin marks bill as paid via cash
// @access  Admin only
// ─────────────────────────────────────────
router.put("/:id/pay-cash", protect, authorize("admin"), async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (bill.status === "paid") {
      return res.status(400).json({ message: "Bill is already paid" });
    }

    bill.status = "paid";
    bill.paidAt = new Date();
    bill.paymentMethod = "cash";
    await bill.save();

    // Create payment record
    await Payment.create({
      bill: bill._id,
      resident: bill.resident,
      flat: bill.flat,
      society: bill.society,
      amount: bill.amount,
      paymentMethod: "cash",
      status: "success",
      paidAt: new Date(),
    });

    res.json({ message: "Bill marked as paid (cash)", bill });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   PUT /api/v1/billing/:id/pay-online
// @desc    Resident pays bill online
// @access  Resident only
// ─────────────────────────────────────────
router.put("/:id/pay-online", protect, authorize("resident"), async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (bill.resident.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to pay this bill" });
    }

    if (bill.status === "paid") {
      return res.status(400).json({ message: "Bill is already paid" });
    }

    const { paymentMethod, transactionId } = req.body;

    bill.status = "paid";
    bill.paidAt = new Date();
    bill.paymentMethod = paymentMethod || "online";
    await bill.save();

    // Create payment record
    await Payment.create({
      bill: bill._id,
      resident: bill.resident,
      flat: bill.flat,
      society: bill.society,
      amount: bill.amount,
      paymentMethod: paymentMethod || "online",
      status: "success",
      paidAt: new Date(),
      razorpayPaymentId: transactionId || `TXN_${Date.now()}`
    });

    res.json({ message: "Bill paid successfully", bill });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/v1/billing/payments/history
// @desc    Get all payment history
// @access  Admin only
// ─────────────────────────────────────────
router.get(
  "/payments/history",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const payments = await Payment.find()
        .populate("bill", "billType month amount")
        .populate("resident", "name email phone")
        .populate("flat", "flatNumber block")
        .populate("society", "name")
        .sort({ paidAt: -1 });

      res.json({ count: payments.length, payments });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ─────────────────────────────────────────
// @route   GET /api/v1/billing/payments/my-history
// @desc    Resident gets their payment history
// @access  Resident only
// ─────────────────────────────────────────
router.get(
  "/payments/my-history",
  protect,
  authorize("resident"),
  async (req, res) => {
    try {
      const payments = await Payment.find({ resident: req.user._id })
        .populate("bill", "billType month amount")
        .populate("flat", "flatNumber block")
        .populate("society", "name")
        .sort({ paidAt: -1 });

      res.json({ count: payments.length, payments });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ─────────────────────────────────────────
// @route   DELETE /api/v1/billing/:id
// @desc    Delete a bill
// @access  Admin only
// ─────────────────────────────────────────
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    await bill.deleteOne();
    res.json({ message: "Bill deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
