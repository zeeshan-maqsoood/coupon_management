import type { NextRequest } from "next/server"
import { verifyAccessToken } from "@/lib/jwt"

interface JwtPayload {
  id: string
  username: string
  email: string
  role: string
  permissions?: string[]
  iat?: number
  exp?: number
}

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    username: string
    email: string
    role: string
    permissions: string[]
  }
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<Response>) {
  return async (req: AuthenticatedRequest) => {
    try {
      // Get token from Authorization header or cookies
      let token = req.headers.get("authorization")?.split(' ')[1] || 
                 req.cookies.get('auth-token')?.value

      // If no token in headers or cookies, check for token in the request body (for some API calls)
      if (!token && req.method === 'POST') {
        try {
          const body = await req.clone().json()
          token = body.token
        } catch {
          // Ignore JSON parse errors
        }
      }

      if (!token) {
        return new Response(
          JSON.stringify({ success: false, error: "No authentication token provided" }), 
          { status: 401, headers: { "Content-Type": "application/json" } }
        )
      }

      // Verify the token
      const decoded = await verifyAccessToken(token) as JwtPayload | null
      if (!decoded) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid or expired token" }), 
          { status: 401, headers: { "Content-Type": "application/json" } }
        )
      }

      // Set user data from token
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        permissions: Array.isArray(decoded.permissions) ? decoded.permissions : []
      }

      return handler(req)
    } catch (error) {
      console.error("Authentication error:", error)
      return new Response(
        JSON.stringify({ success: false, error: "Authentication failed" }), 
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }
  }
}

export function requirePermission(permission: string) {
  return (handler: (req: AuthenticatedRequest) => Promise<Response>) => {
    return withAuth(async (req: AuthenticatedRequest) => {
      if (!req.user?.permissions.includes(permission) && !req.user?.permissions.includes('admin')) {
        return new Response(
          JSON.stringify({ success: false, error: "Insufficient permissions" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      }
      return handler(req)
    })
  }
}
