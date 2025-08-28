import mongoose, { type Document, Schema } from "mongoose"

export interface ICoupon extends Document {
  storeId: mongoose.Types.ObjectId
  couponTitle: string
  couponCode: string
  trackingLink: string
  couponDescription: string
  expiryDate: Date
  codeType: "percentage" | "fixed" | "freeShipping" | "bogo"
  discountPercentage?: number
  status: "active" | "inactive" | "expired"
  createdAt: Date
  updatedAt: Date
}

const CouponSchema = new Schema<ICoupon>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    couponTitle: {
      type: String,
      required: true,
      trim: true,
    },
    couponCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    trackingLink: {
      type: String,
      required: true,
      trim: true,
    },
    couponDescription: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    codeType: {
      type: String,
      enum: ["percentage", "fixed", "freeShipping", "bogo"],
      required: true,
    },
    discountPercentage: {
      type: Number,
      min: 1,
      max: 100,
      required: function() { return this.codeType === 'percentage' },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
CouponSchema.index({ storeId: 1, status: 1 })
CouponSchema.index({ expiryDate: 1 })

export default mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema)
