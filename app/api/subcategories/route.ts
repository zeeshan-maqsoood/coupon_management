import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import SubCategory from "@/models/SubCategory"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

    let query = {}
    if (categoryId) {
      query = { categoryId }
    }

    const subcategories = await SubCategory.find(query).populate("categoryId", "name").sort({ createdAt: -1 })

    return NextResponse.json({ success: true, data: subcategories })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch subcategories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const body = await request.json()
    const { name, categoryId, description, status } = body

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Check if subcategory with same name exists in the same category
    const existingSubCategory = await SubCategory.findOne({
      name,
      categoryId,
    })

    if (existingSubCategory) {
      return NextResponse.json(
        { success: false, error: "Subcategory with this name already exists in this category" },
        { status: 400 },
      )
    }

    const subcategory = await SubCategory.create({
      name,
      slug,
      categoryId,
      description,
      status,
    })

    const populatedSubcategory = await SubCategory.findById(subcategory._id).populate("categoryId", "name")

    return NextResponse.json({ success: true, data: populatedSubcategory }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create subcategory" }, { status: 500 })
  }
}
