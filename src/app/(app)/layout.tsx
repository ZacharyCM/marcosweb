import { SanityLive } from "@/sanity/lib/live"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SanityLive />
    </>
  )
}
