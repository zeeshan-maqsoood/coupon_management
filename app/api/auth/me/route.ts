import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

// In a real app, you would get this from your environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: Request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No authentication token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token
    try {
      const decoded = verify(token, JWT_SECRET);
      
      // Return the user data from the token
      return NextResponse.json({
        success: true,
        data: decoded
      });
      
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
