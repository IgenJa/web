const request = require("supertest");

function makeApp() {
  process.env.NODE_ENV = "test";
  process.env.DB_PATH = ":memory:";
  process.env.JWT_SECRET = "test_secret";
  jest.resetModules();
  // eslint-disable-next-line global-require
  return require("../server.js");
}

async function register(agent, email, password) {
  return agent.post("/register").send({ username: email, password });
}

async function login(agent, email, password) {
  return agent.post("/login").send({ username: email, password });
}

describe("Auth + authorization + validation (API)", () => {
  let app;
  let db;
  let agent;

  beforeAll(() => {
    const mod = makeApp();
    app = mod.app;
    agent = request(app);
  });

  afterAll(() => {
    // db layer is handled internally; nothing to close here
  });

  test("register rejects invalid email", async () => {
    const res = await agent.post("/register").send({ username: "not-an-email", password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  test("register rejects short password", async () => {
    const res = await agent.post("/register").send({ username: "a@b.com", password: "123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8/i);
  });

  test("register succeeds with valid email+password", async () => {
    const res = await register(agent, "user1@test.com", "password123");
    expect(res.status).toBe(200);
  });

  test("register rejects duplicate username", async () => {
    await register(agent, "dup@test.com", "password123");
    const res2 = await register(agent, "dup@test.com", "password123");
    expect(res2.status).toBe(400);
    expect(res2.body.error).toMatch(/foglalt/i);
  });

  test("login succeeds and returns token + userId", async () => {
    await register(agent, "user2@test.com", "password123");
    const res = await login(agent, "user2@test.com", "password123");
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.userId).toBeDefined();
  });

  test("login rejects wrong password", async () => {
    await register(agent, "user3@test.com", "password123");
    const res = await login(agent, "user3@test.com", "password999");
    expect(res.status).toBe(401);
  });

  test("protected endpoint /me requires auth", async () => {
    const res = await agent.get("/me");
    expect(res.status).toBe(403);
  });

  test("create post requires auth", async () => {
    const res = await agent.post("/posts").send({ title: "Hi", content: "0123456789", category_id: 1 });
    expect(res.status).toBe(403);
  });

  test("create post validates content length", async () => {
    await register(agent, "user4@test.com", "password123");
    const loginRes = await login(agent, "user4@test.com", "password123");
    const token = loginRes.body.token;
    const res = await agent
      .post("/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Title", content: "short", category_id: 1 });
    expect(res.status).toBe(400);
  });

  test("post update is forbidden for non-owner non-admin", async () => {
    await register(agent, "owner@test.com", "password123");
    const ownerLogin = await login(agent, "owner@test.com", "password123");
    const ownerToken = ownerLogin.body.token;

    const postRes = await agent
      .post("/posts")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ title: "T", content: "0123456789A", category_id: 1 });
    const postId = postRes.body.id;

    await register(agent, "other@test.com", "password123");
    const otherLogin = await login(agent, "other@test.com", "password123");
    const otherToken = otherLogin.body.token;

    const upd = await agent
      .put(`/posts/${postId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "T2", content: "0123456789B" });

    expect(upd.status).toBe(403);
  });

  test("comment update is forbidden for non-owner non-admin", async () => {
    await register(agent, "cowner@test.com", "password123");
    const ownerLogin = await login(agent, "cowner@test.com", "password123");
    const ownerToken = ownerLogin.body.token;

    const postRes = await agent
      .post("/posts")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ title: "T", content: "0123456789A", category_id: 1 });
    const postId = postRes.body.id;

    const commentRes = await agent
      .post("/comments")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ content: "hello", postId });
    const commentId = commentRes.body.id;

    await register(agent, "cother@test.com", "password123");
    const otherLogin = await login(agent, "cother@test.com", "password123");
    const otherToken = otherLogin.body.token;

    const upd = await agent
      .put(`/comments/${commentId}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ content: "hacked" });
    expect(upd.status).toBe(403);
  });
});

