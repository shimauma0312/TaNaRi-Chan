/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react"
import { useLogin } from "@/hooks/useLogin"
import { useUserRegister } from "@/hooks/useUserRegister"

const push = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

function deferredResponse() {
  let resolve!: (value: Response) => void
  const promise = new Promise<Response>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe("authentication mutation hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("login ignores a second submission while the first is pending", async () => {
    const pending = deferredResponse()
    global.fetch = jest.fn().mockReturnValue(pending.promise)
    const { result } = renderHook(() => useLogin())

    let first!: Promise<void>
    await act(async () => {
      first = result.current.login("user@example.com", "password")
      await result.current.login("user@example.com", "password")
    })
    expect(global.fetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      pending.resolve(new Response("{}", { status: 200 }))
      await first
    })
    expect(push).toHaveBeenCalledWith("/dashboard")
  })

  test("registration ignores a second submission while the first is pending", async () => {
    const pending = deferredResponse()
    global.fetch = jest.fn().mockReturnValue(pending.promise)
    const { result } = renderHook(() => useUserRegister())
    const input = { email: "user@example.com", password: "Password123!", userName: "user" }

    let first!: Promise<void>
    await act(async () => {
      first = result.current.handleSubmit(input)
      await result.current.handleSubmit(input)
    })
    expect(global.fetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      pending.resolve(new Response("{}", { status: 201 }))
      await first
    })
    expect(push).toHaveBeenCalledWith("/login")
  })
})
