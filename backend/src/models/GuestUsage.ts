import mongoose from "mongoose";

const guestUsageSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  count: { type: Number, default: 0 },
  date: { type: String }, // YYYY-MM-DD
});

export default mongoose.model("GuestUsage", guestUsageSchema);

