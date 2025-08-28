import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Store from "@/models/Store"

export async function GET() {
  try {
    await dbConnect()
    
    // Find all stores that need a slug
    const stores = await Store.find({ $or: [
      { slug: { $exists: false } },
      { slug: { $eq: "" } },
      { slug: { $eq: null } }
    ]})

    let updatedCount = 0

    // Update each store with a generated slug
    for (const store of stores) {
      if (store.storeName) {
        const slug = store.storeName
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()

        // Ensure slug is unique
        let uniqueSlug = slug
        let counter = 1
        while (await Store.findOne({ slug: uniqueSlug, _id: { $ne: store._id } })) {
          uniqueSlug = `${slug}-${counter}`
          counter++
        }

        store.slug = uniqueSlug
        await store.save()
        updatedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} stores with slugs`,
      totalStores: stores.length
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { success: false, error: "Failed to migrate slugs" },
      { status: 500 }
    )
  }
}
