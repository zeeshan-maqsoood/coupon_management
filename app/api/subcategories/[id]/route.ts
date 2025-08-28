import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import SubCategory from "@/models/SubCategory"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const subcategory = await SubCategory.findById(params.id).populate("categoryId", "name")

    if (!subcategory) {
      return NextResponse.json({ success: false, error: "Subcategory not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: subcategory })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch subcategory" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const body = await request.json()
    const { name, categoryId, description, status } = body

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const subcategory = await SubCategory.findByIdAndUpdate(
      params.id,
      { name, slug, categoryId, description, status },
      { new: true, runValidators: true },
    ).populate("categoryId", "name")

    if (!subcategory) {
      return NextResponse.json({ success: false, error: "Subcategory not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: subcategory })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update subcategory" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const subcategory = await SubCategory.findByIdAndDelete(params.id)

    if (!subcategory) {
      return NextResponse.json({ success: false, error: "Subcategory not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Subcategory deleted successfully" })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete subcategory" }, { status: 500 })
  }
}
