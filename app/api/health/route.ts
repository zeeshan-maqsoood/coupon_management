import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"

export async function GET() {
  try {
    await dbConnect()

    return NextResponse.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        api: "operational",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "disconnected",
          api: "operational",
        },
      },
      { status: 503 },
    )
  }
}
