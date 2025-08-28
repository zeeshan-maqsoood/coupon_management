"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Pencil, Trash2, Plus, Search, Copy, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import CouponForm from "./coupon-form"

export default function CouponsList() {
  const { toast } = useToast()
  const [coupons, setCoupons] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStore, setSelectedStore] = useState("all") // Updated default value
  const [statusFilter, setStatusFilter] = useState("all") // Updated default value
  const [showForm, setShowForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)

  const fetchCoupons = async () => {
    try {
      const url = selectedStore !== "all" ? `/api/coupons?storeId=${selectedStore}` : "/api/coupons"
      const response = await fetch(url)
      const result = await response.json()
      if (result.success) {
        setCoupons(result.data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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

  useEffect(() => {
    fetchStores()
  }, [])

  useEffect(() => {
    fetchCoupons()
  }, [selectedStore])

  const handleDelete = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return

    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: "DELETE",
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Coupon deleted successfully",
        })
        fetchCoupons()
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
        description: "Failed to delete coupon",
        variant: "destructive",
      })
    }
  }

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast({
        title: "Copied!",
        description: "Coupon code copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy coupon code",
        variant: "destructive",
      })
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingCoupon(null)
    fetchCoupons()
  }

  const getStatusVariant = (status: string, expiryDate: string) => {
    const now = new Date()
    const expiry = new Date(expiryDate)

    if (expiry <= now || status === "expired") return "destructive"
    if (status === "active") return "default"
    return "secondary"
  }

  const getStatusText = (status: string, expiryDate: string) => {
    const now = new Date()
    const expiry = new Date(expiryDate)

    if (expiry <= now) return "expired"
    return status
  }

  const filteredCoupons = coupons.filter((coupon: any) => {
    const matchesSearch =
      coupon.couponTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.couponCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.storeId?.storeName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || getStatusText(coupon.status, coupon.expiryDate) === statusFilter

    return matchesSearch && matchesStatus
  })

  if (showForm) {
    return (
      <CouponForm
        coupon={editingCoupon}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false)
          setEditingCoupon(null)
        }}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Coupon Management</CardTitle>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Coupon
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              {stores.map((store: any) => (
                <SelectItem key={store._id} value={store._id}>
                  {store.storeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading coupons...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coupon Title</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Tracking Link</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map((coupon: any) => (
                  <TableRow key={coupon._id}>
                    <TableCell className="font-medium">
                      {coupon.couponTitle}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{coupon.couponCode}</code>
                        <Button size="sm" variant="ghost" onClick={() => handleCopyCode(coupon.couponCode)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <a 
                        href={coupon.trackingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {coupon.trackingLink}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {coupon.codeType === "percentage" && "Percentage"}
                        {coupon.codeType === "fixed" && "Fixed"}
                        {coupon.codeType === "freeShipping" && "Free Ship"}
                        {coupon.codeType === "bogo" && "BOGO"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.codeType === "percentage" ? `${coupon.discountPercentage}%` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{format(new Date(coupon.expiryDate), "MMM dd, yyyy")}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(coupon.status, coupon.expiryDate)}>
                        {getStatusText(coupon.status, coupon.expiryDate)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {coupon.couponDescription}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCoupon(coupon)
                            setShowForm(true)
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(coupon._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
