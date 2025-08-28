import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// In a real app, you would get this from your environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '1h';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Login attempt:', { email, password });
    
    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // In a real app, you would validate credentials against a database
    // For this example, we'll use a hardcoded admin user
    const validCredentials = email === 'admin@example.com' && password === 'admin123';
    
    if (!validCredentials) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // User data to include in the token
    const userData = {
      id: '1',
      email: email,
      username: 'admin',
      role: 'admin',
      permissions: ['admin:all']
    };

    // Generate JWT token
    const token = sign(userData, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // Create response with user data and token
    const responseData = {
      success: true,
      data: {
        token,
        user: {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          role: userData.role,
          permissions: userData.permissions
        }
      }
    };

    // Create response
    const response = new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Set HTTP-only cookie with the token
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });

    console.log('Login successful, token set in cookie');

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}