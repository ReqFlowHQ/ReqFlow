// FILE: backend/src/models/Collection.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ICollection extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  description?: string;
}

const CollectionSchema = new Schema<ICollection>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ICollection>("Collection", CollectionSchema);
