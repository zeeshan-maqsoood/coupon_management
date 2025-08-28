import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import User from '@/models/User';
import { connectToDB, createErrorResponse } from '@/lib/api-utils';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refresh-token')?.value;
    const authToken = cookieStore.get('auth-token')?.value;

    if (refreshToken) {
      await connectToDB();
      
      // Clear refresh token from database
      await User.findOneAndUpdate(
        { refreshToken },
        { 
          $set: { 
            refreshToken: null,
            refreshTokenExpiry: null 
          } 
        }
      );
    }

    // Create response
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear auth cookies
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Clear auth token
    response.cookies.set({
      name: 'auth-token',
      value: '',
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      expires: new Date(0),
    });

    // Clear refresh token
    response.cookies.set({
      name: 'refresh-token',
      value: '',
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/api/auth/refresh',
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return createErrorResponse('Failed to process logout');
  }
}
