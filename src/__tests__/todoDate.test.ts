import {
  formatTodoDate,
  getDateInTimeZone,
  getLocalToday,
  getTodoBusinessToday,
  getTodoDaysFromLocalToday,
  isTodoDateBeforeToday,
  isTodoDateNear,
  isTodoDateOverdue,
  normalizeTodoDate,
  parseTodoDate,
} from "@/utils/todoDate"

describe("Todo calendar date utilities", () => {
  test("parses and normalizes valid calendar dates", () => {
    expect(parseTodoDate("2024-02-29")?.toISOString()).toBe("2024-02-29T00:00:00.000Z")
    expect(parseTodoDate("2023-02-29")).toBeNull()
    expect(normalizeTodoDate(new Date("2026-09-03T23:59:59.000Z")).toISOString()).toBe(
      "2026-09-03T00:00:00.000Z",
    )
  })

  test("compares deadlines by calendar day instead of wall-clock time", () => {
    const lateToday = new Date("2026-09-03T23:59:59.000Z")
    expect(isTodoDateBeforeToday(new Date("2026-09-03T00:00:00.000Z"), lateToday, "UTC")).toBe(
      false,
    )
    expect(isTodoDateBeforeToday(new Date("2026-09-02T00:00:00.000Z"), lateToday, "UTC")).toBe(
      true,
    )
  })

  test("uses the explicit business time zone at the UTC day boundary", () => {
    const japanMorning = new Date("2026-09-02T15:30:00.000Z")

    expect(getDateInTimeZone(japanMorning, "Asia/Tokyo")).toBe("2026-09-03")
    expect(getTodoBusinessToday(japanMorning)).toBe("2026-09-03")
    expect(
      isTodoDateBeforeToday(
        new Date("2026-09-02T00:00:00.000Z"),
        japanMorning,
        "Asia/Tokyo",
      ),
    ).toBe(true)
    expect(
      isTodoDateBeforeToday(
        new Date("2026-09-03T00:00:00.000Z"),
        japanMorning,
        "Asia/Tokyo",
      ),
    ).toBe(false)
  })

  test("uses the same business day for client deadline status outside Japan", () => {
    const japanMorning = new Date("2026-09-02T15:30:00.000Z")

    expect(getTodoDaysFromLocalToday("2026-09-02", japanMorning)).toBe(-1)
    expect(isTodoDateOverdue("2026-09-02", japanMorning)).toBe(true)
    expect(getTodoDaysFromLocalToday("2026-09-03", japanMorning)).toBe(0)
  })

  test("formats database dates and local today for date inputs", () => {
    expect(formatTodoDate("2026-09-03T00:00:00.000Z")).toBe("2026-09-03")
    expect(getLocalToday(new Date(2026, 8, 3, 23, 0, 0))).toBe("2026-09-03")
  })

  test("does not mark today's date-only deadline overdue after midnight", () => {
    const lateBusinessDay = new Date("2026-09-03T14:59:59.000Z")

    expect(getTodoDaysFromLocalToday("2026-09-03T00:00:00.000Z", lateBusinessDay)).toBe(0)
    expect(isTodoDateOverdue("2026-09-03T00:00:00.000Z", lateBusinessDay)).toBe(false)
    expect(isTodoDateNear("2026-09-03T00:00:00.000Z", lateBusinessDay)).toBe(true)
  })

  test("compares nearby deadlines as calendar days rather than instants", () => {
    const today = new Date(2026, 8, 3, 12)

    expect(getTodoDaysFromLocalToday("2026-09-06T00:00:00.000Z", today)).toBe(3)
    expect(isTodoDateNear("2026-09-06T00:00:00.000Z", today)).toBe(true)
    expect(isTodoDateNear("2026-09-07T00:00:00.000Z", today)).toBe(false)
    expect(isTodoDateOverdue("2026-09-02T00:00:00.000Z", today)).toBe(true)
  })
})
