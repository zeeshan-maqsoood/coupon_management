import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Coupon from "@/models/Coupon"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")

    let query = {}
    if (storeId) {
      query = { storeId }
    }

    const coupons = await Coupon.find(query)
      .populate("storeId", "storeName storeHeading logoImage")
      .sort({ createdAt: -1 })

    // Update expired coupons
    const now = new Date()
    await Coupon.updateMany({ expiryDate: { $lt: now }, status: { $ne: "expired" } }, { status: "expired" })

    return NextResponse.json({ success: true, data: coupons })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch coupons" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()

    // Check if expiry date is in the future
    const expiryDate = new Date(body.expiryDate)
    const now = new Date()

    if (expiryDate <= now) {
      return NextResponse.json({ success: false, error: "Expiry date must be in the future" }, { status: 400 })
    }

    const coupon = await Coupon.create(body)
    const populatedCoupon = await Coupon.findById(coupon._id).populate("storeId", "storeName storeHeading logoImage")

    return NextResponse.json({ success: true, data: populatedCoupon }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create coupon" }, { status: 500 })
  }
}
