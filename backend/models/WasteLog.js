import mongoose from "mongoose";

const wasteLogSchema = new mongoose.Schema(
  {
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
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["collected", "missed", "pending"],
      default: "pending",
    },
    wasteType: {
      type: String,
      enum: ["dry", "wet", "hazardous", "recyclable", "mixed"],
      default: "mixed",
    },
    collectedAt: {
      type: Date,
      default: null,
    },
    missedReason: {
      type: String,
      default: "",
    },
    reportedByResident: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const WasteLog = mongoose.model("WasteLog", wasteLogSchema);
export default WasteLog;
