import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import User from '@/models/User';
import { connectToDB } from '@/lib/api-utils';

// This route needs to be dynamic because it uses cookies
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('Logout endpoint called');
  
  try {
    await connectToDB();
    
    // Get all tokens from cookies
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refresh-token')?.value;
    const authToken = cookieStore.get('auth-token')?.value;

    // If we have a refresh token, clear it from the database
    if (refreshToken) {
      try {
        await User.findOneAndUpdate(
          { refreshToken },
          { 
            $set: { 
              refreshToken: null,
              refreshTokenExpiry: null 
            } 
          }
        );
        console.log('Cleared refresh token from database');
      } catch (error) {
        console.error('Error clearing refresh token from database:', error);
        // Continue with logout even if database update fails
      }
    }

    // Create response
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear all possible auth cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax' as const,
      path: '/',
      expires: new Date(0)
    };
    
    // Clear all possible auth cookies
    const cookieNames = ['auth-token', 'refresh-token', 'token'];
    
    cookieNames.forEach(name => {
      response.cookies.set({
        ...cookieOptions,
        name,
        value: ''
      });
      
      // Also clear from the request cookies
      cookieStore.delete(name);
    });
    
    console.log('Cleared all auth cookies');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return createErrorResponse('Failed to process logout');
  }
}
