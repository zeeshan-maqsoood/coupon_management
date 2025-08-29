import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import dbConnect from "@/lib/mongodb"

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET(request: NextRequest) {
  // Handle OPTIONS method for CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders
    })
  }

  try {
    await dbConnect()

    return new NextResponse(
      JSON.stringify({
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "connected",
          api: "operational"
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )
  } catch (error) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "disconnected",
          api: "error"
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    ) 
  }
}
