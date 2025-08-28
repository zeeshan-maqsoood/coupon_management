"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GripVertical, Plus, X } from "lucide-react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const CODE_TYPES = [
  { value: "percentage", label: "Percentage Off" },
  { value: "fixed", label: "Fixed Amount Off" },
  { value: "freeShipping", label: "Free Shipping" },
  { value: "bogo", label: "Buy One Get One" },
]

type Coupon = {
  _id?: string
  couponTitle: string
  couponCode: string
  trackingLink: string
  couponDescription: string
  expiryDate: Date | null
  codeType: "percentage" | "fixed" | "freeShipping" | "bogo"
  status: "active" | "inactive" | "expired"
}

interface CouponSectionProps {
  value: Coupon[]
  onChange: (coupons: Coupon[]) => void
}

function SortableItem({ id, coupon, index, onEdit, onDelete }: {
  id: string
  coupon: Coupon
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    cursor: 'grab',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
    position: 'relative',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded mb-2 bg-white hover:bg-gray-50"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <div className="font-medium">{coupon.couponTitle}</div>
        <div className="text-sm text-gray-500">{coupon.couponCode}</div>
        {coupon.expiryDate && (
          <div className="text-xs text-gray-400">
            Expires: {format(new Date(coupon.expiryDate), 'MMM d, yyyy')}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          Edit
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  )
}

interface FormState {
  couponTitle: string
  couponCode: string
  trackingLink: string
  couponDescription: string
  expiryDate: Date | null
  codeType: 'percentage' | 'fixed' | 'freeShipping' | 'bogo'
  discountPercentage: number
  status: 'active' | 'inactive' | 'expired'
  _id?: string
}

export function CouponSection({ value: coupons, onChange }: CouponSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [localCoupons, setLocalCoupons] = useState<Coupon[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Initialize local state from props
  useEffect(() => {
    setLocalCoupons([...coupons]);
    setHasUnsavedChanges(false);
  }, [coupons]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>({
    couponTitle: '',
    couponCode: '',
    trackingLink: '',
    couponDescription: '',
    expiryDate: null,
    codeType: 'percentage',
    discountPercentage: 10,
    status: 'active',
  })

  // Handle drag end - only updates local state
  const handleDragEnd = (event:DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setIsDragging(false);
      return;
    }
    
    // Find the indices of the dragged and target items
    const oldIndex = localCoupons.findIndex(c => 
      (c._id || `coupon-${localCoupons.indexOf(c)}`) === active.id
    );
    
    const newIndex = localCoupons.findIndex(c => 
      (c._id || `coupon-${localCoupons.indexOf(c)}`) === over.id
    );
    
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      setIsDragging(false);
      return;
    }
    
    // Create a new array with the items reordered
    const newCoupons = arrayMove([...localCoupons], oldIndex, newIndex);
    
    // Update local state only - no parent update
    setLocalCoupons(newCoupons);
    setHasUnsavedChanges(true);
    setIsDragging(false);
  };
  
  // Save the current order to the parent
  const saveOrder = () => {
    // Only call onChange if there are actual changes
    const hasChanges = localCoupons.some((coupon, index) => {
      const originalCoupon = coupons[index];
      return !originalCoupon || coupon._id !== originalCoupon._id;
    });
    
    if (hasChanges) {
      onChange([...localCoupons]);
    }
    setHasUnsavedChanges(false);
  };

  // Cancel any unsaved changes
  const cancelOrderChanges = () => {
    setLocalCoupons([...coupons]);
    setHasUnsavedChanges(false);
  };

  const handleAddCoupon = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any previous errors
    setError(null);
    
    if (!formData.couponTitle || !formData.couponCode) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (formData.codeType === 'percentage' && (!formData.discountPercentage || formData.discountPercentage < 1 || formData.discountPercentage > 100)) {
      setError('Please enter a valid discount percentage between 1-100');
      return;
    }
    
    // Create a new coupon object with all form data
    const newCoupon: Coupon = {
      ...formData,
      expiryDate: formData.expiryDate || null,
      _id: editingIndex !== null ? coupons[editingIndex]?._id : undefined
    }

    if (editingIndex !== null) {
      // Update existing coupon
      const updatedCoupons = [...coupons]
      updatedCoupons[editingIndex] = newCoupon
      onChange(updatedCoupons)
    } else {
      // Add new coupon
      onChange([...coupons, newCoupon])
    }
    
    const resetForm = () => {
      setFormData({
        couponTitle: '',
        couponCode: '',
        trackingLink: '',
        couponDescription: '',
        expiryDate: null,
        codeType: 'percentage',
        discountPercentage: 10,
        status: 'active',
      });
      setError(null);
      setEditingIndex(null);
    };

    resetForm();
    setShowForm(false)
  }

  const handleEdit = (index: number) => {
    const couponToEdit = localCoupons[index];
    setFormData({
      ...couponToEdit,
      discountPercentage: couponToEdit.discountPercentage || 10,
      expiryDate: couponToEdit.expiryDate ? new Date(couponToEdit.expiryDate) : null,
    });
    setEditingIndex(index);
    setShowForm(true);
    setError(null);
  };

  // Alias for handleEdit to match the prop name being used
  const handleEditCoupon = handleEdit;

  const handleDeleteCoupon = (index: number) => {
    const updatedCoupons = coupons.filter((_, i) => i !== index)
    onChange(updatedCoupons)
  }

  const handleExpiryDateSelect = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, expiryDate: date || null, discountPercentage: prev.discountPercentage || 10 }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Coupons</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setShowForm(!showForm)
            if (!showForm) {
              setFormData({
                couponTitle: "",
                couponCode: "",
                trackingLink: "",
                couponDescription: "",
                expiryDate: null,
                codeType: "percentage",
                discountPercentage: 10,
                status: "active",
              })
              setEditingIndex(null)
            }
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Cancel' : 'Add Coupon'}
        </Button>
      </div>

      {showForm && (
        <form 
          onSubmit={(e) => e.preventDefault()}
          className="space-y-4 p-4 border rounded-lg relative"
          onClick={(e) => e.stopPropagation()}
        >
          {error && (
            <div className="bg-red-600 text-white p-4 mb-4 rounded-lg shadow-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-bold">Error</p>
              </div>
              <p className="mt-1">{error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="couponTitle">Coupon Title *</Label>
              <Input
                id="couponTitle"
                value={formData.couponTitle}
                onChange={(e) => setFormData({ ...formData, couponTitle: e.target.value })}
                placeholder="E.g., SUMMER20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="couponCode">Coupon Code *</Label>
              <Input
                id="couponCode"
                value={formData.couponCode}
                onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                placeholder="E.g., SAVE20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trackingLink">Tracking Link</Label>
              <Input
                id="trackingLink"
                value={formData.trackingLink}
                onChange={(e) => setFormData({ ...formData, trackingLink: e.target.value })}
                placeholder="https://example.com/affiliate-link"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeType">Code Type</Label>
              <Select
                value={formData.codeType}
                onValueChange={(value: any) => setFormData({ ...formData, codeType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select code type" />
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

            {/* Percentage Field */}
            <div className={`space-y-2 ${formData.codeType !== 'percentage' ? 'opacity-50' : ''}`}>
              <Label htmlFor="discountPercentage">
                {formData.codeType === 'percentage' ? 'Discount Percentage *' : 'Discount %'}
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    discountPercentage: Math.min(100, Math.max(1, Number(e.target.value) || 1))
                  }))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={formData.codeType !== 'percentage'}
                />
                <span className="text-gray-500">%</span>
              </div>
              {formData.codeType !== 'percentage' && (
                <p className="text-xs text-gray-500 mt-1">
                  Only applicable for Percentage Off coupons
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expiryDate ? (
                      format(formData.expiryDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.expiryDate || undefined}
                    onSelect={handleExpiryDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
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
            <Label htmlFor="couponDescription">Description</Label>
            <Textarea
              id="couponDescription"
              value={formData.couponDescription}
              onChange={(e) => setFormData({ ...formData, couponDescription: e.target.value })}
              placeholder="Enter coupon description"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setEditingIndex(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleAddCoupon(e)
              }}
            >
              {editingIndex !== null ? 'Update Coupon' : 'Add Coupon'}
            </Button>
          </div>
        </form>
      )}

      {hasUnsavedChanges && (
        <div className="flex justify-end gap-2 mb-4">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={cancelOrderChanges}
          >
            Cancel Changes
          </Button>
          <Button 
            type="button" 
            variant="default" 
            size="sm"
            onClick={saveOrder}
          >
            Save Order
          </Button>
        </div>
      )}
      
      {localCoupons.length > 0 ? (
        <div className="space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={() => setIsDragging(true)}
          >
            <SortableContext
              items={localCoupons.map((coupon, i) => coupon._id || `coupon-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              {localCoupons.map((coupon, index) => {
                const id = coupon._id || `coupon-${index}`;
                return (
                  <SortableItem
                    key={id}
                    id={id}
                    coupon={coupon}
                    index={index}
                    onEdit={() => handleEditCoupon(index)}
                    onDelete={() => handleDeleteCoupon(index)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>
      ) : !showForm && localCoupons.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No coupons added yet. Click "Add Coupon" to get started.
        </div>
      ) : null}
    </div>
  )
}