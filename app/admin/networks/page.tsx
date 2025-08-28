"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import apiClient from "@/lib/api-client"

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

  const fetchNetworks = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<{ data: Network[] }>('/api/networks')
      if (response.success && response.data) {
        setNetworks(response.data)
      } else {
        throw new Error(response.error || 'Failed to fetch networks')
      }
    } catch (error) {
      console.error('Error fetching networks:', error)
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
    if (!newNetwork.trim()) {
      toast({
        title: "Error",
        description: "Network name cannot be empty",
        variant: "destructive",
      })
      return
    }
    
    setIsAdding(true)
    try {
      const response = await apiClient.post<{ data: Network }>('/api/networks', { 
        name: newNetwork 
      })
      
      if (response.success && response.data) {
        setNewNetwork("")
        toast({
          title: "Success",
          description: "Network created successfully",
        })
        await fetchNetworks()
      } else {
        throw new Error(response.error || 'Failed to create network')
      }
    } catch (error) {
      console.error('Error creating network:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create network",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

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
                  <span className="text-sm text-muted-foreground">
                    {new Date(network.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
