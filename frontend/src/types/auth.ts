import { Role } from '../constants/roles'

export type AuthPayload = {
  email: string
  password: string
  rememberMe: boolean
}

export type AuthUser = {
  id: string
  name: string
  email: string
  roles: Role[]
}

export type AuthSession = {
  token: string
  expiresAt: number
  user: AuthUser
}

export type AuthApiResponse = {
  code: string
  message: string
  data: AuthSession | false
}
