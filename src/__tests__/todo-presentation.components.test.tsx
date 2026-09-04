/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import TodoList from "@/components/TodoList"
import TodoForm, { TodoFormValues } from "@/components/todo/TodoForm"
import type { Todo } from "@/types/todo"

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
