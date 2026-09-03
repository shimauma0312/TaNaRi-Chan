const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Convert a date-only value to the canonical representation used by the database.
 * Todo deadlines are calendar dates, not instants in the user's time zone.
 */
export function parseTodoDate(value: string): Date | null {
  const match = DATE_ONLY_PATTERN.exec(value)
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

export function normalizeTodoDate(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

export function formatTodoDate(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10)
}

/** Return today's calendar date in the browser's local time zone. */
export function getLocalToday(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Compare a stored date-only deadline with the user's local calendar day.
 * Calendar fields are selected before converting to UTC midnight, preventing
 * time-zone offsets from turning a deadline on "today" into an overdue item.
 */
export function getTodoDaysFromLocalToday(
  value: Date | string,
  now: Date = new Date(),
): number {
  const deadline = parseTodoDate(formatTodoDate(value))
  const today = parseTodoDate(getLocalToday(now))

  if (!deadline || !today) {
    return Number.NaN
  }

  return Math.round((deadline.getTime() - today.getTime()) / MILLISECONDS_PER_DAY)
}

export function isTodoDateOverdue(value: Date | string, now: Date = new Date()): boolean {
  return getTodoDaysFromLocalToday(value, now) < 0
}

export function isTodoDateNear(
  value: Date | string,
  now: Date = new Date(),
  thresholdDays = 3,
): boolean {
  const days = getTodoDaysFromLocalToday(value, now)
  return days >= 0 && days <= thresholdDays
}

export function isTodoDateBeforeToday(value: Date, now: Date = new Date()): boolean {
  return normalizeTodoDate(value).getTime() < normalizeTodoDate(now).getTime()
}
