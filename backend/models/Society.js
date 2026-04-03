import mongoose from "mongoose";

const societySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    totalFlats: {
      type: Number,
      required: true,
    },
    totalBlocks: {
      type: Number,
      default: 1,
    },
    amenities: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const Society = mongoose.model("Society", societySchema);
export default Society;
