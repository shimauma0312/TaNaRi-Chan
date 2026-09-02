const baseUrl = process.env.PRODUCTION_BASE_URL ?? "http://127.0.0.1:3002"
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`
const password = "smoke-password-123"

async function request(path, { expected, cookie, ...options } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...options.headers,
    },
  })
  const text = await response.text()
  const body = text ? JSON.parse(text) : null
  if (response.status !== expected) {
    throw new Error(`${options.method ?? "GET"} ${path}: expected ${expected}, got ${response.status}: ${text}`)
  }
  return { response, body }
}

async function register(email, userName) {
  await request("/api/createUser", {
    method: "POST",
    expected: 201,
    body: JSON.stringify({ email, password, userName }),
  })
}

async function login(email) {
  const result = await request("/api/login", {
    method: "POST",
    expected: 200,
    body: JSON.stringify({ email, password }),
  })
  const cookie = result.response.headers.get("set-cookie")?.split(";", 1)[0]
  if (!cookie?.startsWith("auth-session=")) {
    throw new Error("login did not issue an opaque auth-session cookie")
  }
  return { cookie, user: result.body.user }
}

const emailA = `smoke-a-${suffix}@example.test`
const emailB = `smoke-b-${suffix}@example.test`
await register(emailA, "Smoke A")
await register(emailB, "Smoke B")

const sessionA = await login(emailA)
const sessionB = await login(emailB)

await request("/api/me", {
  expected: 401,
  cookie: `auth-user-id=${sessionA.user.id}`,
})

const created = await request("/api/articles", {
  method: "POST",
  expected: 201,
  cookie: sessionA.cookie,
  body: JSON.stringify({
    title: `Smoke ${suffix}`,
    content: "Production ownership smoke test",
    author_id: sessionB.user.id,
  }),
})
if (created.body.author_id !== sessionA.user.id) {
  throw new Error("article author was not derived from the authenticated session")
}

await request("/api/articles", {
  method: "PUT",
  expected: 404,
  cookie: sessionB.cookie,
  body: JSON.stringify({
    post_id: created.body.post_id,
    title: "Unauthorized update",
    content: "This update must not succeed",
  }),
})

await request("/api/articles", {
  method: "DELETE",
  expected: 200,
  cookie: sessionA.cookie,
  body: JSON.stringify({ post_id: created.body.post_id }),
})

await request("/api/logout", {
  method: "POST",
  expected: 200,
  cookie: sessionA.cookie,
})
await request("/api/me", { expected: 401, cookie: sessionA.cookie })
await request("/api/health/ready", { expected: 200 })

console.log("Production authentication and ownership smoke test passed")
