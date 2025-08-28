import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
}

export default function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend 
}: StatsCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {trend && (
          <div className="flex items-center mt-2">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              trend.value === 0 
                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' 
                : trend.isPositive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {trend.value > 0 ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : trend.value < 0 ? (
                <ArrowDown className="h-3 w-3 mr-1" />
              ) : (
                <Minus className="h-3 w-3 mr-1" />
              )}
              {Math.abs(trend.value)}%
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              {trend.label || 'vs last period'}
            </span>
          </div>
        )}
        
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
