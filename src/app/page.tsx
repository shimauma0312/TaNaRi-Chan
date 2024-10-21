import Link from "next/link"

export default function Home() {
  return (
    <main>
      <div className="h-screen w-screen flex justify-center items-center">
        <Link href="login">Go to Login</Link>
      </div>
    </main>
  )
}
