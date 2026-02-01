/**
 * Splitwise API client — thin wrapper using native fetch.
 */

const SPLITWISE_BASE = 'https://secure.splitwise.com'
const SPLITWISE_API = `${SPLITWISE_BASE}/api/v3.0`

// ── Error types ──────────────────────────────────────────────

export class SplitwiseError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'SplitwiseError'
  }
}

// ── OAuth helpers ────────────────────────────────────────────

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPLITWISE_CLIENT_ID!,
    redirect_uri: process.env.SPLITWISE_REDIRECT_URI!,
    state,
  })
  return `${SPLITWISE_BASE}/oauth/authorize?${params}`
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch(`${SPLITWISE_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.SPLITWISE_CLIENT_ID!,
      client_secret: process.env.SPLITWISE_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.SPLITWISE_REDIRECT_URI!,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new SplitwiseError(
      `Token exchange failed: ${text}`,
      res.status,
    )
  }

  const data = await res.json()
  return data.access_token
}

// ── Authenticated API calls ──────────────────────────────────

async function apiGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${SPLITWISE_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new SplitwiseError(
      `Splitwise API error: ${res.statusText}`,
      res.status,
    )
  }

  return res.json()
}

// ── Types ────────────────────────────────────────────────────

export interface SplitwiseUser {
  id: number
  first_name: string
  last_name: string
  email: string
  picture?: { medium?: string } | null
}

export interface SplitwiseFriend {
  id: number
  first_name: string
  last_name: string
  email: string
  picture?: { medium?: string } | null
}

export interface SplitwiseGroupMember {
  id: number
  first_name: string
  last_name: string
  email: string
  picture?: { medium?: string } | null
}

export interface SplitwiseGroup {
  id: number
  name: string
  members: SplitwiseGroupMember[]
}

// ── User, Friends & Groups ───────────────────────────────────

export async function getCurrentUser(
  token: string,
): Promise<SplitwiseUser> {
  const data = await apiGet<{ user: SplitwiseUser }>(
    token,
    '/get_current_user',
  )
  return data.user
}

export async function getFriends(
  token: string,
): Promise<SplitwiseFriend[]> {
  const data = await apiGet<{ friends: SplitwiseFriend[] }>(
    token,
    '/get_friends',
  )
  return data.friends
}

export async function getGroups(
  token: string,
): Promise<SplitwiseGroup[]> {
  const data = await apiGet<{ groups: SplitwiseGroup[] }>(
    token,
    '/get_groups',
  )
  return data.groups
}

// ── Create Expense ───────────────────────────────────────────

export interface CreateExpenseUser {
  user_id: number
  paid_share: string // e.g. "80.00"
  owed_share: string // e.g. "32.45"
}

export interface CreateExpenseParams {
  cost: string // e.g. "80.00"
  description: string
  date: string // YYYY-MM-DD
  currency_code: string
  group_id?: number
  users: CreateExpenseUser[]
}

export async function createExpense(
  token: string,
  params: CreateExpenseParams,
): Promise<{ id: number }> {
  const body = new URLSearchParams()
  body.set('cost', params.cost)
  body.set('description', params.description)
  body.set('date', params.date)
  body.set('currency_code', params.currency_code)

  if (params.group_id) {
    body.set('group_id', String(params.group_id))
  }

  for (let i = 0; i < params.users.length; i++) {
    const u = params.users[i]
    body.set(`users__${i}__user_id`, String(u.user_id))
    body.set(`users__${i}__paid_share`, u.paid_share)
    body.set(`users__${i}__owed_share`, u.owed_share)
  }

  const res = await fetch(`${SPLITWISE_API}/create_expense`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!res.ok) {
    throw new SplitwiseError(
      `Failed to create expense: ${res.statusText}`,
      res.status,
    )
  }

  const data = await res.json()

  // Splitwise returns { expenses: [...] }
  if (data.expenses && data.expenses.length > 0) {
    return { id: data.expenses[0].id }
  }

  // Some error cases return { errors: {...} }
  if (data.errors) {
    const errMsg =
      typeof data.errors === 'object'
        ? JSON.stringify(data.errors)
        : String(data.errors)
    throw new SplitwiseError(`Splitwise error: ${errMsg}`, 400)
  }

  throw new SplitwiseError('Unexpected Splitwise response', 500)
}
