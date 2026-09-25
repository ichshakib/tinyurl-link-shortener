import type { Request, Response } from "express" // Import Express request and response types for type checking
import { dbPool } from "../lib/db.js" // Import the initialized database connection pool
import { redis } from "../lib/redis.js" // Import the initialized Redis client for caching
import { shortCodeService } from "../lib/ShortCodeService.js" // Import the gRPC service client for generating short codes
import { logger } from "@workspace/logger" // Import the shared logging utility
import { ApiError, ApiResponse, asyncHandler } from "@workspace/utils" // Import shared utility classes and functions for error handling and standard responses

// Helper function to check if a given string is a valid HTTP or HTTPS URL
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url) // Attempt to parse the URL string using the built-in URL class
    // Return true only if the parsed URL uses the http or https protocol
    return urlObj.protocol === "http:" || urlObj.protocol === "https:"
  } catch {
    // If URL parsing throws an error (e.g., malformed URL), return false
    return false
  }
}

// Controller function to handle URL shortening requests, wrapped in asyncHandler to automatically catch any thrown errors and pass them to the global error handler
export const shortenUrl = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body // Extract the 'url' property from the request body

  // Check if the URL property is present
  if (!url) {
    // Throw a 400 Bad Request error if no URL was provided
    throw new ApiError(400, "URL is required")
  }

  // Check if the provided URL is valid
  if (!isValidUrl(url)) {
    // Throw a 400 Bad Request error if the URL format is invalid
    throw new ApiError(400, "Invalid URL format")
  }

  // Request a new unique short code from the gRPC ShortCodeService
  const shortCodeStr = await shortCodeService.getCode()
  
  // Insert the new short code and original URL mapping into the PostgreSQL database
  await dbPool.query(
    "INSERT INTO urls (original_url, short_code) VALUES ($1, $2) RETURNING *",
    [url, shortCodeStr]
  )

  // Cache the mapping in Redis. Key: short code, Value: original URL. 
  // 'EX', 86400 sets an expiration time of 24 hours (86400 seconds)
  await redis.set(shortCodeStr, url, "EX", 86400)
  
  // Add the short code to a Redis Sorted Set ('cache:frequency') with an initial score of 1.
  // This can be used later to track the most frequently accessed URLs.
  await redis.zadd("cache:frequency", 1, shortCodeStr)

  // Send a successful 200 OK response with the shortened URL details
  res.status(200).json({
    success: true, // Indicate the operation was successful
    shortCode: shortCodeStr, // Include the generated short code
    shortUrl: `${req.protocol}://${req.get("host")}/${shortCodeStr}`, // Construct the full shortened URL based on the request's protocol and host
    originalUrl: url, // Include the original URL for reference
  })
})

// Controller function to retrieve all stored URLs, wrapped in asyncHandler
export const getUrls = asyncHandler(async (req: Request, res: Response) => {
  // Query the database to select all records from the 'urls' table, ordered by creation date (newest first)
  const result = await dbPool.query(
    "SELECT * FROM urls ORDER BY created_at DESC"
  )
  
  // Format the raw database rows into a cleaner structure for the API response
  const formattedUrls = result.rows.map((row) => ({
    shortCode: row.short_code, // Map snake_case to camelCase
    originalUrl: row.original_url, // Map snake_case to camelCase
    createdAt: row.created_at, // Map snake_case to camelCase
    clicks: row.clicks, // Pass the click count through
  }))
  
  // Send a successful 200 OK response with the formatted list of URLs
  res.status(200).json({
    success: true,
    urls: formattedUrls,
  })
})

// Controller function to delete a specific URL, wrapped in asyncHandler
export const deleteUrl = asyncHandler(async (req: Request, res: Response) => {
  const { shortCode } = req.params // Extract the short code from the route parameters (e.g., /api/urls/:shortCode)
  const shortCodeStr = shortCode as string // Ensure shortCode is treated as a string
  
  // Execute a database query to delete the URL record matching the given short code
  const result = await dbPool.query("DELETE FROM urls WHERE short_code = $1", [
    shortCodeStr,
  ])

  // Check if any row was actually deleted (rowCount would be 0 if the short code wasn't found)
  if (result.rowCount === 0) {
    // Throw a 404 Not Found error if the URL does not exist in the database
    throw new ApiError(404, "Short URL not found")
  }

  // Remove the URL mapping from the Redis cache
  await redis.del(shortCodeStr)
  // Remove the URL from the frequency tracking Sorted Set in Redis
  await redis.zrem("cache:frequency", shortCodeStr)

  // Send a standard successful response indicating the deletion was completed
  res.json(new ApiResponse(200, null, "URL deleted successfully"))
})

// Controller function to handle redirecting a short code to its original URL, wrapped in asyncHandler
export const redirectUrl = asyncHandler(async (req: Request, res: Response) => {
  const { shortCode } = req.params // Extract the short code from the route parameters (e.g., /:shortCode)
  const shortCodeStr = shortCode as string // Ensure it's typed as a string
  
  // Attempt to retrieve the original URL from the Redis cache first (fast path)
  const cachedUrl = await redis.get(shortCodeStr)

  // If the URL was found in the cache (Cache Hit)
  if (cachedUrl) {
    // Increment the access frequency score for this short code in the Redis Sorted Set by 1
    await redis.zincrby("cache:frequency", 1, shortCodeStr)

    // Background update: Increment the click count in the PostgreSQL database.
    // We don't await this so it doesn't delay the user's redirect.
    dbPool
      .query("UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1", [
        shortCode,
      ])
      .catch((err) => logger.error(`Error updating clicks: ${err}`)) // Catch and log any errors from the background update

    // Immediately redirect the user to the cached original URL
    if (!isValidUrl(cachedUrl)) {
      throw new ApiError(400, "Invalid redirect URL")
    }
    return res.redirect(cachedUrl)
  }

  // If the URL was not in the cache (Cache Miss), query the database
  const result = await dbPool.query(
    "SELECT original_url FROM urls WHERE short_code = $1",
    [shortCode]
  )

  // If the database query returns no rows, the short code is invalid
  if (result.rowCount === 0) {
    // Throw a 404 Not Found error
    throw new ApiError(404, "Short URL not found")
  }

  // Extract the original URL from the database query result
  const originalUrl = result.rows[0].original_url

  // Cache this URL in Redis for future requests, setting an expiration of 24 hours (86400 seconds)
  await redis.set(shortCodeStr, originalUrl, "EX", 86400)
  // Initialize or update its frequency score in the Redis Sorted Set
  await redis.zadd("cache:frequency", 1, shortCodeStr)

  // Update the click count in the database (since we awaited the SELECT query, we await this too, though it could be backgrounded)
  await dbPool.query(
    "UPDATE urls SET clicks = clicks + 1 WHERE short_code = $1",
    [shortCode]
  )

  // Redirect the user to the retrieved original URL
  if (!isValidUrl(originalUrl)) {
    throw new ApiError(400, "Invalid redirect URL")
  }
  res.redirect(originalUrl)
})

// A simple controller function used for health checks to ensure the API is running
export const healthCheck = (req: Request, res: Response) => {
  // Send a 200 OK response with the current timestamp
  res.json(
    new ApiResponse(200, { status: "ok", timestamp: new Date().toISOString() })
  )
}
