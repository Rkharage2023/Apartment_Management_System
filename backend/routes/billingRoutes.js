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
// @desc    Auto generate bills for targeted flats matching BHK type & vehicle criteria
// @access  Admin only
// ─────────────────────────────────────────
router.post("/generate-bulk", protect, authorize("admin"), async (req, res) => {
  try {
    const {
      society,
      month,
      billType,
      dueDate,
      amount: customAmount,
      bhkType,
      vehicleFilter,
    } = req.body;

    if (!society || !month || !dueDate) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields (Society, Month, Due Date)" });
    }

    if (!customAmount || Number(customAmount) <= 0) {
      return res
        .status(400)
        .json({ message: "Please enter a valid bill amount (e.g. 1000)" });
    }

    const Parking = (await import("../models/Parking.js")).default;
    const FlatRequest = (await import("../models/FlatRequest.js")).default;

    // Filter flats by vehicle category if vehicleFilter is specified
    let targetVehicleFlatIds = null;

    if (vehicleFilter && vehicleFilter !== "all") {
      let parkingFilter = { society };

      if (vehicleFilter === "ev_only") {
        parkingFilter.$or = [
          { isEVCharging: true },
          { vehicleType: "ev" },
          { slotType: "ev" },
        ];
      } else if (vehicleFilter === "four_wheeler") {
        parkingFilter.$or = [
          { vehicleType: "four_wheeler" },
          { slotType: "four_wheeler" },
        ];
      } else if (vehicleFilter === "two_wheeler") {
        parkingFilter.$or = [
          { vehicleType: "two_wheeler" },
          { slotType: "two_wheeler" },
        ];
      }

      const matchingSlots = await Parking.find(parkingFilter);
      const parkingFlatIds = matchingSlots
        .map((s) => (s.flat ? s.flat.toString() : null))
        .filter(Boolean);

      // Also check FlatRequests for approved vehicle info
      let reqVehFilter = {};
      if (vehicleFilter === "four_wheeler") reqVehFilter.vehicleType = { $in: ["four_wheeler", "both"] };
      else if (vehicleFilter === "two_wheeler") reqVehFilter.vehicleType = { $in: ["two_wheeler", "both"] };

      const matchingRequests = await FlatRequest.find({
        society,
        status: "approved",
        ...reqVehFilter,
      });

      const requestFlatIds = matchingRequests
        .map((r) => (r.flat ? r.flat.toString() : null))
        .filter(Boolean);

      targetVehicleFlatIds = Array.from(new Set([...parkingFlatIds, ...requestFlatIds]));
    }

    // Build flat query with optional BHK filter
    const flatQuery = { society, status: "occupied" };
    if (bhkType && bhkType !== "all") {
      flatQuery.type = bhkType;
    }

    const flats = await Flat.find(flatQuery).populate("owner tenant");

    if (flats.length === 0) {
      return res.status(404).json({
        message: `No occupied ${bhkType && bhkType !== "all" ? bhkType + " " : ""}flats found in this society`,
      });
    }

    const bills = [];
    const skipped = [];
    const billAmount = Number(customAmount);

    for (const flat of flats) {
      const resident = flat.owner || flat.tenant;
      if (!resident) continue;

      // Skip flat if it doesn't match vehicle criteria
      if (targetVehicleFlatIds !== null && !targetVehicleFlatIds.includes(flat._id.toString())) {
        continue;
      }

      // Check if bill already exists for this flat, month & billType
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
        amount: billAmount,
        dueDate,
        month,
      });
    }

    if (bills.length === 0) {
      if (skipped.length > 0) {
        return res.status(400).json({
          message: `Bills for ${month} (${billType || "maintenance"}) already exist for matching flats: ${skipped.join(", ")}`,
        });
      } else {
        return res.status(404).json({
          message: "No matching occupied flats found with the specified BHK type and vehicle criteria.",
        });
      }
    }

    const createdBills = await Bill.insertMany(bills);

    res.status(201).json({
      message: `${createdBills.length} bills of ₹${billAmount} generated successfully!`,
      skipped: skipped.length > 0 ? `Skipped (already billed): ${skipped.join(", ")}` : "None",
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
// @desc    Resident gets strictly their own bills
// @access  Resident only
// ─────────────────────────────────────────
router.get("/my-bills", protect, authorize("resident"), async (req, res) => {
  try {
    const { status, month } = req.query;

    // Find flats where this user is owner or tenant
    const myFlats = await Flat.find({
      $or: [{ owner: req.user._id }, { tenant: req.user._id }],
    });
    const myFlatIds = myFlats.map((f) => f._id);

    const filter = {
      $or: [
        { resident: req.user._id },
        { flat: { $in: myFlatIds } },
      ],
    };

    if (status) filter.status = status;
    if (month) filter.month = month;

    const bills = await Bill.find(filter)
      .populate("flat", "flatNumber block floor type")
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
// @desc    Get single bill (with strict authorization for residents)
// @access  Private
// ─────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate("flat", "flatNumber block floor type owner tenant")
      .populate("resident", "name email phone")
      .populate("society", "name address");

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (req.user.role === "resident") {
      const isResidentBill =
        (bill.resident && bill.resident._id.toString() === req.user._id.toString()) ||
        (bill.flat && (
          (bill.flat.owner && bill.flat.owner.toString() === req.user._id.toString()) ||
          (bill.flat.tenant && bill.flat.tenant.toString() === req.user._id.toString())
        ));

      if (!isResidentBill) {
        return res.status(403).json({ message: "Access denied. You can only view your own bills." });
      }
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
