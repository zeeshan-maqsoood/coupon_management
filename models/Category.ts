import mongoose, { type Document, Schema } from "mongoose"

export interface ICategory extends Document {
  name: string
  slug: string
  description?: string
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
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
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
)

// Export the model
export default (mongoose.models.Category as mongoose.Model<ICategory>) || 
  mongoose.model<ICategory>("Category", CategorySchema);

// Export the schema for potential use in other models
export { CategorySchema };
