import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ReceiptReviewClient } from './receipt-review-client'

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string; receiptId: string }>
}) {
  const session = await requireAuth()
  const { id, receiptId } = await params

  const receipt = await prisma.receipt.findFirst({
    where: {
      id: receiptId,
      groupId: id,
      group: { userId: session.user.id },
    },
    include: {
      lineItems: {
        orderBy: { sortOrder: 'asc' },
      },
      payer: true,
      group: {
        include: {
          members: { orderBy: { createdAt: 'asc' } },
        },
      },
    },
  })

  if (!receipt) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8 max-w-2xl">
        <Link
          href={`/groups/${id}`}
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to {receipt.group.name}
        </Link>

        <ReceiptReviewClient receipt={JSON.parse(JSON.stringify(receipt))} />
      </main>
    </div>
  )
}
