import * as grpc from "@grpc/grpc-js"
import * as protoLoader from "@grpc/proto-loader"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { env } from "../env.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PROTO_PATH = path.join(
  __dirname,
  "../../../../packages/proto/shortcode.proto"
)

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const shortcodeProto = grpc.loadPackageDefinition(packageDefinition)
  .shortcode as any

const SERVICE_URL = env.URL_GENERATION_SERVICE_URL

export class ShortCodeService {
  private client: any

  constructor() {
    this.client = new shortcodeProto.ShortCodeService(
      SERVICE_URL,
      grpc.credentials.createInsecure()
    )
  }

  public getCode(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.GetShortCode({}, (error: any, response: any) => {
        if (error) {
          reject(error)
        } else {
          resolve(response.code)
        }
      })
    })
  }
}

export const shortCodeService = new ShortCodeService()
