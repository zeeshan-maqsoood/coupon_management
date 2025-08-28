"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const recentActivities = [
  {
    id: 1,
    user: "John Doe",
    action: "Created new coupon",
    target: "SUMMER20 - 20% Off Summer Sale",
    time: "2 minutes ago",
    type: "coupon",
  },
  {
    id: 2,
    user: "Jane Smith",
    action: "Updated store",
    target: "Amazon Store - Added new tracking link",
    time: "15 minutes ago",
    type: "store",
  },
  {
    id: 3,
    user: "Mike Johnson",
    action: "Added new category",
    target: "Electronics - Consumer electronics category",
    time: "1 hour ago",
    type: "category",
  },
  {
    id: 4,
    user: "Sarah Wilson",
    action: "Created user account",
    target: "editor@example.com - Editor role",
    time: "2 hours ago",
    type: "user",
  },
  {
    id: 5,
    user: "Tom Brown",
    action: "Expired coupon",
    target: "WINTER10 - Winter discount expired",
    time: "3 hours ago",
    type: "coupon",
  },
]

const getTypeColor = (type: string) => {
  switch (type) {
    case "coupon":
      return "bg-blue-100 text-blue-800"
    case "store":
      return "bg-green-100 text-green-800"
    case "category":
      return "bg-purple-100 text-purple-800"
    case "user":
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>
                  {activity.user
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">{activity.user}</p>
                  <Badge variant="secondary" className={getTypeColor(activity.type)}>
                    {activity.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activity.action}: <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
