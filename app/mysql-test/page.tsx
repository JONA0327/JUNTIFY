"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle } from "lucide-react"

export default function MySQLTestPage() {
  const [status, setStatus] = useState<{
    connected: boolean
    serverInfo?: string
    tables?: { table: string; count: number }[]
    error?: string
    initialized?: boolean
  }>({
    connected: false,
  })
  const [loading, setLoading] = useState(true)
  const [initLoading, setInitLoading] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/mysql-test")
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      console.error("Error fetching MySQL status:", error)
      setStatus({
        connected: false,
        error: error.message || "Unknown error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  const initDatabase = async () => {
    setInitLoading(true)
    try {
      const res = await fetch("/api/mysql-test/init", {
        method: "POST",
      })
      const data = await res.json()

      if (data.success) {
        await fetchStatus()
      } else {
        setStatus((prev) => ({
          ...prev,
          error: data.error || "Failed to initialize database",
        }))
      }
    } catch (error) {
      console.error("Error initializing database:", error)
      setStatus((prev) => ({
        ...prev,
        error: error.message || "Error initializing database",
      }))
    } finally {
      setInitLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">MySQL Database Test</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>Current status of MySQL database connection</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />
                <span>Testing connection...</span>
              </div>
            ) : status.connected ? (
              <div className="flex items-center space-x-2 text-green-500">
                <CheckCircle className="h-5 w-5" />
                <span>Connected successfully</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-500">
                <AlertCircle className="h-5 w-5" />
                <span>Connection failed</span>
              </div>
            )}

            {status.serverInfo && (
              <div className="mt-4">
                <h3 className="font-medium text-sm text-gray-500 mb-1">Server Information</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">{status.serverInfo}</div>
              </div>
            )}

            {status.error && (
              <div className="mt-4">
                <h3 className="font-medium text-sm text-red-500 mb-1">Error</h3>
                <div className="bg-red-50 border border-red-100 p-3 rounded text-sm text-red-800">{status.error}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
            <CardDescription>Available tables and record counts</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-6 bg-gray-200 rounded w-full" />
                ))}
              </div>
            ) : status.tables && status.tables.length > 0 ? (
              <div className="divide-y">
                {status.tables.map((table, index) => (
                  <div key={index} className="py-2 flex justify-between">
                    <span className="font-mono">{table.table}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 rounded-full text-xs font-medium">
                      {table.count} records
                    </span>
                  </div>
                ))}
              </div>
            ) : status.connected ? (
              <div className="text-center py-4 text-gray-500">
                <p>No tables found or tables are empty</p>
                <button
                  onClick={initDatabase}
                  disabled={initLoading}
                  className={`mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${
                    initLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {initLoading ? "Initializing..." : "Initialize Database"}
                </button>
                {status.initialized && (
                  <div className="mt-3 text-green-500 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>Database initialized successfully</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>Connect to the database first to view tables</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refresh Status</CardTitle>
            <CardDescription>Test the connection again</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Testing..." : "Test Connection"}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
