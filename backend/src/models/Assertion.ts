import mongoose, { Schema, Document } from "mongoose";

export interface IAssertion extends Document {
  user: mongoose.Types.ObjectId;
  request: mongoose.Types.ObjectId;
  name: string;
  rule: Record<string, unknown>;
  enabled: boolean;
}

const AssertionSchema = new Schema<IAssertion>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    request: { type: Schema.Types.ObjectId, ref: "Request", required: true, index: true },
    name: { type: String, required: true },
    rule: { type: Schema.Types.Mixed, required: true },
    enabled: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

AssertionSchema.index({ request: 1, enabled: 1, updatedAt: -1 });

export default mongoose.model<IAssertion>("Assertion", AssertionSchema);
