import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken, generateTokens } from '@/lib/jwt';
import User from '@/models/User';
import { connectToDB } from '@/lib/api-utils';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    await connectToDB();

    // Find user by refresh token
    const user = await User.findOne({
      refreshToken,
      refreshTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      // Clear invalid refresh token
      const response = NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
      response.cookies.delete('refreshToken');
      return response;
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken, refreshTokenExpiry } = 
      await generateTokens({
        _id: user._id,
        email: user.email,
        role: user.role,
      });

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiry = refreshTokenExpiry;
    await user.save();

    // Set HTTP-only cookie for new refresh token
    const response = NextResponse.json(
      { 
        success: true, 
        data: {
          accessToken,
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: user.permissions,
          },
        } 
      },
      { status: 200 }
    );

    response.cookies.set({
      name: 'refreshToken',
      value: newRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(refreshTokenExpiry),
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
