import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Store from "@/models/Store"

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    const { action, storeIds } = body

    if (!action || !storeIds || !Array.isArray(storeIds)) {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 })
    }

    let result
    switch (action) {
      case "enable":
        result = await Store.updateMany({ _id: { $in: storeIds } }, { status: "enable" })
        break
      case "disable":
        result = await Store.updateMany({ _id: { $in: storeIds } }, { status: "disable" })
        break
      case "delete":
        result = await Store.deleteMany({ _id: { $in: storeIds } })
        break
      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}d ${result.modifiedCount || result.deletedCount} stores`,
      data: result,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Bulk operation failed" }, { status: 500 })
  }
}
