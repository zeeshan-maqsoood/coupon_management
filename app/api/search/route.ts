import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import Store from "@/models/Store"
import Category from "@/models/Category"
import SubCategory from "@/models/SubCategory"
import Coupon from "@/models/Coupon"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "all"

    if (!query) {
      return NextResponse.json({ success: false, error: "Search query is required" }, { status: 400 })
    }

    const searchRegex = new RegExp(query, "i")
    const results: any = {}

    if (type === "all" || type === "users") {
      results.users = await User.find({
        $or: [{ username: searchRegex }, { email: searchRegex }],
      })
        .select("-password")
        .limit(10)
    }

    if (type === "all" || type === "stores") {
      results.stores = await Store.find({
        $or: [{ storeName: searchRegex }, { storeHeading: searchRegex }, { network: searchRegex }],
      })
        .populate("primaryCategory", "name")
        .populate("subCategory", "name")
        .limit(10)
    }

    if (type === "all" || type === "categories") {
      results.categories = await Category.find({
        $or: [{ name: searchRegex }, { description: searchRegex }],
      }).limit(10)
    }

    if (type === "all" || type === "subcategories") {
      results.subcategories = await SubCategory.find({
        $or: [{ name: searchRegex }, { description: searchRegex }],
      })
        .populate("categoryId", "name")
        .limit(10)
    }

    if (type === "all" || type === "coupons") {
      results.coupons = await Coupon.find({
        $or: [{ couponTitle: searchRegex }, { couponCode: searchRegex }, { couponDescription: searchRegex }],
      })
        .populate("storeId", "storeName logoImage")
        .limit(10)
    }

    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 })
  }
}
