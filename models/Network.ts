import mongoose, { type Document, Schema } from "mongoose"

export interface INetwork extends Document {
  name: string
  slug: string
  status: "active" | "inactive"
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const NetworkSchema = new Schema<INetwork>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Network || mongoose.model<INetwork>("Network", NetworkSchema)
