"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface CouponFormProps {
  coupon?: any
  onSuccess?: () => void
  onCancel?: () => void
}

const CODE_TYPES = [
  { value: "percentage", label: "Percentage Off" },
  { value: "fixed", label: "Fixed Amount Off" },
  { value: "freeShipping", label: "Free Shipping" },
  { value: "bogo", label: "Buy One Get One" },
]

export default function CouponForm({ coupon, onSuccess, onCancel }: CouponFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState([])
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(
    coupon?.expiryDate ? new Date(coupon.expiryDate) : undefined,
  )

  const [formData, setFormData] = useState({
    storeId: coupon?.storeId?._id || coupon?.storeId || "",
    couponTitle: coupon?.couponTitle || "",
    couponCode: coupon?.couponCode || "",
    trackingLink: coupon?.trackingLink || "",
    couponDescription: coupon?.couponDescription || "",
    codeType: coupon?.codeType || "percentage",
    status: coupon?.status || "active",
  })

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/stores")
      const result = await response.json()
      if (result.success) {
        setStores(result.data.filter((store: any) => store.status === "enable"))
      }
    } catch (error) {
      console.error("Failed to fetch stores:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!expiryDate) {
      toast({
        title: "Error",
        description: "Please select an expiry date",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const url = coupon ? `/api/coupons/${coupon._id}` : "/api/coupons"
      const method = coupon ? "PUT" : "POST"

      const payload = {
        ...formData,
        expiryDate: expiryDate.toISOString(),
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Coupon ${coupon ? "updated" : "created"} successfully`,
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

  const generateCouponCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    setFormData((prev) => ({ ...prev, couponCode: result }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{coupon ? "Edit Coupon" : "Create New Coupon"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Selection */}
          <div className="space-y-2">
            <Label>Store *</Label>
            <Select
              value={formData.storeId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, storeId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store: any) => (
                  <SelectItem key={store._id} value={store._id}>
                    <div className="flex items-center gap-2">
                      {store.logoImage && (
                        <img
                          src={store.logoImage || "/placeholder.svg"}
                          alt=""
                          className="w-4 h-4 rounded object-cover"
                        />
                      )}
                      {store.storeName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="couponTitle">Coupon Title *</Label>
              <Input
                id="couponTitle"
                value={formData.couponTitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, couponTitle: e.target.value }))}
                required
                placeholder="e.g., 20% Off Summer Sale"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="couponCode">Coupon Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="couponCode"
                  value={formData.couponCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                  required
                  placeholder="SUMMER20"
                />
                <Button type="button" variant="outline" onClick={generateCouponCode}>
                  Generate
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trackingLink">Tracking Link *</Label>
              <Input
                id="trackingLink"
                type="url"
                value={formData.trackingLink}
                onChange={(e) => setFormData((prev) => ({ ...prev, trackingLink: e.target.value }))}
                required
                placeholder="https://example.com/track?code=..."
              />
            </div>
          </div>

          {/* Coupon Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code Type *</Label>
                <Select
                  value={formData.codeType}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, codeType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CODE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
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
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !expiryDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : "Pick an expiry date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="couponDescription">Coupon Description *</Label>
            <Textarea
              id="couponDescription"
              value={formData.couponDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, couponDescription: e.target.value }))}
              rows={4}
              required
              placeholder="Describe the coupon offer, terms, and conditions..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : coupon ? "Update Coupon" : "Create Coupon"}
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
