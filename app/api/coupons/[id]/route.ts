import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Coupon from "@/models/Coupon"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const coupon = await Coupon.findById(params.id).populate("storeId", "storeName storeHeading logoImage")

    if (!coupon) {
      return NextResponse.json({ success: false, error: "Coupon not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: coupon })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch coupon" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const body = await request.json()

    // Check if expiry date is in the future (only if status is not expired)
    if (body.status !== "expired") {
      const expiryDate = new Date(body.expiryDate)
      const now = new Date()

      if (expiryDate <= now) {
        body.status = "expired"
      }
    }

    const coupon = await Coupon.findByIdAndUpdate(params.id, body, { new: true, runValidators: true }).populate(
      "storeId",
      "storeName storeHeading logoImage",
    )

    if (!coupon) {
      return NextResponse.json({ success: false, error: "Coupon not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: coupon })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update coupon" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const coupon = await Coupon.findByIdAndDelete(params.id)

    if (!coupon) {
      return NextResponse.json({ success: false, error: "Coupon not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Coupon deleted successfully" })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete coupon" }, { status: 500 })
  }
}
