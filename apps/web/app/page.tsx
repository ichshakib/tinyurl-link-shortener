"use client" // Marks this file as a Client Component in Next.js App Router

import { useState, useEffect } from "react"
import { Icon } from "@iconify/react"

// Interface defining the structure of a shortened URL object returned by the API
interface ShortenedUrl {
  shortCode: string
  shortUrl: string
  originalUrl: string
  createdAt: string
  clicks: number
}

export default function Home() {
  // State for the input URL form
  const [url, setUrl] = useState("")
  // State to manage loading status during API requests
  const [loading, setLoading] = useState(false)
  // State to display error messages to the user
  const [error, setError] = useState("")
  // State holding the list of shortened URLs
  const [urls, setUrls] = useState<ShortenedUrl[]>([])
  // State to track which URL was recently copied to clipboard
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Base API URL, defaulting to local server if environment variable is not set
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

  // Function to fetch the list of shortened URLs from the backend API
  const fetchUrls = async () => {
    try {
      const response = await fetch(`${API_URL}/api/urls`)
      const data = await response.json()
      if (data.success) {
        // Format the URLs to ensure shortUrl is a full link
        const formattedUrls = data.urls.map((u: ShortenedUrl) => ({
          ...u,
          shortUrl: u.shortUrl || `${API_URL}/${u.shortCode}`,
        }))
        setUrls(formattedUrls)
      }
    } catch {
      console.error("Failed to fetch URLs")
    }
  }

  // Fetch URLs once when the component mounts
  useEffect(() => {
    fetchUrls()
  }, [])

  // Handler for the URL shortening form submission
  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent the default form submission reload
    setLoading(true) // Show loading state
    setError("") // Clear previous errors

    try {
      // Send a POST request to the API to shorten the given URL
      const response = await fetch(`${API_URL}/api/shorten`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      // Handle non-200 responses
      if (!response.ok) {
        throw new Error(data.error || "Failed to shorten URL")
      }

      // On success: clear input and refresh the list
      setUrl("")
      fetchUrls()
    } catch (err) {
      // Set the error message to display in the UI
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      // Always stop loading, whether successful or failed
      setLoading(false)
    }
  }

  // Utility function to copy the short link to the clipboard
  const copyToClipboard = async (link: string, code: string) => {
    await navigator.clipboard.writeText(link)
    setCopiedCode(code) // Set the copied state to show visual feedback
    // Reset the copied state after 2 seconds
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Handler to delete a URL from the backend
  const deleteUrl = async (code: string) => {
    try {
      await fetch(`${API_URL}/api/urls/${code}`, { method: "DELETE" })
      // Refresh the list after deletion
      fetchUrls()
    } catch {
      console.error("Failed to delete URL")
    }
  }

  return (
    <div className="italic-text-none min-h-screen bg-white font-sans text-slate-800 selection:bg-indigo-100">
      <main className="mx-auto max-w-2xl px-6 py-20">
        
        {/* Header Section */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-bold tracking-tight">TinyURL</h1>
            <p className="text-sm text-slate-500">
              Fast, minimal URL shortening.
            </p>
          </div>
          <a
            href="https://github.com/lwshakib/tinyurl-link-shortener"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 transition-colors hover:text-slate-900"
            title="View on GitHub"
          >
            <Icon icon="mdi:github" className="h-6 w-6" />
          </a>
        </div>
        
        {/* URL Shortener Form Section */}
        <div className="mb-16">
          <form onSubmit={handleShorten} className="flex flex-col gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste your long link here..."
              required
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Processing..." : "Shorten"}
            </button>
          </form>
          {/* Display error message if it exists */}
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>
        
        {/* Recent Links List Section */}
        <div className="space-y-6">
          <h2 className="text-xs font-semibold tracking-wider text-slate-400">
            Recent Links
          </h2>
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {urls.length === 0 ? (
              // Empty state when no URLs exist
              <p className="py-8 text-center text-sm text-slate-400 italic">
                No links generated yet.
              </p>
            ) : (
              // Map over the URLs array and render each item
              urls.map(
                (
                  item // Map over URL array
                ) => (
                  <div
                    key={item.shortCode}
                    className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center"
                  >
                    {" "}
                    {/* Row */}
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 truncate text-sm font-medium text-indigo-600">
                        <a
                          href={item.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {item.shortUrl}
                        </a>
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {item.originalUrl}
                      </p>
                    </div>
                    
                    {/* Actions: Clicks, Copy, Delete */}
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-slate-50 px-2 py-1 text-xs text-slate-400">
                        {item.clicks} clicks
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(item.shortUrl, item.shortCode)
                        }
                        className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                          copiedCode === item.shortCode
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {copiedCode === item.shortCode ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => deleteUrl(item.shortCode)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </main>
      
      {/* Footer Section */}
      <footer className="mx-auto flex max-w-2xl justify-between border-t border-slate-50 px-6 py-10 text-xs text-slate-300">
        <p>© 2024 TinyURL</p>
        <p>Built with pnpm + Next.js</p>
      </footer>
    </div>
  )
}
