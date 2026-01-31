import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SplitClient } from './split-client'

export default async function SplitPage({
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
        where: { isValid: true },
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

  const assignments = await prisma.itemAssignment.findMany({
    where: { lineItem: { receiptId } },
  })

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8 max-w-6xl">
        <Link
          href={`/groups/${id}/receipts/${receiptId}`}
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Review
        </Link>

        <SplitClient
          receipt={JSON.parse(JSON.stringify(receipt))}
          initialAssignments={JSON.parse(JSON.stringify(assignments))}
        />
      </main>
    </div>
  )
}
