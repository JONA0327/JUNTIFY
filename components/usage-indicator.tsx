"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"

export function UsageIndicator() {
  const [usageData, setUsageData] = useState<{ used: number; limit: number; remaining: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsageData() {
      try {
        setLoading(true)

        const response = await fetch("/api/user/usage", { credentials: "include" })

        if (!response.ok) {
          throw new Error("Failed to fetch usage data")
        }

        const data = await response.json()
        setUsageData(data)
      } catch (err) {
        console.error("Error fetching usage data:", err)
        setError("Could not load usage data")
        // Set default values
        setUsageData({ used: 0, limit: 10, remaining: 10 })
      } finally {
        setLoading(false)
      }
    }

    fetchUsageData()
  }, [])

  if (loading) {
    return (
      <div className="p-4 bg-blue-800/30 border border-blue-700/30 rounded-lg animate-pulse">
        <div className="h-4 bg-blue-700/50 rounded w-24 mb-2"></div>
        <div className="h-2 bg-blue-700/50 rounded w-full"></div>
      </div>
    )
  }

  if (error || !usageData) {
    return null
  }

  const percentage = Math.round((usageData.used / usageData.limit) * 100)

  return (
    <div className="p-4 bg-blue-800/30 border border-blue-700/30 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-blue-200">Monthly Analysis Usage</span>
        <span className="text-sm font-medium text-blue-100">
          {usageData.used}/{usageData.limit}
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-2 bg-blue-700/30"
        indicatorClassName={percentage >= 80 ? "bg-red-500" : "bg-blue-500"}
      />
      <div className="mt-2 text-xs text-blue-300">{usageData.remaining} analyses remaining this month</div>
    </div>
  )
}
