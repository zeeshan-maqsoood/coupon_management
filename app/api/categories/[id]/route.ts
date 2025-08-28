import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Category from "@/models/Category"
import SubCategory from "@/models/SubCategory"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const category = await Category.findById(params.id)

    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch category" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const body = await request.json()
    const { name, description, status } = body

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const category = await Category.findByIdAndUpdate(
      params.id,
      { name, slug, description, status },
      { new: true, runValidators: true },
    )

    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()

    // Check if category has subcategories
    const subcategoriesCount = await SubCategory.countDocuments({ categoryId: params.id })
    if (subcategoriesCount > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete category with existing subcategories" },
        { status: 400 },
      )
    }

    const category = await Category.findByIdAndDelete(params.id)

    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Category deleted successfully" })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete category" }, { status: 500 })
  }
}
