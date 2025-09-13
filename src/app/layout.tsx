import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
// import { Archivo } from "next/font/google"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})
// const archivoFont = Archivo({
//   variable: "--font-archivo",
//   subsets: ["latin"],
//   weight: "100",
//   fallback: ["Arial", "sans-serif"],
//   display: "swap",
// })

export const metadata: Metadata = {
  title: "TaNaRi-Chan",
  description: "",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-custom-bg bg-tile`}
      >
        {children}
      </body>
    </html>
  )
}
