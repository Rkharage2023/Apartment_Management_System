import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["guest", "delivery", "maintenance", "cab", "medical", "other"],
      required: true,
    },
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    entryTime: {
      type: Date,
      default: null,
    },
    exitTime: {
      type: Date,
      default: null,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    vehicleNumber: {
      type: String,
      default: "",
    },
    isFrequent: {
      type: Boolean,
      default: false,
    },
    isBlacklisted: {
      type: Boolean,
      default: false,
    },
    photo: {
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

const Visitor = mongoose.model("Visitor", visitorSchema);
export default Visitor;
