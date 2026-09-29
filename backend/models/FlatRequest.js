import mongoose from "mongoose";

const flatRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    requestAs: {
      type: String,
      enum: ["owner", "tenant"],
      default: "tenant",
    },
    vehicleDetails: {
      type: String,
      default: "",
    },
    vehicleType: {
      type: String,
      enum: ["none", "two_wheeler", "four_wheeler", "both"],
      default: "none",
    },
    note: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const FlatRequest = mongoose.model("FlatRequest", flatRequestSchema);
export default FlatRequest;
