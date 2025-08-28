import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth";
import dbConnect from "@/lib/mongodb";
import Network from "@/models/Network";
import mongoose from "mongoose";

// Helper function to handle errors
const handleError = (error: any, message: string, status: number = 500) => {
  console.error(`${message}:`, error);
  return NextResponse.json(
    { 
      success: false, 
      error: error.message || message,
      ...(process.env.NODE_ENV === 'development' && { details: error })
    },
    { status }
  );
};

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Get all active networks
export const GET = withAuth(async () => {
  try {
    await dbConnect();
    const networks = await Network.find({ status: "active" })
      .sort({ name: 1 })
      .select('-__v');
    return NextResponse.json({ success: true, data: networks });
  } catch (error) {
    return handleError(error, "Failed to fetch networks");
  }
});

// Create a new network
export const POST = withAuth(async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    
    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Network name is required" },
        { status: 400 }
      );
    }
    
    // Generate slug from name
    const slug = generateSlug(body.name);
    
    // Check if network with same slug already exists
    const existingNetwork = await Network.findOne({ slug });
    if (existingNetwork) {
      return NextResponse.json(
        { success: false, error: "A network with this name already exists" },
        { status: 400 }
      );
    }
    
    // Create new network
    const network = new Network({
      name: body.name.trim(),
      slug,
      status: 'active',
      createdBy: new mongoose.Types.ObjectId(req.user?.id)
    });
    
    await network.save();
    
    return NextResponse.json(
      { 
        success: true, 
        data: network,
        message: 'Network created successfully' 
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: "A network with this name already exists"
        },
        { status: 400 }
      );
    }
    return handleError(error, "Failed to create network");
  }
});

// Update a network
export const PUT = withAuth(async (req) => {
  try {
    await dbConnect();
    const { id, ...updateData } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Network ID is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid network ID format" },
        { status: 400 }
      );
    }

    const network = await Network.findById(id);
    if (!network) {
      return NextResponse.json(
        { success: false, error: "Network not found" },
        { status: 404 }
      );
    }
    
    // If name is being updated, update the slug too
    if (updateData.name && updateData.name !== network.name) {
      const newSlug = generateSlug(updateData.name);
      
      // Check if new slug is already taken by another network
      const existingWithSlug = await Network.findOne({ 
        slug: newSlug, 
        _id: { $ne: id } 
      });
      
      if (existingWithSlug) {
        return NextResponse.json(
          { success: false, error: "A network with this name already exists" },
          { status: 400 }
        );
      }
      
      updateData.slug = newSlug;
    }

    const updatedNetwork = await Network.findByIdAndUpdate(
      id, 
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({
      success: true,
      data: updatedNetwork,
      message: "Network updated successfully"
    });
    
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          error: "A network with this name already exists"
        },
        { status: 400 }
      );
    }
    return handleError(error, "Failed to update network");
  }
});

// Delete a network (soft delete by setting status to inactive)
export const DELETE = withAuth(async (req) => {
  try {
    await dbConnect();
    
    // Get ID from query parameters
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Network ID is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid network ID format" },
        { status: 400 }
      );
    }

    const network = await Network.findById(id);
    if (!network) {
      return NextResponse.json(
        { success: false, error: "Network not found" },
        { status: 404 }
      );
    }

    // Mark as inactive instead of deleting
    const updatedNetwork = await Network.findByIdAndUpdate(
      id,
      { 
        status: "inactive",
        updatedAt: new Date()
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedNetwork,
      message: "Network deleted successfully"
    });
    
  } catch (error) {
    return handleError(error, "Failed to delete network");
  }
});
