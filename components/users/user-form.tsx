"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface UserFormProps {
  user?: any
  onSuccess?: () => void
  onCancel?: () => void
}

const AVAILABLE_PERMISSIONS = [
  "users.create",
  "users.read",
  "users.update",
  "users.delete",
  "stores.create",
  "stores.read",
  "stores.update",
  "stores.delete",
  "coupons.create",
  "coupons.read",
  "coupons.update",
  "coupons.delete",
  "categories.create",
  "categories.read",
  "categories.update",
  "categories.delete",
]

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "editor",
    permissions: user?.permissions || [],
    status: user?.status || "active",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = user ? `/api/users/${user._id}` : "/api/users"
      const method = user ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `User ${user ? "updated" : "created"} successfully`,
        })
        onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked ? [...prev.permissions, permission] : prev.permissions.filter((p) => p !== permission),
    }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{user ? "Edit User" : "Create New User"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password {user && "(leave blank to keep current)"}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required={!user}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Checkbox
                    id={permission}
                    checked={formData.permissions.includes(permission)}
                    onCheckedChange={(checked) => handlePermissionChange(permission, checked as boolean)}
                  />
                  <Label htmlFor={permission} className="text-sm font-normal">
                    {permission}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : user ? "Update User" : "Create User"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
