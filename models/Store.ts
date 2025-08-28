import mongoose, { type Document, Schema, Model } from "mongoose";
import { ISubCategory } from './SubCategory';

export interface ICoupon {
  _id?: mongoose.Types.ObjectId
  couponTitle: string
  couponCode: string
  trackingLink: string
  couponDescription: string
  expiryDate: Date
  codeType: "percentage" | "fixed" | "freeShipping" | "bogo"
  discountPercentage?: number
  status: "active" | "inactive" | "expired"
}

export interface IStore extends Document {
  storeName: string
  storeHeading: string
  slug: string
  network: string
  primaryCategory?: mongoose.Types.ObjectId
  subCategory?: mongoose.Types.ObjectId | ISubCategory
  country: string
  websiteUrl: string
  trackingLink: string
  storeThumbAlt: string
  metaTitle: string
  metaKeywords: string
  metaDescription: string
  status: "enable" | "disable"
  impressionCode: string
  storeDescription: string
  moreAboutStore: string
  logoImage?: string
  thumbnailImage?: string
  coupons: ICoupon[]
  createdAt: Date
  updatedAt: Date
}

const StoreSchema = new Schema<IStore>(
  {
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Please use a valid slug (e.g., my-store-name)']
    },
    storeHeading: {
      type: String,
      required: true,
      trim: true,
    },
    network: {
      type: String,
      required: true,
    },
    primaryCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    websiteUrl: {
      type: String,
      required: true,
      trim: true,
      match: [/^https?:\/\//, 'Please use a valid URL with HTTP/HTTPS']
    },
    trackingLink: {
      type: String,
      required: true,
      trim: true,
    },
    storeThumbAlt: {
      type: String,
      required: true,
      trim: true,
    },
    metaTitle: {
      type: String,
      required: true,
      trim: true,
    },
    metaKeywords: {
      type: String,
      required: true,
      trim: true,
    },
    metaDescription: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["enable", "disable"],
      default: "enable",
    },
    impressionCode: {
      type: String,
      trim: true,
    },
    storeDescription: {
      type: String,
      required: true,
    },
    moreAboutStore: {
      type: String,
      required: true,
    },
    logoImage: {
      type: String,
      trim: true,
    },
    thumbnailImage: {
      type: String,
      trim: true,
    },
    coupons: [
      {
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
          min: 0,
          max: 100,
          required: function() {
            return this.codeType === 'percentage';
          }
        },
        status: {
          type: String,
          enum: ["active", "inactive", "expired"],
          default: "active",
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Pre-save hook to generate slug from store name if not provided
StoreSchema.pre('save', function(next) {
  if (!this.isModified('storeName') && !this.isNew) return next()
  
  // Only generate slug if it's not provided or if the store name has changed
  if (!this.slug || this.isModified('storeName')) {
    // Convert to lowercase, replace spaces with hyphens, and remove special characters
    this.slug = this.storeName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // remove special characters
      .replace(/\s+/g, '-') // replace spaces with hyphens
      .replace(/-+/g, '-') // replace multiple hyphens with single
      .trim()
  }
  
  next()
})

export default (mongoose.models.Store as Model<IStore>) || 
  mongoose.model<IStore>("Store", StoreSchema);
