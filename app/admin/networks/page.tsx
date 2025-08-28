"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import apiClient from "@/lib/api-client"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format } from "date-fns"
import { Trash2, Edit } from "lucide-react"

interface Network {
  _id: string
  name: string
  slug: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function NetworksPage() {
  const { toast } = useToast()
  const [networks, setNetworks] = useState<Network[]>([])
  const [loading, setLoading] = useState(true)
  const [newNetwork, setNewNetwork] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingNetwork, setEditingNetwork] = useState<Network | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [networkToDelete, setNetworkToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchNetworks = async () => {
    try {
      setLoading(true)
      console.log('Fetching networks...')
      const response = await apiClient.get<Network[]>('/api/networks')
      console.log('Networks response:', response)
      
      if (response.success && response.data) {
        console.log('Setting networks:', response.data)
        setNetworks(Array.isArray(response.data) ? response.data : [])
      } else {
        const errorMsg = response.error || 'Failed to fetch networks'
        console.error('API Error:', errorMsg, response)
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('Error in fetchNetworks:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch networks",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNetworks()
  }, [])

  const handleAddNetwork = async () => {
    const networkName = newNetwork.trim()
    if (!networkName) {
      toast({
        title: "Error",
        description: "Network name cannot be empty",
        variant: "destructive",
      })
      return
    }
    
    setIsAdding(true)
    
    try {
      const response = await apiClient.post<Network>('/api/networks', { 
        name: networkName 
      })
      
      if (response.success) {
        setNewNetwork("")
        toast({
          title: "Success",
          description: response.message || "Network created successfully",
        })
        await fetchNetworks()
      } else {
        throw new Error(response.error || 'Failed to create network')
      }
    } catch (error) {
      console.error('Error in handleAddNetwork:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create network",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleUpdateNetwork = async (networkId: string, name: string) => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Network name cannot be empty",
        variant: "destructive",
      })
      return
    }
    
    try {
      const response = await apiClient.put<Network>('/api/networks', { 
        id: networkId,
        name: name.trim()
      })
      
      if (response.success) {
        setEditingNetwork(null)
        toast({
          title: "Success",
          description: response.message || "Network updated successfully",
        })
        await fetchNetworks()
      } else {
        throw new Error(response.error || 'Failed to update network')
      }
    } catch (error) {
      console.error('Error in handleUpdateNetwork:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update network",
        variant: "destructive",
      })
    }
  }

  const handleDeleteNetwork = async () => {
    if (!networkToDelete) return
    
    setIsDeleting(true)
    
    try {
      const response = await apiClient.delete(`/api/networks?id=${networkToDelete}`)
      
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Network deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        setNetworkToDelete(null)
        await fetchNetworks()
      } else {
        throw new Error(response.error || 'Failed to delete network')
      }
    } catch (error) {
      console.error('Error in handleDeleteNetwork:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete network",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Debug info (remove in production)
  const debugInfo = process.env.NODE_ENV === 'development' && (
    <div className="p-4 bg-gray-100 rounded-lg text-xs text-gray-600 mb-6">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <pre className="whitespace-pre-wrap break-words">
        {JSON.stringify({
          loading,
          isAdding,
          newNetwork,
          networksCount: networks.length,
          hasToken: typeof window !== 'undefined' ? !!localStorage.getItem('auth-token') : false,
          env: {
            nodeEnv: process.env.NODE_ENV,
            apiUrl: process.env.NEXT_PUBLIC_API_URL,
          }
        }, null, 2)}
      </pre>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Network Management</h1>
        <p className="text-muted-foreground">
          Manage affiliate networks for your stores
        </p>
      </div>
      
     

      <Card>
        <CardHeader>
          <CardTitle>Add New Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="network">Network Name</Label>
              <Input
                id="network"
                placeholder="Enter network name"
                value={newNetwork}
                onChange={(e) => setNewNetwork(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNetwork()}
                disabled={isAdding}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAddNetwork} 
                disabled={isAdding || !newNetwork.trim()}
              >
                {isAdding ? "Adding..." : "Add Network"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Networks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : networks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No networks found. Add one above.</p>
          ) : (
            <div className="space-y-2">
              {networks.map((network) => (
                <div key={network._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{network.name}</p>
                    <p className="text-sm text-muted-foreground">{network.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(network.createdAt), 'MMM d, yyyy')}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setEditingNetwork(network)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setNetworkToDelete(network._id)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Network Dialog */}
      <Dialog open={!!editingNetwork} onOpenChange={(open) => !open && setEditingNetwork(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Network</DialogTitle>
            <DialogDescription>
              Update the network name below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editingNetwork?.name || ''}
                onChange={(e) => editingNetwork && setEditingNetwork({...editingNetwork, name: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setEditingNetwork(null)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={() => editingNetwork && handleUpdateNetwork(editingNetwork._id, editingNetwork.name)}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the network and remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setNetworkToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteNetwork}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Network'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
