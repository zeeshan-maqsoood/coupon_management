import mongoose, { type Document, Schema } from "mongoose"

export interface ISubCategory extends Document {
  name: string
  slug: string
  categoryId: mongoose.Types.ObjectId
  description?: string
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}

const SubCategorySchema = new Schema<ISubCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
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

// Compound index to ensure unique subcategory names within each category
SubCategorySchema.index({ name: 1, categoryId: 1 }, { unique: true })

// Export the model
export default (mongoose.models.SubCategory as mongoose.Model<ISubCategory>) || 
  mongoose.model<ISubCategory>("SubCategory", SubCategorySchema);

// Export the schema for potential use in other models
export { SubCategorySchema };
