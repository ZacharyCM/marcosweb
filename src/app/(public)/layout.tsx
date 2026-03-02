export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
      <footer className="border-t py-4 text-center text-sm text-gray-500">
        For adults 21+ only. For use where legal.
      </footer>
    </div>
  )
}
