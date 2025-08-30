import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import User from '@/models/User';
import { connectToDB } from '@/lib/api-utils';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export async function GET(request: Request) {
  try {
    // Get token from Authorization header first
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.split(' ')[1];
    
    // If no token in header, check cookies
    if (!token) {
      const cookieStore = cookies();
      token = cookieStore.get('auth-token')?.value;
    }
    
    if (!token) {
      console.log('No authentication token found');
      return NextResponse.json(
        { success: false, error: 'No authentication token provided' },
        { status: 401 }
      );
    }
    
    try {
      // Verify the token
      const decoded = verify(token, JWT_SECRET);
      
      if (!decoded || typeof decoded === 'string') {
        throw new Error('Invalid token format');
      }

      // Support both 'id' and 'userId' in the token payload
      const userId = (decoded as any).userId || (decoded as any).id;
      
      if (!userId) {
        throw new Error('Invalid token payload: missing user ID');
      }

      console.log('Token decoded successfully, user ID:', userId);

      // Get fresh user data from database
      await connectToDB();
      const user = await User.findById(userId).select('-password -refreshToken').lean();
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Return user data
      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: user.permissions
          }
        }
      });
      
    } catch (error) {
      console.error('Token verification error:', error);
      
      // Clear invalid tokens
      const response = NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
      
      // Clear the auth cookie if it exists
      response.cookies.delete('auth-token');
      
      return response;
    }
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
