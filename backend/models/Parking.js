import mongoose from "mongoose";

const parkingSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
    },
    slotNumber: {
      type: String,
      required: true,
      trim: true,
    },
    slotType: {
      type: String,
      enum: ["two_wheeler", "four_wheeler", "ev", "visitor"],
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "maintenance"],
      default: "available",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    flat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flat",
      default: null,
    },
    vehicleNumber: {
      type: String,
      default: "",
    },
    vehicleType: {
      type: String,
      default: "",
    },
    monthlyCharge: {
      type: Number,
      default: 0,
    },
    isEVCharging: {
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

const Parking = mongoose.model("Parking", parkingSchema);
export default Parking;
