"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Pencil, Trash2, Plus, Search } from "lucide-react"
import CategoryForm from "./category-form"
import SubCategoryForm from "./subcategory-form"

export default function CategoriesManagement() {
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingSubCategory, setEditingSubCategory] = useState(null)

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const result = await response.json()
      if (result.success) {
        setCategories(result.data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      })
    }
  }

  const fetchSubCategories = async () => {
    try {
      const response = await fetch("/api/subcategories")
      const result = await response.json()
      if (result.success) {
        setSubcategories(result.data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch subcategories",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchSubCategories()
  }, [])

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Category deleted successfully",
        })
        fetchCategories()
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
        description: "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSubCategory = async (subcategoryId: string) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return

    try {
      const response = await fetch(`/api/subcategories/${subcategoryId}`, {
        method: "DELETE",
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: "Subcategory deleted successfully",
        })
        fetchSubCategories()
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
        description: "Failed to delete subcategory",
        variant: "destructive",
      })
    }
  }

  const handleCategoryFormSuccess = () => {
    setShowCategoryForm(false)
    setEditingCategory(null)
    fetchCategories()
  }

  const handleSubCategoryFormSuccess = () => {
    setShowSubCategoryForm(false)
    setEditingSubCategory(null)
    fetchSubCategories()
  }

  const filteredCategories = categories.filter((category: any) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredSubCategories = subcategories.filter(
    (subcategory: any) =>
      subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcategory.categoryId?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (showCategoryForm) {
    return (
      <CategoryForm
        category={editingCategory}
        onSuccess={handleCategoryFormSuccess}
        onCancel={() => {
          setShowCategoryForm(false)
          setEditingCategory(null)
        }}
      />
    )
  }

  if (showSubCategoryForm) {
    return (
      <SubCategoryForm
        subcategory={editingSubCategory}
        onSuccess={handleSubCategoryFormSuccess}
        onCancel={() => {
          setShowSubCategoryForm(false)
          setEditingSubCategory(null)
        }}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Management</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Categories</h3>
              <Button onClick={() => setShowCategoryForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading categories...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category: any) => (
                      <TableRow key={category._id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                        <TableCell>{category.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={category.status === "active" ? "default" : "secondary"}>
                            {category.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCategory(category)
                                setShowCategoryForm(true)
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(category._id)}>
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
          </TabsContent>

          <TabsContent value="subcategories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Subcategories</h3>
              <Button onClick={() => setShowSubCategoryForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Subcategory
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading subcategories...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Parent Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubCategories.map((subcategory: any) => (
                      <TableRow key={subcategory._id}>
                        <TableCell className="font-medium">{subcategory.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{subcategory.categoryId?.name}</Badge>
                        </TableCell>
                        <TableCell>{subcategory.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={subcategory.status === "active" ? "default" : "secondary"}>
                            {subcategory.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingSubCategory(subcategory)
                                setShowSubCategoryForm(true)
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteSubCategory(subcategory._id)}
                            >
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
