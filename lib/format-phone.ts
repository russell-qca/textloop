/**
 * Formats a phone number to (XXX) XXX-XXXX format
 * @param phone - Raw phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')

  // Limit to 10 digits
  const limited = cleaned.substring(0, 10)

  // Format based on length
  if (limited.length === 0) return phone // Return original if no digits
  if (limited.length <= 3) return `(${limited})`
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
  if (limited.length === 10) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
  }

  // If it's not 10 digits, return original
  return phone
}
