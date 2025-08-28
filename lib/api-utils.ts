import { NextResponse } from "next/server"
import mongoose from 'mongoose';

export async function connectToDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coupon-admin';
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Database connection failed');
  }
}

export function createSuccessResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function createErrorResponse(error: string, status = 500) {
  return NextResponse.json({ success: false, error }, { status });
}

export function handleApiError(error: any) {
  console.error("API Error:", error);

  if (error.name === "ValidationError") {
    return createErrorResponse("Validation failed", 400);
  }

  if (error.name === "CastError") {
    return createErrorResponse("Invalid ID format", 400);
  }

  if (error.code === 11000) {
    return createErrorResponse("Duplicate entry", 409);
  }

  return createErrorResponse(error.message || "Internal server error", 500);
}

export function withErrorHandler(handler: Function) {
  return async function (req: Request, ...args: any[]) {
    try {
      await connectToDB();
      return await handler(req, ...args);
    } catch (error: any) {
      return handleApiError(error);
    }
  };
}

export function withAuth(handler: Function) {
  return async function (req: Request, ...args: any[]) {
    try {
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return createErrorResponse('No token provided', 401);
      }

      const token = authHeader.split(' ')[1];
      const { verifyAccessToken } = await import('@/lib/jwt');
      const decoded = await verifyAccessToken(token);

      if (!decoded) {
        return createErrorResponse('Invalid or expired token', 401);
      }

      // Add user to request object
      (req as any).user = decoded;
      
      return handler(req, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function withPermission(permission: string) {
  return function (handler: Function) {
    return async function (req: Request, ...args: any[]) {
      try {
        const { user } = req as any;
        
        if (!user) {
          return createErrorResponse('Authentication required', 401);
        }

        // Get user from database to check permissions
        const User = (await import('@/models/User')).default;
        const dbUser = await User.findById(user.userId);

        if (!dbUser) {
          return createErrorResponse('User not found', 404);
        }

        if (!dbUser.hasPermission(permission)) {
          return createErrorResponse('Insufficient permissions', 403);
        }

        return handler(req, ...args);
      } catch (error) {
        return handleApiError(error);
      }
    };
  };
}

export function paginate(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return { skip, limit };
}

export function buildSearchQuery(searchTerm: string, fields: string[]) {
  if (!searchTerm) return {};
  
  const searchQuery = fields.map(field => ({
    [field]: { $regex: searchTerm, $options: 'i' }
  }));
  
  return { $or: searchQuery };
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // For server-side requests, rely on the cookie being forwarded
  if (typeof window === 'undefined') {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Client-side: Get token from localStorage (preferred) or cookies
  let token: string | null = null;
  
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
    
    if (!token && typeof document !== 'undefined') {
      // Fallback to cookie if not found in localStorage
      const cookieMatch = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='));
        
      if (cookieMatch) {
        token = cookieMatch.split('=')[1];
      }
    }
  }

  if (!token) {
    console.error('No authentication token found in localStorage or cookies');
    // Redirect to login if we're not already there
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('No authentication token found');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}
