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

interface StoreFormProps {
  store?: any
  onSuccess?: () => void
  onCancel?: () => void
}

const NETWORKS = [
  "Commission Junction",
  "ShareASale",
  "ClickBank",
  "Amazon Associates",
  "Impact",
  "Rakuten",
  "PartnerStack",
  "Direct Affiliate",
]

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "India",
  "Japan",
  "Brazil",
  "Mexico",
]

export default function StoreForm({ store, onSuccess, onCancel }: StoreFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [filteredSubcategories, setFilteredSubcategories] = useState([])

  const [formData, setFormData] = useState({
    storeName: store?.storeName || "",
    storeHeading: store?.storeHeading || "",
    network: store?.network || "",
    primaryCategory: store?.primaryCategory?._id || store?.primaryCategory || "",
    subCategory: store?.subCategory?._id || store?.subCategory || "",
    country: store?.country || "",
    trackingLink: store?.trackingLink || "",
    storeThumbAlt: store?.storeThumbAlt || "",
    metaTitle: store?.metaTitle || "",
    metaKeywords: store?.metaKeywords || "",
    metaDescription: store?.metaDescription || "",
    status: store?.status || "enable",
    impressionCode: store?.impressionCode || "",
    storeDescription: store?.storeDescription || "",
    moreAboutStore: store?.moreAboutStore || "",
    logoImage: store?.logoImage || "",
    thumbnailImage: store?.thumbnailImage || "",
  })

  useEffect(() => {
    fetchCategories()
    fetchSubcategories()
  }, [])

  useEffect(() => {
    if (formData.primaryCategory) {
      const filtered = subcategories.filter(
        (sub: any) => sub.categoryId._id === formData.primaryCategory && sub.status === "active",
      )
      setFilteredSubcategories(filtered)

      // Reset subcategory if it doesn't belong to selected category
      if (formData.subCategory) {
        const isValidSubcategory = filtered.some((sub: any) => sub._id === formData.subCategory)
        if (!isValidSubcategory) {
          setFormData((prev) => ({ ...prev, subCategory: "" }))
        }
      }
    } else {
      setFilteredSubcategories([])
      setFormData((prev) => ({ ...prev, subCategory: "" }))
    }
  }, [formData.primaryCategory, subcategories])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const result = await response.json()
      if (result.success) {
        setCategories(result.data.filter((cat: any) => cat.status === "active"))
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const fetchSubcategories = async () => {
    try {
      const response = await fetch("/api/subcategories")
      const result = await response.json()
      if (result.success) {
        setSubcategories(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch subcategories:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = store ? `/api/stores/${store._id}` : "/api/stores"
      const method = store ? "PUT" : "POST"

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
          description: `Store ${store ? "updated" : "created"} successfully`,
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{store ? "Edit Store" : "Create New Store"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, storeName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeHeading">Store Heading *</Label>
                <Input
                  id="storeHeading"
                  value={formData.storeHeading}
                  onChange={(e) => setFormData((prev) => ({ ...prev, storeHeading: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Network *</Label>
                <Select
                  value={formData.network}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, network: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    {NETWORKS.map((network) => (
                      <SelectItem key={network} value={network}>
                        {network}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Country *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Category Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Category Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Category *</Label>
                <Select
                  value={formData.primaryCategory}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, primaryCategory: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: any) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory *</Label>
                <Select
                  value={formData.subCategory}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, subCategory: value }))}
                  required
                  disabled={!formData.primaryCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubcategories.map((subcategory: any) => (
                      <SelectItem key={subcategory._id} value={subcategory._id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Links and SEO */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Links and SEO</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trackingLink">Tracking Link *</Label>
                <Input
                  id="trackingLink"
                  type="url"
                  value={formData.trackingLink}
                  onChange={(e) => setFormData((prev) => ({ ...prev, trackingLink: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeThumbAlt">Store Thumb Alt *</Label>
                <Input
                  id="storeThumbAlt"
                  value={formData.storeThumbAlt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, storeThumbAlt: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title *</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Meta Keywords *</Label>
                <Input
                  id="metaKeywords"
                  value={formData.metaKeywords}
                  onChange={(e) => setFormData((prev) => ({ ...prev, metaKeywords: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description *</Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                rows={3}
                required
              />
            </div>
          </div>

          {/* Status and Code */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Status and Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Store Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enable">Enable</SelectItem>
                    <SelectItem value="disable">Disable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="impressionCode">Impression Code</Label>
                <Input
                  id="impressionCode"
                  value={formData.impressionCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, impressionCode: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Content</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeDescription">Store Description *</Label>
                <Textarea
                  id="storeDescription"
                  value={formData.storeDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, storeDescription: e.target.value }))}
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moreAboutStore">More About Store *</Label>
                <Textarea
                  id="moreAboutStore"
                  value={formData.moreAboutStore}
                  onChange={(e) => setFormData((prev) => ({ ...prev, moreAboutStore: e.target.value }))}
                  rows={4}
                  required
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logoImage">Logo Image URL</Label>
                <Input
                  id="logoImage"
                  type="url"
                  value={formData.logoImage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, logoImage: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnailImage">Thumbnail Image URL</Label>
                <Input
                  id="thumbnailImage"
                  type="url"
                  value={formData.thumbnailImage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, thumbnailImage: e.target.value }))}
                  placeholder="https://example.com/thumbnail.png"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : store ? "Update Store" : "Create Store"}
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
