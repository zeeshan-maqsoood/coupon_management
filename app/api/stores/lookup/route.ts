import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb-new';
import Store from '@/models/Store';
import { Types } from 'mongoose';

// Ensure models are registered
import '@/models/Category';
import '@/models/SubCategory';

interface PopulatedStore {
  _id: Types.ObjectId;
  storeName: string;
  slug: string;
  storeHeading?: string;
  storeDescription?: string;
  moreAboutStore?: string;
  websiteUrl?: string;
  trackingLink?: string;
  logoImage?: string;
  thumbnailImage?: string;
  network?: string;
  country?: string;
  status: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  primaryCategory?: {
    _id: Types.ObjectId;
    name: string;
    slug: string;
  } | null;
  subCategory?: {
    _id: Types.ObjectId;
    name: string;
    slug: string;
  } | null;
  coupons?: Array<{
    _id?: Types.ObjectId;
    couponTitle: string;
    couponCode: string;
    couponDescription: string;
    expiryDate: Date;
    codeType: "percentage" | "fixed" | "freeShipping" | "bogo";
    status: "active" | "inactive" | "expired";
    trackingLink: string;
    discountPercentage: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    
    if (!id && !slug) {
      return NextResponse.json(
        { success: false, error: 'Either id or slug parameter is required' },
        { status: 400 }
      );
    }

    let store: PopulatedStore | null = null;
    
    try {
      if (id && Types.ObjectId.isValid(id)) {
        // Find by ID if valid ObjectId is provided
        store = await Store.findById(id)
          .populate({
            path: 'primaryCategory',
            select: 'name slug',
            model: 'Category'
          })
          .populate({
            path: 'subCategory',
            select: 'name slug',
            model: 'SubCategory'
          })
          .lean() as unknown as PopulatedStore;
      } else if (slug) {
        // Find by slug if no valid ID provided
        store = await Store.findOne({ slug })
          .populate({
            path: 'primaryCategory',
            select: 'name slug',
            model: 'Category'
          })
          .populate({
            path: 'subCategory',
            select: 'name slug',
            model: 'SubCategory'
          })
          .lean() as unknown as PopulatedStore;
      }
    } catch (error) {
      console.error('Error in store lookup:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch store',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    if (!store) {
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    // Format the response
    const responseData = {
      _id: store._id.toString(),
      name: store.storeName,
      slug: store.slug,
      heading: store.storeHeading,
      description: store.storeDescription,
      about: store.moreAboutStore,
      websiteUrl: store.websiteUrl,
      trackingLink: store.trackingLink,
      logo: store.logoImage,
      thumbnail: store.thumbnailImage,
      network: store.network,
      country: store.country,
      status: store.status,
      primaryCategory: store.primaryCategory ? {
        _id: store.primaryCategory._id.toString(),
        name: store.primaryCategory.name,
        slug: store.primaryCategory.slug
      } : null,
      subCategory: store.subCategory ? {
        _id: store.subCategory._id.toString(),
        name: store.subCategory.name,
        slug: store.subCategory.slug
      } : null,
      meta: {
        title: store.metaTitle,
        description: store.metaDescription,
        keywords: store.metaKeywords
      },
      coupons: store.coupons ? store.coupons.map(coupon => ({
        _id: coupon._id?.toString(),
        title: coupon.couponTitle,
        code: coupon.couponCode,
        description: coupon.couponDescription,
        expiryDate: coupon.expiryDate,
        type: coupon.codeType,
        status: coupon.status,
        trackingLink: coupon.trackingLink,
        discountPercentage: coupon.discountPercentage,
      })) : [],
      createdAt: store.createdAt,
      updatedAt: store.updatedAt
    };

    const response = NextResponse.json({ 
      success: true, 
      data: responseData 
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error in store lookup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch store',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
