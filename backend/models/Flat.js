import mongoose from "mongoose";

const flatSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
    },
    flatNumber: {
      type: String,
      required: true,
      trim: true,
    },
    block: {
      type: String,
      default: "A",
    },
    floor: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["1BHK", "2BHK", "3BHK", "4BHK", "Penthouse"],
      required: true,
    },
    status: {
      type: String,
      enum: ["vacant", "occupied", "under_maintenance"],
      default: "vacant",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    monthlyRent: {
      type: Number,
      default: 0,
    },
    maintenanceCharge: {
      type: Number,
      default: 0,
    },
    parkingSlot: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const Flat = mongoose.model("Flat", flatSchema);
export default Flat;
