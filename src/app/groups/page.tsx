import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/header'
import Link from 'next/link'
import { Plus, Users, Receipt, ChevronRight, Sparkles } from 'lucide-react'
import type { Group, Member } from '@/types'

type GroupWithRelations = Group & {
  members: Member[]
  receipts: { id: string }[]
}

export default async function GroupsPage() {
  const session = await requireAuth()

  const groups = await prisma.group.findMany({
    where: { userId: session.user.id },
    include: {
      members: true,
      receipts: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-down">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Your Groups</h1>
            <p className="text-[var(--text-secondary)] mt-1">Manage your bill splitting groups</p>
          </div>
          <Link href="/groups/new" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            New Group
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="card p-12 text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-[var(--primary)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No groups yet</h2>
            <p className="text-[var(--text-secondary)] mb-8 max-w-sm mx-auto">
              Create your first group to start splitting receipts with friends
            </p>
            <Link href="/groups/new" className="btn btn-primary">
              <Plus className="h-4 w-4" />
              Create Your First Group
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {groups.map((group: GroupWithRelations) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="card card-interactive p-6 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-6 w-6 text-[var(--primary)]" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 group-hover:text-[var(--primary)] transition-colors">
                  {group.name}
                </h3>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <Users className="h-4 w-4" />
                    {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                  </span>
                  <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <Receipt className="h-4 w-4" />
                    {group.receipts.length} {group.receipts.length === 1 ? 'receipt' : 'receipts'}
                  </span>
                </div>

                {/* Member avatars */}
                <div className="flex items-center mt-4 -space-x-2">
                  {group.members.slice(0, 4).map((member: Member, i: number) => (
                    <div
                      key={member.id}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white text-xs font-medium ring-2 ring-[var(--surface)]"
                      style={{ zIndex: 4 - i }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {group.members.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-hover)] flex items-center justify-center text-[var(--text-muted)] text-xs font-medium ring-2 ring-[var(--surface)]">
                      +{group.members.length - 4}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
