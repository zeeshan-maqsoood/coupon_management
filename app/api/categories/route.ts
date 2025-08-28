import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Category from "@/models/Category"

export async function GET() {
  try {
    await dbConnect()
    const categories = await Category.find({}).sort({ createdAt: -1 })
    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    const { name, description, status } = body

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Check if category with same name or slug exists
    const existingCategory = await Category.findOne({
      $or: [{ name }, { slug }],
    })

    if (existingCategory) {
      return NextResponse.json({ success: false, error: "Category with this name already exists" }, { status: 400 })
    }

    const category = await Category.create({
      name,
      slug,
      description,
      status,
    })

    return NextResponse.json({ success: true, data: category }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 })
  }
}
