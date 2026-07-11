export function correlationId(): string {
  return crypto.randomUUID().split('-')[0]
}

/**
 * Logs the precise failure, returns a vague-but-actionable message plus the
 * correlation ID that ties the two together.
 */
export function reportError(error: unknown, context: string): { message: string; code: string } {
  const code = correlationId()

  console.error(JSON.stringify({
    level: 'error',
    correlation_id: code,
    context,
    type: error instanceof Error ? error.name : 'Unknown',
    message: error instanceof Error ? error.message : String(error),
  }))

  return {
    message: 'Something went wrong. Try again — if it keeps failing, note the code below.',
    code,
  }
}
