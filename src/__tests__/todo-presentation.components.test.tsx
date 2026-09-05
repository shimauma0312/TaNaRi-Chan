/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { getTodoList } from "@/app/dashboard/calendar/page"
import ShakeImage from "@/components/ShakeImage"
import TodoList from "@/components/TodoList"
import Calendar from "@/components/calendar/Calendar"
import TodoForm, { TodoFormValues } from "@/components/todo/TodoForm"
import type { Todo } from "@/types/todo"

jest.mock("next/image", () => ({
  __esModule: true,
  default: () => <span data-testid="shake-image" />,
}))

const todo: Todo = {
  todo_id: 1,
  id: "user-1",
  title: "Review architecture",
  description: "Check the UI contract",
  todo_deadline: "2099-01-01",
  is_completed: false,
  is_public: false,
}

const formValues: TodoFormValues = {
  title: "",
  description: "",
  dueDate: "",
  visibility: "private",
}

describe("Todo presentation components", () => {
  test("calendar pagination accepts a missing next cursor as the final page", async () => {
    const responseTodos = [
      {
        todo_id: 10,
        title: "Review the release",
        todo_deadline: "2026-09-05",
      },
    ]
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => responseTodos,
      headers: new Headers(),
    } as Response)

    await expect(
      getTodoList("user-1", new Date(2026, 8, 1), new AbortController().signal),
    ).resolves.toEqual(responseTodos)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/api/todoList/user-1?from=2026-09-01&to=2026-10-01&limit=100",
    )

    fetchMock.mockRestore()
  })

  test("calendar exposes weekday headings, dated cells, and their Todos", () => {
    render(
      <Calendar
        currentDate={new Date(2026, 8, 1)}
        todos={[
          {
            todo_id: 10,
            title: "Review the release",
            todo_deadline: "2026-09-05",
          },
        ]}
      />,
    )

    expect(screen.getByRole("grid", { name: "September 2026 Todo calendar" })).toBeTruthy()
    expect(screen.getByRole("columnheader", { name: "Sunday" }).textContent).toBe("Sun")

    const datedCell = screen.getByRole("gridcell", {
      name: "Saturday, September 5, 2026. 1 Todo: Review the release",
    })
    expect(within(datedCell).getByText("5")).toBeTruthy()
    expect(within(datedCell).getByText("Review the release")).toBeTruthy()
  })

  test("shake interaction keeps status outside its phrasing-only button", () => {
    render(<ShakeImage />)

    const button = screen.getByRole("button", { name: "Shake image. 0 of 70 clicks" })
    expect(button.querySelector("div")).toBeNull()
    expect(within(button).getByTestId("shake-image")).toBeTruthy()

    fireEvent.click(button)

    expect(screen.getByRole("button", { name: "Shake image. 1 of 70 clicks" })).toBeTruthy()
    const status = screen.getByRole("status")
    expect(status.textContent).toContain("CLICKS: 1/70")
    expect(button.contains(status)).toBe(false)
    expect(button.parentElement?.nextElementSibling).toBe(status)
  })

  test("Todo form length limits match the API contract", () => {
    render(
      <TodoForm
        heading="New Todo"
        submitLabel="Save"
        values={formValues}
        error={null}
        submitting={false}
        onChange={jest.fn()}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    )

    expect(screen.getByRole("textbox", { name: /todo title/i }).getAttribute("maxlength")).toBe(
      "200",
    )
    expect(screen.getByRole("textbox", { name: /description/i }).getAttribute("maxlength")).toBe(
      "5000",
    )
  })

  test("deletion errors stay in the dialog and clear before retry", async () => {
    const deleteTodo = jest
      .fn<Promise<void>, [number]>()
      .mockRejectedValueOnce(new Error("Delete API unavailable"))
      .mockResolvedValueOnce()
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined)

    render(<TodoList todos={[todo]} showStats={false} onDelete={deleteTodo} />)

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    expect((await screen.findByRole("alert")).textContent).toContain("Delete API unavailable")
    expect(screen.getByRole("dialog")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    expect(screen.queryByRole("alert")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(deleteTodo).toHaveBeenCalledTimes(2)
    consoleError.mockRestore()
  })
})
