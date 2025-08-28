import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Coupon from "@/models/Coupon"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    const { action, couponIds } = body

    if (!action || !couponIds || !Array.isArray(couponIds)) {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 })
    }

    let result
    switch (action) {
      case "activate":
        result = await Coupon.updateMany({ _id: { $in: couponIds } }, { status: "active" })
        break
      case "deactivate":
        result = await Coupon.updateMany({ _id: { $in: couponIds } }, { status: "inactive" })
        break
      case "delete":
        result = await Coupon.deleteMany({ _id: { $in: couponIds } })
        break
      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}d ${result.modifiedCount || result.deletedCount} coupons`,
      data: result,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Bulk operation failed" }, { status: 500 })
  }
}
