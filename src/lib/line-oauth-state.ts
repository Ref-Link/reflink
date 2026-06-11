import { randomBytes, createHmac } from 'node:crypto'

function stateSecret(): string {
  return process.env.LINE_STATE_SECRET ?? process.env.LINE_LOGIN_CHANNEL_SECRET!
}

// State format: <nonce>.<hmac>.<base64url(next)>
// Self-contained: no cookie needed to verify, surviving iOS app-to-browser context switches.
export function buildState(next: string): string {
  const nonce = randomBytes(16).toString('hex')
  const sig = createHmac('sha256', stateSecret()).update(nonce).digest('hex')
  return `${nonce}.${sig}.${Buffer.from(next).toString('base64url')}`
}

export function verifyState(state: string): { valid: boolean; next: string } {
  const parts = state.split('.')
  if (parts.length !== 3) return { valid: false, next: '/profile' }
  const [nonce, sig, nextB64] = parts
  const expected = createHmac('sha256', stateSecret()).update(nonce).digest('hex')
  if (sig !== expected) return { valid: false, next: '/profile' }
  try {
    return { valid: true, next: Buffer.from(nextB64, 'base64url').toString() }
  } catch {
    return { valid: false, next: '/profile' }
  }
}
