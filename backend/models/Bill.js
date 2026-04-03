import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
    },
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
    },
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    billType: {
      type: String,
      enum: [
        "maintenance",
        "water",
        "electricity",
        "parking",
        "amenity",
        "other",
      ],
      default: "maintenance",
    },
    amount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    month: {
      type: String, // "April-2026"
      required: true,
    },
    status: {
      type: String,
      enum: ["unpaid", "paid", "overdue"],
      default: "unpaid",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "online", "upi", "bank_transfer"],
      default: null,
    },
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const Bill = mongoose.model("Bill", billSchema);
export default Bill;
