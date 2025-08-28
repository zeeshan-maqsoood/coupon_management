import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const user = await User.findById(params.id).select("-password")

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const body = await request.json()
    let { username, email, password, role, permissions = [], status } = body

    // Format permissions if they exist in the request
    let formattedPermissions = [];
    if (permissions && Array.isArray(permissions)) {
      formattedPermissions = permissions.map((p: string) => {
        // If permission is in format USER_VIEW, convert to users.view
        if (p.includes('_')) {
          const [resource, action] = p.toLowerCase().split('_')
          return `${resource}s.${action}`
        }
        // If already in users.view format, keep it as is
        return p
      }).filter(Boolean) // Remove any null/undefined values
    }

    const updateData: any = {
      username,
      email,
      role,
      permissions: formattedPermissions,
      status,
    }

    // Only hash and update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const user = await User.findByIdAndUpdate(params.id, updateData, { new: true, runValidators: true }).select(
      "-password",
    )

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ success: false, error: error.message || "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const user = await User.findByIdAndDelete(params.id)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 })
  }
}
