import { getSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Receipt, Camera, Users, Calculator, ArrowRight } from 'lucide-react'

export default async function Home() {
  const session = await getSession()

  // If logged in, redirect to dashboard
  if (session?.user) {
    redirect('/groups')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Receipt className="h-6 w-6 text-emerald-600" />
            <span>ReceiptSplit</span>
          </div>
          <Link
            href="/login"
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Split bills <span className="text-emerald-600">the smart way</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload a receipt photo, let AI extract the items, then assign who had what.
            Fair splits, down to the penny.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Get Started <ArrowRight className="h-5 w-5" />
          </Link>
        </section>

        {/* Features */}
        <section className="bg-white border-y py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold mb-2">1. Upload receipt</h3>
                <p className="text-gray-600 text-sm">
                  Take a photo or upload an image of your receipt
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold mb-2">2. Assign items</h3>
                <p className="text-gray-600 text-sm">
                  AI extracts items. You assign who had what.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold mb-2">3. See who owes what</h3>
                <p className="text-gray-600 text-sm">
                  Get fair splits with tax and tip included
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-500">
        <p>Built for splitting bills fairly</p>
      </footer>
    </div>
  )
}
