"use client"

import { useEffect, useState } from "react"
import StatsCard from "@/components/admin/stats-card"
import RecentActivity from "@/components/admin/recent-activity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Store, Tag, Ticket, Plus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { fetchWithAuth } from "@/lib/api-utils"

interface DashboardStats {
  overview: {
    users: number
    stores: number
    categories: number
    coupons: number
  }
  coupons: {
    active: number
    expired: number
    inactive: number
    total: number
  }
  stores: {
    enabled: number
    disabled: number
    total: number
  }
  users: {
    total: number
    roles: Record<string, number>
  }
  recent: {
    users: number
    stores: number
    coupons: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    overview: {
      users: 0,
      stores: 0,
      categories: 0,
      coupons: 0
    },
    coupons: {
      active: 0,
      expired: 0,
      inactive: 0,
      total: 0
    },
    stores: {
      enabled: 0,
      disabled: 0,
      total: 0
    },
    users: {
      total: 0,
      roles: {}
    },
    recent: {
      users: 0,
      stores: 0,
      coupons: 0
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('Fetching dashboard stats...');
      const response = await fetchWithAuth('/api/dashboard/stats', {
        cache: 'no-store',
      });
      
      console.log('Dashboard stats response:', response);
      
      if (!response) {
        throw new Error('No response from server');
      }

      const responseData = response.data || response;
      console.log('Dashboard stats data:', responseData);
      
      setStats(prevStats => ({
        ...prevStats,
        ...responseData,
        overview: {
          ...prevStats.overview,
          ...(responseData.overview || {})
        },
        coupons: {
          ...prevStats.coupons,
          ...(responseData.coupons || {})
        },
        stores: {
          ...prevStats.stores,
          ...(responseData.stores || {})
        },
        users: {
          ...prevStats.users,
          ...(responseData.users || {})
        },
        recent: responseData.recent || {
          users: 0,
          stores: 0,
          coupons: 0
        }
      }));
      
      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      console.error('Error details:', { error });
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    fetchStats(true);
  };

  if (loading && !isRefreshing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={handleRefresh}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Total Users"
          value={stats.overview.users}
          icon={Users}
          trend={{ value: stats.recent?.users || 0, isPositive: (stats.recent?.users || 0) >= 0 }}
        />
        <StatsCard
          title="Total Stores"
          value={stats.overview.stores}
          icon={Store}
          trend={{ value: stats.recent?.stores || 0, isPositive: (stats.recent?.stores || 0) >= 0 }}
        />
        <StatsCard
          title="Total Coupons"
          value={stats.overview.coupons}
          icon={Tag}
          trend={{ value: stats.recent?.coupons || 0, isPositive: (stats.recent?.coupons || 0) >= 0 }}
        />
        <StatsCard
          title="Categories"
          value={stats.overview.categories}
          icon={Ticket}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" asChild>
              <Link href="/admin/coupons/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Coupon
              </Link>
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/admin/stores/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Store
              </Link>
            </Button>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/admin/categories/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Category
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Active Coupons</p>
              <p className="text-2xl font-bold text-green-600">{stats.coupons?.active || 0}</p>
              <p className="text-xs text-muted-foreground">Currently available</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Expired Coupons</p>
              <p className="text-2xl font-bold text-red-600">{stats.coupons?.expired || 0}</p>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Active Stores</p>
              <p className="text-2xl font-bold text-blue-600">{stats.stores?.enabled || 0}</p>
              <p className="text-xs text-muted-foreground">Out of {stats.stores?.total || 0} total stores</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
