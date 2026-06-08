export function normalizePhoneNumber(input: string): string {
  return input.replace(/\D/g, '')
}

export function isValidPhoneNumber(normalized: string): boolean {
  return /^0\d{9,10}$/.test(normalized)
}

export function formatPhoneNumber(normalized: string): string {
  if (normalized.length === 11) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`
  }
  if (normalized.length === 10) {
    return `${normalized.slice(0, 2)}-${normalized.slice(2, 6)}-${normalized.slice(6)}`
  }
  return normalized
}
