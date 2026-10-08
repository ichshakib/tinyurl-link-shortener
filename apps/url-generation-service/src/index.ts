import * as grpc from "@grpc/grpc-js" // Import the gRPC library for Node.js
import * as protoLoader from "@grpc/proto-loader" // Import the library to load .proto files dynamically
import path from "node:path" // Import the Node.js path module for working with file paths
import { fileURLToPath } from "node:url" // Import utility to convert a file URL to a path string
import { nanoid } from "nanoid" // Import nanoid library for generating unique IDs (short codes)
import pg from "pg" // Import the PostgreSQL client for Node.js
const { Pool } = pg // Extract the Pool class from pg for managing database connections
import { logger } from "@workspace/logger" // Import a custom logger from the shared workspace

// Setup necessary variables to resolve the current directory path in an ES module environment
const __filename = fileURLToPath(import.meta.url) // Get the absolute path of the current file
const __dirname = path.dirname(__filename) // Get the directory path of the current file

// Define the absolute path to the shared protocol buffers file
const PROTO_PATH = path.join(
  __dirname, // Current directory
  "../../../packages/proto/shortcode.proto" // Relative path to the .proto file
)

// Load the .proto file with specific options
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, // Preserve field names as they are defined in the .proto file
  longs: String, // Represent long types as Strings to prevent precision loss in JS
  enums: String, // Represent enum types as Strings
  defaults: true, // Set default values for omitted fields
  oneofs: true, // Support oneof fields in the proto definition
})

// Extract the shortcode package definition from the loaded package
const shortcodeProto = grpc.loadPackageDefinition(packageDefinition)
  .shortcode as any

// Initialize a connection pool for the PostgreSQL database
const pool = new Pool({
  // Use the DATABASE_URL environment variable if provided, otherwise fallback to a local URL
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://user:password@localhost:5432/tinyurl",
})

// Configuration for the pool of pre-generated short codes
const CODE_POOL_SIZE = 10 // Set the target size for the pre-generated code pool
const codePool: string[] = [] // Initialize an array to hold the pre-generated short codes
let isRefilling = false // A flag to ensure only one refill operation runs at a time

// Function to check if a generated code is unique across the database and the current pool
async function isCodeUnique(code: string): Promise<boolean> {
  try {
    // Query the database to see if the code already exists
    const res = await pool.query("SELECT 1 FROM urls WHERE short_code = $1", [
      code,
    ])
    // The code is unique if it is not in the database (rowCount === 0) AND not currently in our local codePool
    return res.rowCount === 0 && !codePool.includes(code)
  } catch (error) {
    // Log any errors that occur during the database query
    logger.error(`Error checking code uniqueness: ${error}`)
    // Return false in case of an error to prevent potential collisions
    return false
  }
}

// Function to generate a new unique short code
async function generateUniqueCode(): Promise<string> {
  let code = "" // Variable to hold the generated code
  let unique = false // Flag indicating if the generated code is unique
  // Loop until a unique code is found
  while (!unique) {
    code = nanoid(7) // Generate a random 7-character string using nanoid
    unique = await isCodeUnique(code) // Check if the newly generated string is unique
  }
  return code // Return the unique code
}

// Function to refill the code pool up to its configured size
async function refillPool() {
  // If a refill operation is already in progress, exit early
  if (isRefilling) return
  isRefilling = true // Mark that a refill operation is starting

  try {
    // Continue generating codes until the pool reaches the target size
    while (codePool.length < CODE_POOL_SIZE) {
      const code = await generateUniqueCode() // Generate a unique code
      codePool.push(code) // Add the generated code to the pool
      // Log the generation of a new code for debugging purposes
      logger.debug(
        `[GENERATOR] Generated: ${code}. Pool size: ${codePool.length}`
      )
    }
  } catch (error) {
    // Log any errors that occur during the refilling process
    logger.error(`Error refilling pool: ${error}`)
  } finally {
    isRefilling = false // Reset the refilling flag, regardless of success or error
  }
}

// Handler function for the GetShortCode gRPC method
function getShortCode(call: any, callback: any) {
  // Check if the code pool is empty
  if (codePool.length === 0) {
    // If empty, generate a unique code on-the-fly
    generateUniqueCode().then((code) => {
      // Send the generated code back to the client via the callback
      callback(null, { code })
      // Trigger a refill operation in the background
      refillPool()
    })
    return // Exit the function since we handled the request asynchronously
  }

  // If the pool is not empty, pop the first code from the array
  const code = codePool.shift()
  // Log that a code was served from the pool
  logger.info(`[GENERATOR] Served: ${code}. Remaining: ${codePool.length}`)
  // Send the code back to the client via the callback
  callback(null, { code })
  // Trigger a refill operation in the background to replenish the pool
  refillPool()
}

// Main function to initialize and start the gRPC server
function main() {
  const server = new grpc.Server() // Create a new gRPC server instance
  // Add the ShortCodeService implementation to the server
  server.addService(shortcodeProto.ShortCodeService.service, {
    GetShortCode: getShortCode, // Map the GetShortCode RPC to our handler function
  })

  // Define the address and port where the server will listen
  const address = "0.0.0.0:50051"
  // Bind the server to the address asynchronously using insecure credentials (no TLS)
  server.bindAsync(
    address,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        // If there is an error binding the server, log it and exit
        logger.error(`Failed to bind server: ${err}`)
        return
      }
      // Log that the server has started successfully
      logger.info(`gRPC Server running at ${address}`)
    }
  )
}

// Initially fill the code pool, and then start the gRPC server
refillPool().then(() => main())
