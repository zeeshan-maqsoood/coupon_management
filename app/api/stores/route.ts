import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/mongodb-new"
import Store from "@/models/Store"
import "@/models/SubCategory" // Import SubCategory model to ensure it's registered

export async function GET() {
  try {
    console.log('Fetching stores...')
    await dbConnect()
    
    console.log('Executing query...')
    
    // First, try to get stores without populating to avoid schema errors
    const stores = await Store.find({}).sort({ createdAt: -1 }).lean().exec()
    
    // If we have stores, try to populate categories if they exist
    if (stores.length > 0) {
      try {
        // Check if both Category and SubCategory models exist
        if (mongoose.models.Category && mongoose.models.SubCategory) {
          await Store.populate(stores, [
            { path: 'primaryCategory', select: 'name' },
            { path: 'subCategory', select: 'name' }
          ])
        } else {
          console.warn('Category or SubCategory model not found. Returning stores without category data.')
        }
      } catch (populateError) {
        console.warn('Error populating categories:', populateError)
        // Continue with unpopulated stores
      }
    }
    
    console.log(`Found ${stores.length} stores`)
    return NextResponse.json({ success: true, data: stores })
  } catch (error) {
    console.error('Error in GET /api/stores:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch stores",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Store ID is required' },
        { status: 400 }
      )
    }

    let updateData: any
    try {
      updateData = await request.json()
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Ensure slug is properly formatted if it's being updated
    if (updateData.slug) {
      updateData.slug = updateData.slug
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
    }

    // Process coupons if they exist
    if (updateData.coupons) {
      try {
        // If coupons is a string, parse it as JSON
        const coupons = typeof updateData.coupons === 'string' 
          ? JSON.parse(updateData.coupons)
          : updateData.coupons;

        updateData.coupons = Array.isArray(coupons) ? coupons.map((coupon: any) => ({
          ...coupon,
          expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate) : null,
          status: coupon.status || 'active',
          // Ensure _id is a valid ObjectId or generate a new one
          _id: coupon._id && /^[0-9a-fA-F]{24}$/.test(coupon._id) 
            ? new mongoose.Types.ObjectId(coupon._id)
            : new mongoose.Types.ObjectId()
        })) : [];
      } catch (error) {
        console.error('Error processing coupons:', error);
        updateData.coupons = [];
      }
    }

    const updatedStore = await Store.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('primaryCategory', 'name slug')
      .populate('subCategory', 'name slug')
      .lean()

    if (!updatedStore) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: updatedStore })
  } catch (error) {
    console.error('Error updating store:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update store',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const contentType = request.headers.get('content-type') || ''
    
    let formData: { [key: string]: any } = {}
    const uploadedFiles: { [key: string]: any } = {}
    
    try {
      if (contentType.includes('multipart/form-data')) {
        // Handle multipart/form-data
        const formDataObj = await request.formData()
        const formDataEntries = Array.from(formDataObj.entries())
        
        // Process all form fields
        for (const [key, value] of formDataEntries) {
          // Handle file uploads
          if (value instanceof File) {
            uploadedFiles[key] = value
            // Store file info in form data
            formData[key] = {
              name: value.name,
              type: value.type,
              size: value.size,
              lastModified: value.lastModified
            }
          } else {
            // Handle regular form fields
            if (key === 'coupons' && typeof value === 'string') {
              try {
                formData[key] = JSON.parse(value)
              } catch (e) {
                console.error('Error parsing coupons:', e)
                formData.coupons = []
              }
            } else {
              // Handle other fields
              formData[key] = value
            }
          }
        }
      } else {
        // Handle JSON body
        try {
          formData = await request.json()
        } catch (e) {
          console.error('Failed to parse JSON body:', e)
          return NextResponse.json(
            { success: false, error: 'Invalid JSON body' },
            { status: 400 }
          )
        }
      }
    } catch (e) {
      console.error('Error parsing request body:', e)
      return NextResponse.json(
        { success: false, error: 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Process store data
    const storeData = {
      ...formData,
      // Ensure slug is properly formatted
      slug: formData.slug?.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
      // Ensure website URL is properly formatted
      websiteUrl: formData.websiteUrl?.trim(),
      // Convert empty string subCategory to null
      subCategory: formData.subCategory || null,
      // Process coupons if they exist
      coupons: (formData.coupons && Array.isArray(formData.coupons)) 
        ? formData.coupons.map((coupon: any) => ({
            ...coupon,
            expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate) : null,
            status: coupon.status || 'active'
          }))
        : []
    }
    
    console.log('Processing store data:', storeData)
    
    // Handle file uploads if any files were uploaded
    if (Object.keys(uploadedFiles).length > 0) {
      console.log('Processing uploaded files:', Object.keys(uploadedFiles))
      // Note: Implement your file upload logic here
      // For now, we'll just log the files
    }
    
    const store = await Store.create(storeData)
    const populatedStore = await Store.findById(store._id)
      .populate("primaryCategory", "name")
      .populate("subCategory", "name")

    return NextResponse.json({ success: true, data: populatedStore }, { status: 201 })
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json(
      { success: false, error: "Failed to create store" }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Store ID is required' },
        { status: 400 }
      )
    }

    // Delete the store
    const result = await Store.findByIdAndDelete(id)
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Store deleted successfully' 
    })

  } catch (error) {
    console.error('Error deleting store:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete store',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
