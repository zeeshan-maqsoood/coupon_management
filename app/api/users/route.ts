import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    await dbConnect()
    const users = await User.find({}).select("-password").sort({ createdAt: -1 })
    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    const { username, email, password, role = 'editor', permissions = [], status = 'active' } = body

    console.log('Creating user with data:', { username, email, role, status })

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email?.toLowerCase() }, { username }],
    })

    if (existingUser) {
      console.log('User already exists:', { email, username })
      return NextResponse.json(
        { success: false, error: "User with this email or username already exists" },
        { status: 400 },
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Map permissions to correct format (both formats are accepted)
    const formattedPermissions = permissions.map((p: string) => {
      // If permission is in format USER_VIEW, convert to users.view
      if (p.includes('_')) {
        const [resource, action] = p.toLowerCase().split('_')
        return `${resource}s.${action}`
      }
      // If already in users.view format, keep it as is
      return p
    }).filter(Boolean) // Remove any null/undefined values

    console.log('Creating user with permissions:', formattedPermissions)

    // Create user
    const user = await User.create({
      username,
      email: email?.toLowerCase(),
      password: hashedPassword,
      role,
      permissions: formattedPermissions,
      status,
    })

    // Remove password from response
    const userResponse = user.toObject()
    delete userResponse.password

    return NextResponse.json({ success: true, data: userResponse }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ success: false, error: error.message || "Failed to create user" }, { status: 500 })
  }
}
