// Shared by signup and password reset, on both the form and the server.
export const MIN_PASSWORD_LENGTH = 8

export function passwordError(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (password.length > 72) return 'Password must be 72 characters or fewer.'
  return null
}
