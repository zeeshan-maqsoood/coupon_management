import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/auth";
import dbConnect from "@/lib/mongodb";
import Network from "@/models/Network";

// Helper function to handle errors
const handleError = (error: any, message: string) => {
  console.error(`${message}:`, error);
  return NextResponse.json(
    { success: false, error: message },
    { status: 500 }
  );
};

// Get all active networks
export const GET = withAuth(async () => {
  try {
    await dbConnect();
    const networks = await Network.find({ status: "active" }).sort({ name: 1 });
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
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Network name is required" },
        { status: 400 }
      );
    }
    
    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
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
      name: body.name,
      slug,
      status: 'active',
      createdBy: req.user?.id,
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
  } catch (error: any) {
    console.error('Error in POST /api/networks:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A network with this name or slug already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create network" },
      { status: 500 }
    );
  }
});
