import type { NextRequest } from "next/server"

export interface ValidationSchema {
  [key: string]: {
    required?: boolean
    type?: "string" | "number" | "boolean" | "email" | "url"
    minLength?: number
    maxLength?: number
    pattern?: RegExp
  }
}

export function validateRequest(schema: ValidationSchema) {
  return (handler: (req: NextRequest) => Promise<Response>) => {
    return async (req: NextRequest) => {
      try {
        const body = await req.json()
        const errors: string[] = []

        for (const [field, rules] of Object.entries(schema)) {
          const value = body[field]

          // Check required fields
          if (rules.required && (value === undefined || value === null || value === "")) {
            errors.push(`${field} is required`)
            continue
          }

          // Skip validation if field is not provided and not required
          if (value === undefined || value === null) continue

          // Type validation
          if (rules.type) {
            switch (rules.type) {
              case "string":
                if (typeof value !== "string") errors.push(`${field} must be a string`)
                break
              case "number":
                if (typeof value !== "number") errors.push(`${field} must be a number`)
                break
              case "boolean":
                if (typeof value !== "boolean") errors.push(`${field} must be a boolean`)
                break
              case "email":
                if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                  errors.push(`${field} must be a valid email`)
                }
                break
              case "url":
                if (typeof value !== "string" || !/^https?:\/\/.+/.test(value)) {
                  errors.push(`${field} must be a valid URL`)
                }
                break
            }
          }

          // Length validation
          if (typeof value === "string") {
            if (rules.minLength && value.length < rules.minLength) {
              errors.push(`${field} must be at least ${rules.minLength} characters`)
            }
            if (rules.maxLength && value.length > rules.maxLength) {
              errors.push(`${field} must be no more than ${rules.maxLength} characters`)
            }
          }

          // Pattern validation
          if (rules.pattern && typeof value === "string" && !rules.pattern.test(value)) {
            errors.push(`${field} format is invalid`)
          }
        }

        if (errors.length > 0) {
          return new Response(JSON.stringify({ success: false, errors }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        // Create a new request with the validated body
        const newRequest = new Request(req.url, {
          method: req.method,
          headers: req.headers,
          body: JSON.stringify(body),
        })

        return handler(newRequest as NextRequest)
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }
    }
  }
}
