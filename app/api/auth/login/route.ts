import { NextResponse } from 'next/server';
import { sign } from 'jsonwebtoken';
import { hash } from 'bcryptjs';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';

// Define User model inline to avoid module resolution issues
const userSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  permissions: { type: [String], default: [] },
}, { timestamps: true });

// Create model if it doesn't exist
const User = mongoose.models.User || mongoose.model('User', userSchema);

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

    await dbConnect();
    
    // Check if admin user exists, if not create one
    const ADMIN_EMAIL = 'admin@example.com';
    const ADMIN_PASSWORD = 'admin123';
    
    // First, try to find the admin user with password explicitly selected
    let adminUser = await User.findOne({ email: ADMIN_EMAIL }).select('+password').lean();
    
    if (!adminUser) {
      console.log('Admin user not found, creating new one...');
      try {
        const hashedPassword = await hash(ADMIN_PASSWORD, 10);
        adminUser = await User.create({
          _id: new mongoose.Types.ObjectId('000000000000000000000001'),
          email: ADMIN_EMAIL,
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
          permissions: ['admin:all'],
          status: 'active'
        });
        console.log('Created new admin user');
      } catch (error) {
        console.error('Error creating admin user:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create admin user' },
          { status: 500 }
        );
      }
    }
    
    // Verify password
    console.log('Verifying password...');
    if (!adminUser.password) {
      console.error('No password set for admin user');
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    let validPassword = false;
    try {
      console.log('Comparing passwords...');
      const bcrypt = await import('bcryptjs');
      validPassword = await bcrypt.compare(password, adminUser.password);
      console.log('Password comparison result:', validPassword);
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return NextResponse.json(
        { success: false, error: 'Error validating credentials' },
        { status: 500 }
      );
    }
    
    if (email !== ADMIN_EMAIL || !validPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create a clean user object without the password
    const userData = {
      id: adminUser._id.toString(),
      email: adminUser.email,
      username: adminUser.username,
      role: adminUser.role,
      permissions: adminUser.permissions || []
    };
    
    console.log('User authenticated successfully:', { 
      id: userData.id,
      email: userData.email,
      role: userData.role 
    });
    
    console.log('Generated user data for token:', userData);

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