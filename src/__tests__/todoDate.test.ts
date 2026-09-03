import {
  formatTodoDate,
  getLocalToday,
  isTodoDateBeforeToday,
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
    expect(isTodoDateBeforeToday(new Date("2026-09-03T00:00:00.000Z"), lateToday)).toBe(false)
    expect(isTodoDateBeforeToday(new Date("2026-09-02T00:00:00.000Z"), lateToday)).toBe(true)
  })

  test("formats database dates and local today for date inputs", () => {
    expect(formatTodoDate("2026-09-03T00:00:00.000Z")).toBe("2026-09-03")
    expect(getLocalToday(new Date(2026, 8, 3, 23, 0, 0))).toBe("2026-09-03")
  })
})
