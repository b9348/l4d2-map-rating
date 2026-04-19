import { Navbar } from '@/components/Navbar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </>
  )
}
