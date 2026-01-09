export const ROLES = {
  ADMIN: 'ADMIN',
  SUBSCRIBER: 'SUBSCRIBER',
  PRODUCER: 'PRODUCER',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]
