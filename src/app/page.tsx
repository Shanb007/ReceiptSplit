import { getSession } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Receipt, Camera, Users, Calculator, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react'

export default async function Home() {
  const session = await getSession()

  if (session?.user) {
    redirect('/groups')
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="blob w-[600px] h-[600px] bg-[#ff6b35] top-[-200px] right-[-200px] fixed opacity-20" />
      <div className="blob w-[400px] h-[400px] bg-[#4ecdc4] bottom-[-100px] left-[-100px] fixed opacity-20" />

      {/* Header */}
      <header className="glass border-b border-[var(--border)] sticky top-0 z-50 animate-fade-in-down">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-xl">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-[#ff6b35]/20">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <span className="text-[var(--text-primary)]">ReceiptSplit</span>
          </div>
          <Link href="/login" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 relative">
        <section className="container mx-auto px-6 pt-20 pb-32 text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 badge badge-primary mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Bill Splitting
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--text-primary)] mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Split bills with
            <br />
            <span className="gradient-text">zero hassle</span>
          </h1>

          <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Snap a receipt, let AI extract every item, then assign who had what.
            Fair splits calculated instantly, down to the penny.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link href="/login" className="btn btn-primary text-lg px-8 py-4">
              Start Splitting Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary text-lg px-8 py-4">
              See How It Works
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-12 mt-20 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="text-4xl font-bold text-[var(--text-primary)]">10s</div>
              <div className="text-[var(--text-muted)] text-sm mt-1">Average scan time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[var(--text-primary)]">100%</div>
              <div className="text-[var(--text-muted)] text-sm mt-1">Accurate splits</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[var(--text-primary)]">Free</div>
              <div className="text-[var(--text-muted)] text-sm mt-1">To get started</div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--surface)] to-transparent" />
          <div className="container mx-auto px-6 relative">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
                Three steps to fair splits
              </h2>
              <p className="text-[var(--text-secondary)] text-lg">
                No more awkward calculations or arguments
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto stagger-children">
              <div className="card card-interactive p-8 text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff6b35]/10 to-[#ff6b35]/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="h-8 w-8 text-[var(--primary)]" />
                </div>
                <div className="badge badge-muted mb-4">Step 1</div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Snap your receipt</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Take a photo or upload an image. Our AI handles messy receipts, faded text, and weird formats.
                </p>
              </div>

              <div className="card card-interactive p-8 text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4ecdc4]/10 to-[#4ecdc4]/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-[var(--secondary)]" />
                </div>
                <div className="badge badge-muted mb-4">Step 2</div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Assign items</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Tap to assign each item to whoever ordered it. Shared that appetizer? Split it between people.
                </p>
              </div>

              <div className="card card-interactive p-8 text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ffe66d]/20 to-[#ffe66d]/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Calculator className="h-8 w-8 text-[#d4a012]" />
                </div>
                <div className="badge badge-muted mb-4">Step 3</div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Get fair totals</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Tax and tip split proportionally. Everyone sees exactly what they owe. Export to Splitwise.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-6">
                  Built for real-world receipts
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)] mb-1">Smart extraction</h3>
                      <p className="text-[var(--text-secondary)]">AI reads even blurry photos, handwritten notes, and unusual receipt formats.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--secondary)]/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-[var(--secondary)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)] mb-1">You stay in control</h3>
                      <p className="text-[var(--text-secondary)]">Review and edit any extraction. Nothing gets split until you confirm it's right.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#ffe66d]/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-[#d4a012]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)] mb-1">Penny-perfect math</h3>
                      <p className="text-[var(--text-secondary)]">Deterministic rounding ensures totals always match. No missing cents.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="card p-6 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                      <span className="text-[var(--text-primary)]">Margherita Pizza</span>
                      <span className="font-semibold">$18.00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                      <span className="text-[var(--text-primary)]">Caesar Salad</span>
                      <span className="font-semibold">$12.00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
                      <span className="text-[var(--text-primary)]">2x Lemonade</span>
                      <span className="font-semibold">$8.00</span>
                    </div>
                    <div className="flex justify-between items-center pt-3">
                      <span className="font-semibold text-[var(--text-primary)]">Total</span>
                      <span className="font-bold text-lg text-[var(--primary)]">$38.00</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 badge badge-success py-2 px-4 shadow-lg">
                  Extracted in 3s
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="card gradient-bg p-12 text-center text-white max-w-3xl mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to split smarter?</h2>
                <p className="text-white/80 text-lg mb-8">
                  Join thousands who've ditched the calculator app
                </p>
                <Link href="/login" className="btn bg-white text-[var(--primary)] hover:bg-white/90 text-lg px-8 py-4 shadow-xl">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] text-sm">
            <Receipt className="h-4 w-4" />
            <span>ReceiptSplit — Split bills the fair way</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
