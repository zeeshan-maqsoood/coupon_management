import type { NextRequest } from "next/server"

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
      // In a real application, you would validate JWT token here
      // For demo purposes, we'll simulate an authenticated user
      const authHeader = req.headers.get("authorization")

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      }

      // Simulate user extraction from token
      req.user = {
        id: "demo-user-id",
        username: "admin",
        email: "admin@example.com",
        role: "admin",
        permissions: ["users.read", "users.create", "users.update", "users.delete"],
      }

      return handler(req)
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: "Authentication failed" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }
  }
}

export function requirePermission(permission: string) {
  return (handler: (req: AuthenticatedRequest) => Promise<Response>) => {
    return withAuth(async (req: AuthenticatedRequest) => {
      if (!req.user?.permissions.includes(permission)) {
        return new Response(JSON.stringify({ success: false, error: "Insufficient permissions" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      }
      return handler(req)
    })
  }
}
