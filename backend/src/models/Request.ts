import { Schema, model, Types } from "mongoose";

export interface IRequest {
  user: Types.ObjectId;
  collection?: Types.ObjectId;
  name: string;
  method: string;
  url: string;
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
    headers: { type: Schema.Types.Mixed, default: {} },
    body: { type: Schema.Types.Mixed },
    response: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default model<IRequest>("Request", RequestSchema);
