import { Schema, model, Types } from "mongoose";

export interface IRequest {
  user: Types.ObjectId;
  collection?: Types.ObjectId;
  name: string;
  method: string;
  url: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  auth?: Record<string, unknown>;
  headers?: Record<string, string | number | boolean | null | undefined>;
  body?: any;
  response?: {
    status: number;
    statusText: string;
    data: any;
    headers: Record<string, string | number | boolean | null | undefined>;
  };
}

const RequestSchema = new Schema<IRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    collection: { type: Schema.Types.ObjectId, ref: "Collection" },
    name: { type: String, required: true },
    method: { type: String, required: true },
    url: { type: String, required: true },
    params: { type: Schema.Types.Mixed, default: {} },
    auth: { type: Schema.Types.Mixed, default: { type: "none" } },
    headers: { type: Schema.Types.Mixed, default: {} },
    body: { type: Schema.Types.Mixed },
    response: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

RequestSchema.index({ user: 1, collection: 1, updatedAt: -1 });
RequestSchema.index({ user: 1, updatedAt: -1 });

export default model<IRequest>("Request", RequestSchema);
