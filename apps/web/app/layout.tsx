import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@workspace/ui/styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TinyURL | Premium URL Shortener",
  description: "Fast, secure, and minimal URL shortener",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
