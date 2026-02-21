import mongoose, { Schema, Document } from "mongoose";

export interface IMonitor extends Document {
  user: mongoose.Types.ObjectId;
  request: mongoose.Types.ObjectId;
  name: string;
  scheduleCron: string;
  enabled: boolean;
  config?: Record<string, unknown>;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

const MonitorSchema = new Schema<IMonitor>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    request: { type: Schema.Types.ObjectId, ref: "Request", required: true, index: true },
    name: { type: String, required: true },
    scheduleCron: { type: String, required: true },
    enabled: { type: Boolean, default: true, index: true },
    config: { type: Schema.Types.Mixed },
    lastRunAt: { type: Date },
    nextRunAt: { type: Date, index: true },
  },
  { timestamps: true }
);

MonitorSchema.index({ user: 1, enabled: 1, nextRunAt: 1 });

export default mongoose.model<IMonitor>("Monitor", MonitorSchema);
