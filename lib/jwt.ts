import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Create a secret key for JWT signing/verification
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload extends JWTPayload {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface UserForToken {
  _id: any;
  username: string;
  email: string;
  role: string;
  permissions?: string[];
}

export const generateTokens = async (user: UserForToken) => {
  // Ensure we have all required fields
  if (!user._id) {
    throw new Error('User ID is required for token generation');
  }

  // Prepare the token payload with all required fields
  const payload = {
    id: user._id.toString(),
    username: user.username || '',
    email: user.email || '',
    role: user.role || 'user',
    permissions: Array.isArray(user.permissions) ? user.permissions.map(p => p.toString()) : [],
  };

  console.log('Generating token with payload:', payload);

  // Generate access token
  let accessToken;
  try {
    accessToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secretKey);
  } catch (error) {
    console.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }

  // Generate refresh token
  const refreshToken = randomBytes(40).toString('hex');
  const refreshTokenExpiry = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  );

  return {
    accessToken,
    refreshToken,
    refreshTokenExpiry,
  };
};

export const verifyAccessToken = async (token: string): Promise<TokenPayload | null> => {
  try {
    if (!token) {
      console.error('No token provided for verification');
      return null;
    }
    
    console.log('Verifying token:', token.substring(0, 10) + '...');
    
    // Verify the token
    const { payload } = await jwtVerify(token, secretKey);
    
    console.log('Decoded token payload:', payload);
    
    // Ensure required fields are present
    if (!payload || typeof payload !== 'object' || !('id' in payload)) {
      console.error('Invalid token payload structure:', payload);
      return null;
    }
    
    return {
      id: String(payload.id),
      username: String(payload.username || ''),
      email: String(payload.email || ''),
      role: String(payload.role || 'user'),
      permissions: Array.isArray(payload.permissions) ? payload.permissions.map(String) : [],
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
