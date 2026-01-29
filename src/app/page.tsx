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
        <section className="container mx-auto px-6 pt-12 pb-16 text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-1.5 badge badge-primary mb-4">
              <Sparkles className="h-3 w-3" />
              AI-Powered Bill Splitting
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Split bills with
            <br />
            <span className="gradient-text">zero hassle</span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Snap a receipt, let AI extract every item, assign who had what.
            Fair splits calculated instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link href="/login" className="btn btn-primary px-6 py-3">
              Start Splitting Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary px-6 py-3">
              See How It Works
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-10 mt-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)]">10s</div>
              <div className="text-[var(--text-muted)] text-xs mt-0.5">Average scan time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)]">100%</div>
              <div className="text-[var(--text-muted)] text-xs mt-0.5">Accurate splits</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)]">Free</div>
              <div className="text-[var(--text-muted)] text-xs mt-0.5">To get started</div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-14 relative scroll-mt-16">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--surface)] to-transparent" />
          <div className="container mx-auto px-6 relative">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
                Three steps to fair splits
              </h2>
              <p className="text-[var(--text-secondary)]">
                No more awkward calculations or arguments
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto stagger-children">
              <div className="card card-interactive p-6 text-center group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b35]/10 to-[#ff6b35]/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="h-6 w-6 text-[var(--primary)]" />
                </div>
                <div className="badge badge-muted mb-3 text-[10px]">Step 1</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Snap your receipt</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Take a photo or upload an image. Our AI handles messy receipts and weird formats.
                </p>
              </div>

              <div className="card card-interactive p-6 text-center group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4ecdc4]/10 to-[#4ecdc4]/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-[var(--secondary)]" />
                </div>
                <div className="badge badge-muted mb-3 text-[10px]">Step 2</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Assign items</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Tap to assign each item to whoever ordered it. Shared appetizers? Split them.
                </p>
              </div>

              <div className="card card-interactive p-6 text-center group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ffe66d]/20 to-[#ffe66d]/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Calculator className="h-6 w-6 text-[#d4a012]" />
                </div>
                <div className="badge badge-muted mb-3 text-[10px]">Step 3</div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Get fair totals</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Tax and tip split proportionally. Export to Splitwise with one click.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-14">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-10 items-center max-w-4xl mx-auto">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-5">
                  Built for real-world receipts
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-4 w-4 text-[var(--primary)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-0.5">Smart extraction</h3>
                      <p className="text-[var(--text-secondary)] text-sm">AI reads blurry photos, handwritten notes, and unusual formats.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--secondary)]/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 text-[var(--secondary)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-0.5">You stay in control</h3>
                      <p className="text-[var(--text-secondary)] text-sm">Review and edit any extraction. Nothing splits until you confirm.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#ffe66d]/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-[#d4a012]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-0.5">Penny-perfect math</h3>
                      <p className="text-[var(--text-secondary)] text-sm">Deterministic rounding ensures totals always match.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="card p-5 rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
                      <span className="text-[var(--text-primary)] text-sm">Margherita Pizza</span>
                      <span className="font-semibold text-sm">$18.00</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
                      <span className="text-[var(--text-primary)] text-sm">Caesar Salad</span>
                      <span className="font-semibold text-sm">$12.00</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
                      <span className="text-[var(--text-primary)] text-sm">2x Lemonade</span>
                      <span className="font-semibold text-sm">$8.00</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold text-[var(--text-primary)] text-sm">Total</span>
                      <span className="font-bold text-[var(--primary)]">$38.00</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-3 -right-3 badge badge-success py-1.5 px-3 text-xs shadow-lg">
                  Extracted in 3s
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14">
          <div className="container mx-auto px-6">
            <div className="card gradient-bg p-8 text-center text-white max-w-2xl mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Ready to split smarter?</h2>
                <p className="text-white/80 mb-5">
                  Join thousands who've ditched the calculator app
                </p>
                <Link href="/login" className="btn bg-white text-[var(--primary)] hover:bg-white/90 px-6 py-3 shadow-xl">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-5">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[var(--text-muted)] text-xs">
            <Receipt className="h-3.5 w-3.5" />
            <span>ReceiptSplit — Split bills the fair way</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
