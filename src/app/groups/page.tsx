import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/header'
import Link from 'next/link'
import { Plus, Users, Receipt, ChevronRight } from 'lucide-react'
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
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Your Groups</h1>
          <Link
            href="/groups/new"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Group
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h2>
            <p className="text-gray-500 mb-6">
              Create your first group to start splitting receipts
            </p>
            <Link
              href="/groups/new"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Group
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group: GroupWithRelations) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="bg-white rounded-xl border p-5 hover:border-emerald-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {group.members.length} members
                      </span>
                      <span className="flex items-center gap-1">
                        <Receipt className="h-4 w-4" />
                        {group.receipts.length} receipts
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
