import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ReceiptUploadForm } from './receipt-upload-form'

export default async function NewReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  const { id } = await params

  const group = await prisma.group.findFirst({
    where: { id, userId: session.user.id },
    include: {
      members: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!group) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8 max-w-xl">
        <Link
          href={`/groups/${group.id}`}
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to {group.name}
        </Link>

        <ReceiptUploadForm
          group={JSON.parse(JSON.stringify(group))}
        />
      </main>
    </div>
  )
}
