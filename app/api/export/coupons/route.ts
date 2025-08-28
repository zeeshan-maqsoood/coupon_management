import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Coupon from "@/models/Coupon"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "json"
    const storeId = searchParams.get("storeId")
    const status = searchParams.get("status")

    const query: any = {}
    if (storeId) query.storeId = storeId
    if (status) query.status = status

    const coupons = await Coupon.find(query).populate("storeId", "storeName storeHeading").sort({ createdAt: -1 })

    if (format === "csv") {
      const csvHeaders = [
        "Coupon Title",
        "Coupon Code",
        "Store Name",
        "Code Type",
        "Status",
        "Expiry Date",
        "Created Date",
        "Tracking Link",
      ]

      const csvRows = coupons.map((coupon: any) => [
        coupon.couponTitle,
        coupon.couponCode,
        coupon.storeId?.storeName || "",
        coupon.codeType,
        coupon.status,
        new Date(coupon.expiryDate).toISOString().split("T")[0],
        new Date(coupon.createdAt).toISOString().split("T")[0],
        coupon.trackingLink,
      ])

      const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=coupons.csv",
        },
      })
    }

    return NextResponse.json({ success: true, data: coupons })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Export failed" }, { status: 500 })
  }
}
