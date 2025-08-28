"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Pencil, Trash2, Plus, Search, ExternalLink } from "lucide-react"
import StoreForm from "./store-form"

export default function StoresList() {
  const { toast } = useToast()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingStore, setEditingStore] = useState(null)

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/stores")
      const result = await response.json()
      if (result.success) {
        setStores(result.data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch stores",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStores()
  }, [])

  const handleDelete = async (storeId: string) => {
    if (!confirm("Are you sure you want to delete this store?")) return

    try {
      const response = await fetch(`/api/stores?id=${storeId}`, {
        method: "DELETE",
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Store deleted successfully",
        })
        fetchStores()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete store",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete store",
        variant: "destructive",
      })
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingStore(null)
    fetchStores()
  }

  const filteredStores = stores.filter(
    (store: any) =>
      store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.storeHeading.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.network.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.slug && store.slug.toLowerCase().includes(searchTerm.toLowerCase())),
  )
  
  // Log store data to console for debugging
  console.log('Store Data:', stores)

  if (showForm) {
    return (
      <StoreForm
        store={editingStore}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false)
          setEditingStore(null)
        }}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Store Management</CardTitle>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Store
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading stores...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Store Link</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.map((store: any) => (
                  <TableRow key={store._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {store.logoImage && (
                          <img
                            src={store.logoImage || "/placeholder.svg"}
                            alt={store.storeThumbAlt}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{store.storeName}</div>
                          <div className="text-sm text-muted-foreground">{store.storeHeading}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{store.network}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="secondary">{store.primaryCategory?.name}</Badge>
                        <div className="text-xs text-muted-foreground">{store.subCategory?.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{store.network}</TableCell>
                    <TableCell>
                      <Badge variant={store.status === "enable" ? "default" : "secondary"}>
                        {store.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <div className="flex flex-col gap-1">
                        {/* {store.slug ? (
                          <span className="text-sm font-medium">/{store.slug}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No slug found</span>
                        )} */}
                        {store.websiteUrl ? (
                          <a
                            href={`${store.websiteUrl}?${store.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* {store.websiteUrl}/{store.slug} */}
                           
                            <ExternalLink className="h-6 w-6 ml-1" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">No website URL</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingStore(store)
                            setShowForm(true)
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(store._id)}>
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
