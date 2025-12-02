import request from "supertest";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

// Mocks
const mockBoardCreate = vi.fn();
const mockBoardFind = vi.fn();

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  const { createRequire } = await import("module");
  const req = createRequire(import.meta.url);

  // Patch auth middleware to inject user
  const auth = req("../src/middlewares/auth.js");
  auth.requireAuth = (req2, res, next) => {
    req2.user = { sub: "owner-1" };
    next();
  };

  // Patch Board model
  const Board = req("../src/models/Board.js");
  Board.create = (...args) => mockBoardCreate(...args);
  Board.find = (...args) => mockBoardFind(...args);

  // require app via CommonJS to avoid ESM/CJS interop issues in tests
  app = req("../src/app.js");
});

beforeEach(() => {
  mockBoardCreate.mockReset();
  mockBoardFind.mockReset();
});

describe("Boards API", () => {
  it("POST /api/boards -> creates a board", async () => {
    const created = { _id: "b1", name: "Project A", ownerId: "owner-1" };
    mockBoardCreate.mockResolvedValue(created);

    const res = await request(app)
      .post("/api/boards")
      .send({ name: "Project A" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("name", "Project A");
    expect(res.body).toHaveProperty("ownerId", "owner-1");
  });

  it("POST /api/boards -> returns 400 for invalid payload", async () => {
    const res = await request(app).post("/api/boards").send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /api/boards/me -> returns user boards", async () => {
    const boards = [
      { _id: "b1", name: "P1", ownerId: "owner-1" },
      { _id: "b2", name: "P2", ownerId: "owner-1" },
    ];
    mockBoardFind.mockReturnValue({ sort: () => Promise.resolve(boards) });

    const res = await request(app).get("/api/boards/me");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });
});
