// Manual type definitions (until Prisma client is generated)

export interface User {
  id: string
  name: string | null
  email: string
  emailVerified: Date | null
  image: string | null
  splitwiseToken: string | null
  splitwiseUserId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Group {
  id: string
  name: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Member {
  id: string
  name: string
  groupId: string
  splitwiseUserId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Receipt {
  id: string
  groupId: string
  payerId: string | null  // Member who paid for this receipt
  imageUrl: string | null
  merchantName: string | null
  receiptDate: Date | null
  subtotal: number | null
  tax: number | null
  tip: number | null
  total: number | null
  taxStrategy: TaxTipStrategy
  tipStrategy: TaxTipStrategy
  status: ReceiptStatus
  rawExtraction: unknown
  createdAt: Date
  updatedAt: Date
}

export interface LineItem {
  id: string
  receiptId: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  confidence: ConfidenceLevel
  confidenceReason: string | null
  isValid: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface ItemAssignment {
  id: string
  lineItemId: string
  memberId: string
  shareNumerator: number
  shareDenominator: number
  createdAt: Date
  updatedAt: Date
}

export interface Settlement {
  id: string
  receiptId: string
  memberId: string
  itemsTotal: number
  taxShare: number
  tipShare: number
  finalAmount: number
  createdAt: Date
  updatedAt: Date
}

export type ReceiptStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'REVIEW'
  | 'SPLITTING'
  | 'SETTLED'
  | 'EXPORTED'

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW'

export type TaxTipStrategy = 'PROPORTIONAL' | 'EQUAL'

// Extended types with relations
export interface GroupWithMembers extends Group {
  members: Member[]
}

export interface GroupWithRelations extends GroupWithMembers {
  receipts: Receipt[]
}

export interface ReceiptWithItems extends Receipt {
  lineItems: LineItem[]
}
