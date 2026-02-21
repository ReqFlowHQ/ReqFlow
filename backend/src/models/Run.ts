import mongoose, { Schema, Document } from "mongoose";

interface IRunAssertionResult {
  assertionId: string;
  name: string;
  passed: boolean;
  message?: string;
}

export interface IRun extends Document {
  user: mongoose.Types.ObjectId;
  request: mongoose.Types.ObjectId;
  status: number;
  statusText: string;
  durationMs: number;
  response?: Record<string, unknown>;
  assertionResults?: IRunAssertionResult[];
}

const RunSchema = new Schema<IRun>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    request: { type: Schema.Types.ObjectId, ref: "Request", required: true, index: true },
    status: { type: Number, required: true },
    statusText: { type: String, required: true },
    durationMs: { type: Number, required: true },
    response: { type: Schema.Types.Mixed },
    assertionResults: {
      type: [
        {
          assertionId: { type: String, required: true },
          name: { type: String, required: true },
          passed: { type: Boolean, required: true },
          message: { type: String },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

RunSchema.index({ request: 1, createdAt: -1 });
RunSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IRun>("Run", RunSchema);
