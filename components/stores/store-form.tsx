"use client"

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ImagePlus, UploadCloud, X } from "lucide-react"

// Define the Coupon type and props interface
interface Coupon {
  _id?: string;
  couponTitle: string;
  couponCode: string;
  trackingLink: string;
  couponDescription: string;
  expiryDate: Date | null;
  codeType: 'percentage' | 'fixed' | 'freeShipping' | 'bogo';
  status: 'active' | 'inactive' | 'expired';
  discountPercentage?: number;
}

interface CouponSectionProps {
  value: Coupon[];
  onChange: (coupons: Coupon[]) => void;
}

// Dynamically import CouponSection to ensure it's only loaded on the client
const CouponSection = dynamic<CouponSectionProps>(
  () => import('./coupon-section').then(mod => mod.CouponSection as React.ComponentType<CouponSectionProps>),
  { 
    ssr: false,
    loading: () => <div>Loading coupons...</div>
  }
);

interface ImageData {
  url: string;
  file?: File;
  publicId?: string;
}

interface FormData {
  storeName: string;
  slug: string;
  storeHeading: string;
  network: string;
  primaryCategory: string;
  subCategory: string;
  country: string;
  websiteUrl: string;
  trackingLink: string;
  storeThumbAlt: string;
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
  status: string;
  impressionCode: string;
  storeDescription: string;
  moreAboutStore: string;
  logoImage: string;
  logoPublicId: string;
  thumbnailImage: string;
  thumbnailPublicId: string;
  coupons: Array<{
    _id?: string;
    couponTitle: string;
    couponCode: string;
    trackingLink: string;
    couponDescription: string;
    expiryDate: Date | null;
    codeType: 'fixed' | 'percentage' | 'freeShipping' | 'bogo';
    status: 'active' | 'inactive' | 'expired';
    discountPercentage?: number;
  }>;
}

interface StoreFormProps {
  store?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

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
  console.log(store, "store")
  const { toast } = useToast()
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  interface Category {
    _id: string;
    name: string;
    subcategories?: Array<{_id: string, name: string}>;
  }

  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Array<{_id: string, name: string}>>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<Array<{_id: string, name: string}>>([])
  const [networks, setNetworks] = useState<Array<{_id: string, name: string}>>([])

  // Initialize form data with default values
  const [formData, setFormData] = useState<FormData>({
    storeName: '',
    slug: '',
    storeHeading: '',
    network: '',
    primaryCategory: '',
    subCategory: '',
    country: '',
    websiteUrl: '',
    trackingLink: '',
    storeThumbAlt: '',
    metaTitle: '',
    metaKeywords: '',
    metaDescription: '',
    status: 'enable',
    impressionCode: '',
    storeDescription: '',
    moreAboutStore: '',
    logoImage: '',
    logoPublicId: '',
    thumbnailImage: '',
    thumbnailPublicId: '',
    coupons: [],
  })

  // Set initial form data when store prop changes
  useEffect(() => {
    const initializeForm = async () => {
      if (!store) return;

      console.log('Initializing form for store:', store);
      
      try {
        // First, load networks and wait for them to be available
        console.log('Fetching networks...');
        await fetchNetworks();
        console.log('Networks loaded:', networks);
        
        // Then load categories
        await fetchCategories();
        
        // Extract category and subcategory IDs safely
        const getCategoryId = (category: any): string => {
          if (!category) return '';
          if (typeof category === 'string') return category;
          return category._id?.toString() || '';
        };

        const primaryCategoryId = getCategoryId(store.primaryCategory);
        const subCategoryId = getCategoryId(store.subCategory);
        
        console.log('Category IDs:', { primaryCategoryId, subCategoryId });
        
        // Get network value - handle both object and string formats
        let networkValue = '';
        if (store.network) {
          console.log('Original network value:', store.network);
          
          // Ensure we have the latest networks data
          const currentNetworks = networks || [];
          console.log('Available networks:', currentNetworks);
          
          if (typeof store.network === 'object' && store.network !== null) {
            networkValue = store.network._id?.toString() || '';
          } else {
            // If it's a string, try to find matching network by name or ID
            const networkStr = store.network.toString();
            const foundNetwork = currentNetworks.find(n => 
              n._id === networkStr || n.name === networkStr
            );
            networkValue = foundNetwork?._id?.toString() || networkStr;
          }
          console.log('Processed network value:', networkValue);
        }

        console.log("Extracted values - Network:", networkValue, "Category:", primaryCategoryId, "Subcategory:", subCategoryId);

        // Set initial form data with proper types
        const initialData: FormData = {
          storeName: store.storeName || "",
          storeHeading: store.storeHeading || "",
          slug: store.slug || "",
          network: networkValue,
          primaryCategory: primaryCategoryId,
          subCategory: subCategoryId,
          country: store.country || "",
          websiteUrl: store.websiteUrl || "",
          trackingLink: store.trackingLink || "",
          storeThumbAlt: store.storeThumbAlt || "",
          metaTitle: store.metaTitle || "",
          metaKeywords: store.metaKeywords || "",
          metaDescription: store.metaDescription || "",
          status: (store.status as "enable" | "disable") || "enable",
          impressionCode: store.impressionCode || "",
          storeDescription: store.storeDescription || "",
          moreAboutStore: store.moreAboutStore || "",
          logoImage: store.logoImage || "",
          logoPublicId: store.logoPublicId || "",
          thumbnailImage: store.thumbnailImage || "",
          thumbnailPublicId: store.thumbnailPublicId || "",
          coupons: Array.isArray(store.coupons) ? store.coupons : [],
        };

        console.log("Setting initial form data:", initialData);
        
        // Set the form data with the initial values
        setFormData(initialData);
        
        // Load subcategories if we have a primary category
        if (primaryCategoryId) {
          console.log("Loading subcategories for category:", primaryCategoryId);
          try {
            await fetchSubcategories(primaryCategoryId);
          } catch (error) {
            console.error("Error loading subcategories:", error);
          }
        }
      } catch (error) {
        console.error("Error initializing form:", error)
      }
    }

    initializeForm()
  }, [store])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  // Track if component is mounted
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state on client-side only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch data on component mount (client-side only)
  useEffect(() => {
    // Only run on client-side after mount
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Only run on client-side
        if (typeof window === 'undefined') return;
        
        // Fetch categories and networks in parallel
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          return;
        }
        
        const [categoriesRes, networksRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/networks', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);
        
        if (!categoriesRes.ok || !networksRes.ok) {
          throw new Error('Failed to fetch data');
        }
        
        // Parse the JSON responses
        const categoriesResponse = await categoriesRes.json();
        const networksResponse = await networksRes.json();
        
        console.log('Categories API response:', categoriesResponse);
        console.log('Networks API response:', networksResponse);
        
        // Extract data from responses
        const categoriesData = categoriesResponse.success ? categoriesResponse.data : [];
        const networksData = networksResponse.success ? networksResponse.data : [];
        
        console.log('Extracted categories:', categoriesData);
        console.log('Extracted networks:', networksData);
        
        // Ensure we have valid arrays
        const categoriesList = Array.isArray(categoriesData) ? categoriesData : [];
        const networksList = Array.isArray(networksData) ? networksData : [];
        
        console.log('Processed categories:', categoriesList);
        console.log('Processed networks:', networksList);
        
        // Update state with the fetched data
        setCategories(categoriesList);
        setNetworks(networksList);
        
        // If editing a store, load its data after categories and networks are loaded
        if (store?._id) {
          await loadStoreData(store._id);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // toast({
        //   title: 'Error',
        //   description: 'Failed to load required data',
        //   variant: 'destructive',
        // });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isMounted]);

  // Handle subcategory selection when subcategories are loaded or change
  useEffect(() => {
    if (store?.subCategory && subcategories.length > 0) {
      const subCategoryId = store.subCategory._id?.toString() || store.subCategory;
      console.log('Setting subcategory from effect:', subCategoryId);
      if (subCategoryId) {
        setFormData(prev => ({
          ...prev,
          subCategory: subCategoryId
        }));
      }
    }
  }, [subcategories, store?.subCategory])

  // Update filtered subcategories when subcategories or primary category changes
  useEffect(() => {
    if (formData.primaryCategory && subcategories.length > 0) {
      setFilteredSubcategories(subcategories);
      
      // If we're in edit mode and have a subcategory that exists in the loaded subcategories
      if (store?.subCategory) {
        const subCategoryId = store.subCategory._id?.toString() || store.subCategory;
        const subcategoryExists = subcategories.some((sub: any) => 
          sub._id === subCategoryId || sub._id === store.subCategory._id || sub._id === store.subCategory
        );
        
        console.log('Subcategory check:', {
          subCategoryId,
          subcategoryExists,
          subcategories: subcategories.map((s: any) => ({ id: s._id, name: s.name }))
        });

        if (subcategoryExists && formData.subCategory !== subCategoryId) {
          setFormData((prev) => ({ ...prev, subCategory: subCategoryId }))
        }
      }
    } else {
      setFilteredSubcategories([])
    }
  }, [subcategories, formData.primaryCategory, store?.subCategory])

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

  const loadStoreData = async (storeId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`/api/stores/${storeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token and retry
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success) {
              localStorage.setItem('token', refreshData.data.accessToken);
              const retryResponse = await fetch(`/api/stores/${storeId}`, {
                headers: {
                  'Authorization': `Bearer ${refreshData.data.accessToken}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (retryResponse.ok) {
                const storeData = await retryResponse.json();
                return storeData;
              }
            }
          }
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to load store data: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error loading store data:', error);
      throw error;
    }
  };

  const fetchNetworks = async () => {
    try {
      console.log('Fetching networks from API...');
      // Skip if we're on the server
      if (typeof window === 'undefined') return null;
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setNetworks([]);
        return [];
      }
      
      const response = await fetch('/api/networks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, try to refresh it
          try {
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              credentials: 'include'
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              if (refreshData.success) {
                localStorage.setItem('token', refreshData.data.accessToken);
                // Retry the original request with the new token
                const retryResponse = await fetch('/api/networks', {
                  headers: {
                    'Authorization': `Bearer ${refreshData.data.accessToken}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (retryResponse.ok) {
                  const data = await retryResponse.json();
                  const networksData = Array.isArray(data) ? data : [];
                  setNetworks(networksData);
                  return networksData;
                }
              }
            }
          } catch (error) {
            console.error('Error refreshing token:', error);
          }
          // If we get here, refresh failed
          console.error('Session expired. Please log in again.');
          setNetworks([]);
          return [];
        }
        console.error(`Failed to fetch networks: ${response.status} ${response.statusText}`);
        setNetworks([]);
        return [];
      }
      
      const data = await response.json();
      const networksData = Array.isArray(data) ? data : [];
      console.log('Networks API response:', networksData);
      setNetworks(networksData);
      return networksData; // Return the networks data
    } catch (error) {
      console.error('Error fetching networks:', error);
      setErrors(prev => ({ ...prev, network: 'Failed to load networks' }));
      toast({
        title: 'Error',
        description: 'Failed to load networks',
        variant: 'destructive',
      });
      return [];
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      if (!categoryId) {
        setSubcategories([]);
        setFilteredSubcategories([]);
        return [];
      }

      console.log(`Fetching subcategories for category: ${categoryId}`);
      const response = await fetch(`/api/subcategories?categoryId=${categoryId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subcategories: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Subcategories API response:", result);

      // Extract subcategories from the response
      const subcategoriesData = result.success && Array.isArray(result.data) ? result.data : [];
      
      // Filter for active subcategories if needed
      const activeSubcategories = subcategoriesData.filter(
        (subcat: any) => subcat?.status === "active" || subcat?.status === undefined
      );

      console.log("Fetched active subcategories:", activeSubcategories);

      // Update both subcategories states
      setSubcategories(activeSubcategories);
      setFilteredSubcategories(activeSubcategories);

      return activeSubcategories;
    } catch (error) {
      console.error("Failed to fetch subcategories:", error)
      return []
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "thumbnail") => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)

      // Create form data for the upload
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "store_images")

      // Upload to Cloudinary via our API route
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const result = await response.json()

      if (result.success) {
        if (type === "logo") {
          setFormData((prev) => ({ ...prev, logoImage: result.data.url, logoPublicId: result.data.public_id }))
        } else {
          setFormData((prev) => ({ ...prev, thumbnailImage: result.data.url, thumbnailPublicId: result.data.public_id }))
        }

        toast({
          title: "Success",
          description: "Image uploaded successfully",
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  // Handle store name change and auto-generate slug
  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      storeName: value,
      // Generate slug from store name if it's a new store
      slug: !store ? value.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') 
        : prev.slug
    }));
  };

  // Handle manual slug change
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      slug: e.target.value
    }));
  };

  // Handle primary category change
  const handlePrimaryCategoryChange = async (value: string) => {
    // First update the form data to reflect the new category selection
    setFormData((prev) => ({
      ...prev,
      primaryCategory: value,
      subCategory: '' // Reset subcategory when category changes
    }));

    // Then fetch subcategories for the selected category
    if (value) {
      try {
        await fetchSubcategories(value);
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subcategories',
          variant: 'destructive',
        });
      }
    } else {
      // If no category is selected, clear subcategories
      setSubcategories([]);
      setFilteredSubcategories([]);
    }
  };

  // Handle image removal
  const removeImage = (type: 'logo' | 'thumbnail') => {
    if (type === 'logo') {
      setFormData((prev) => ({
        ...prev,
        logoImage: '',
        logoPublicId: ''
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        thumbnailImage: '',
        thumbnailPublicId: ''
      }));
    }
  };

  const uploadImage = async (file: File): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'store_images');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return {
      url: result.data.url,
      publicId: result.data.public_id
    };
  };

  // Handle image upload and preview
  const handleImageUpload = async (file: File, type: 'logo' | 'thumbnail') => {
    if (!file) return;
    
    setUploading(true);
    
    try {
      const result = await uploadImage(file);
      const url = result.url;
      
      if (type === 'logo') {
        setLogoUrl(url);
        setFormData(prev => ({
          ...prev,
          logoImage: url,
          logoPublicId: result.publicId
        }));
      } else {
        setThumbnailUrl(url);
        setFormData(prev => ({
          ...prev,
          thumbnailImage: url,
          thumbnailPublicId: result.publicId
        }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    
    try {
      let logoUrl = formData.logoImage;
      let logoPublicId = formData.logoPublicId;
      let thumbnailUrl = formData.thumbnailImage;
      let thumbnailPublicId = formData.thumbnailPublicId;

      // Validate coupons before submission
      const couponsToSend = (formData.coupons || []).map(({ _id, ...coupon }) => {
        // Ensure required fields are present
        if (!coupon.couponDescription?.trim()) {
          throw new Error('Coupon description is required for all coupons');
        }
        
        return {
          ...coupon,
          couponDescription: coupon.couponDescription.trim(),
          expiryDate: coupon.expiryDate || null,
          discountPercentage: coupon.discountPercentage || 0 // Include discountPercentage with a default of 0 if not provided
        };
      });

      // Prepare the request data
      const requestData = {
        storeName: formData.storeName,
        slug: formData.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        storeHeading: formData.storeHeading || formData.storeName,
        network: formData.network,
        // Convert empty strings to null for category fields
        primaryCategory: formData.primaryCategory || null,
        subCategory: formData.subCategory || null,
        country: formData.country,
        websiteUrl: formData.websiteUrl || '',
        trackingLink: formData.trackingLink || '',
        storeThumbAlt: formData.storeThumbAlt || formData.storeName,
        metaTitle: formData.metaTitle || formData.storeName,
        metaKeywords: formData.metaKeywords || formData.storeName,
        metaDescription: formData.metaDescription || formData.storeDescription || formData.storeName,
        status: formData.status || 'active',
        impressionCode: formData.impressionCode || '',
        storeDescription: formData.storeDescription || '',
        moreAboutStore: formData.moreAboutStore || '',
        logoImage: logoUrl,
        logoPublicId: logoPublicId,
        thumbnailImage: thumbnailUrl,
        thumbnailPublicId: thumbnailPublicId,
        coupons: couponsToSend
      };

      console.log('Submitting store data:', requestData);
      
      const baseUrl = '/api/stores';
      const apiUrl = store ? `${baseUrl}?id=${store._id}` : baseUrl;
      const method = store ? 'PUT' : 'POST';
      
      console.log(`Making ${method} request to:`, apiUrl);
      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'include'
      });

      let result;
      try {
        result = await response.json();
        console.log('API Response:', result);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        const errorMessage = result?.message || result?.error || 'Failed to save store';
        throw new Error(errorMessage);
      }

      toast({
        title: 'Success',
        description: `Store ${store ? 'updated' : 'created'} successfully`,
        variant: 'default',
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error('Error saving store:', error);
      let errorMessage = 'Failed to save store';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{store ? 'Edit Store' : 'Create New Store'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    placeholder="Enter store name"
                    value={formData.storeName}
                    onChange={handleStoreNameChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="slug"
                      placeholder="store-name"
                      value={formData.slug}
                      onChange={handleSlugChange}
                      className="flex-1"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will be part of the store's URL
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="network">Network</Label>
                  <div>
                    {/* Debug info - will be removed later */}
                    <div className="hidden">
                  
                    </div>
                    <Select
                      value={formData.network}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, network: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={networks.length > 0 ? "Select a network" : "Loading networks..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {networks.map((network) => (
                          <SelectItem key={network._id} value={network._id}>
                            {network.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeHeading">Store Heading</Label>
                  <Input
                    id="storeHeading"
                    value={formData.storeHeading}
                    onChange={(e) => setFormData((prev) => ({ ...prev, storeHeading: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => {
                      setFormData({ ...formData, country: value });
                    }}
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
                  <Label>Primary Category</Label>
                  <Select
                    value={formData.primaryCategory}
                    onValueChange={async (value) => {
                      // First update the form data
                      setFormData(prev => ({
                        ...prev,
                        primaryCategory: value,
                        subCategory: '' // Reset subcategory when primary category changes
                      }));
                      
                      // Fetch subcategories for the selected category
                      try {
                        await fetchSubcategories(value);
                      } catch (error) {
                        console.error('Error fetching subcategories:', error);
                        toast({
                          title: 'Error',
                          description: 'Failed to load subcategories for the selected category',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={categories.length > 0 ? "Select a category" : "Loading categories..."}>
                      {categories.find((c) => c._id === formData.primaryCategory)?.name || "Select a category"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sub Category</Label>
                  <Select
                    value={formData.subCategory}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subCategory: value }))}
                    disabled={!formData.primaryCategory || filteredSubcategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={
                          !formData.primaryCategory 
                            ? "Select a category first" 
                            : filteredSubcategories.length === 0 
                              ?  "No subcategories available" 
                              : "Select a subcategory"
                        }
                      >
                        {filteredSubcategories.find((s) => s._id === formData.subCategory)?.name || ""}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubcategories.map((subcategory) => (
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.websiteUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, websiteUrl: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trackingLink">Tracking/Affiliate Link</Label>
                  <Input
                    id="trackingLink"
                    type="url"
                    placeholder="https://example.com/affiliate-link"
                    value={formData.trackingLink}
                    onChange={(e) =>
                      setFormData({ ...formData, trackingLink: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Add your affiliate tracking link
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeThumbAlt">Store Thumbnail Alt Text</Label>
                <Input
                  id="storeThumbAlt"
                  placeholder="Store thumbnail alt text"
                  value={formData.storeThumbAlt}
                  onChange={(e) =>
                    setFormData({ ...formData, storeThumbAlt: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaKeywords">Meta Keywords</Label>
                  <Input
                    id="metaKeywords"
                    value={formData.metaKeywords}
                    onChange={(e) => setFormData((prev) => ({ ...prev, metaKeywords: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                  rows={3}
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
                    onValueChange={(value: 'enable' | 'disable') => 
                      setFormData(prev => ({
                        ...prev,
                        status: value
                      }))
                    }
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
              <div className="space-y-2">
                <Label htmlFor="storeDescription">Store Description</Label>
                <Textarea
                  id="storeDescription"
                  value={formData.storeDescription}
                  onChange={(e) => setFormData({ ...formData, storeDescription: e.target.value })}
                  placeholder="Enter store description"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moreAboutStore">More About Store</Label>
                <Textarea
                  id="moreAboutStore"
                  value={formData.moreAboutStore}
                  onChange={(e) => setFormData((prev) => ({ ...prev, moreAboutStore: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Coupons Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Coupons</h3>
                <CouponSection 
                  value={formData.coupons || []} 
                  onChange={(newCoupons) => {
                    console.log('Coupons changed:', newCoupons);
                    setFormData(prev => {
                      const updated = { ...prev, coupons: newCoupons };
                      console.log('Updated form data with coupons:', updated);
                      return updated;
                    });
                  }}
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Images</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Store Logo</Label>
                    <div className="flex items-center gap-4">
                      {formData.logoImage ? (
                        <div className="relative">
                          <img
                            src={formData.logoImage}
                            alt="Store logo"
                            className="h-20 w-20 rounded-md object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('logo')}
                            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
                        >
                          <ImagePlus className="h-5 w-5 text-gray-400" />
                          <span className="mt-1 text-xs text-gray-500">Upload</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          {formData.logoImage
                            ? "Logo uploaded"
                            : "Upload a square logo (max 2MB)"}
                        </p>
                        {uploading && (
                          <p className="text-xs text-muted-foreground">Uploading...</p>
                        )}
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'logo')
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Store Thumbnail</Label>
                    <div className="flex items-center gap-4">
                      {formData.thumbnailImage ? (
                        <div className="relative">
                          <img
                            src={formData.thumbnailImage}
                            alt="Store thumbnail"
                            className="h-20 w-20 rounded-md object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('thumbnail')}
                            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => thumbnailInputRef.current?.click()}
                          className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
                        >
                          <ImagePlus className="h-5 w-5 text-gray-400" />
                          <span className="mt-1 text-xs text-gray-500">Upload</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          {formData.thumbnailImage
                            ? "Thumbnail uploaded"
                            : "Upload a thumbnail (16:9 ratio recommended)"}
                        </p>
                        {uploading && (
                          <p className="text-xs text-muted-foreground">Uploading...</p>
                        )}
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={thumbnailInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'thumbnail')
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Store'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}