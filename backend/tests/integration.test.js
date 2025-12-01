import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";

let mongod;
let app;
let OWNER_ID;
let usingExternalMongo = false;

beforeAll(async () => {
  // prefer external MongoDB if MONGODB_URI is provided (useful in CI)
  let uri;
  if (process.env.MONGODB_URI) {
    uri = process.env.MONGODB_URI;
    usingExternalMongo = true;
  } else {
    // start in-memory mongo
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }

  // connect mongoose to the in-memory server
  await mongoose.connect(uri);

  // choose a stable owner id for tests
  OWNER_ID = new mongoose.Types.ObjectId().toString();

  // patch auth middleware to inject our owner id
  const { createRequire } = await import("module");
  const req = createRequire(import.meta.url);
  const auth = req("../src/middlewares/auth.js");
  auth.requireAuth = (req2, res, next) => {
    req2.user = { sub: OWNER_ID };
    next();
  };

  // import app after DB and middleware patched
  // require app (reuse the same require helper) and import express app
  app = req("../src/app.js");
});

afterAll(async () => {
  await mongoose.disconnect();
  if (!usingExternalMongo) {
    if (mongod) await mongod.stop();
  }
});

beforeEach(async () => {
  // clear DB between tests
  const collections = Object.keys(mongoose.connection.collections);
  for (const name of collections) {
    await mongoose.connection.collections[name].deleteMany({});
  }
});

describe("Integration tests - CRUD with real DB (in-memory)", () => {
  it("should create a board, column and card, then perform updates and deletions", async () => {
    // Create board
    let res = await request(app)
      .post("/api/boards")
      .send({ name: "IntegrationBoard" });
    expect(res.status).toBe(201);
    const board = res.body;
    expect(board).toHaveProperty("_id");

    // Create column
    res = await request(app)
      .post(`/api/boards/${board._id}/columns`)
      .send({ key: "col-key", title: "Backlog" });
    expect(res.status).toBe(201);
    const column = res.body;
    expect(column).toHaveProperty("_id");

    // Create card
    res = await request(app)
      .post(`/api/boards/${board._id}/cards`)
      .send({ title: "Ticket 1", columnId: column._id });
    expect(res.status).toBe(201);
    const card = res.body;
    expect(card).toHaveProperty("_id");

    // List cards
    res = await request(app).get(`/api/boards/${board._id}/cards`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    // Update card title
    res = await request(app)
      .patch(`/api/cards/${card._id}`)
      .send({ title: "Ticket 1 - updated" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("title", "Ticket 1 - updated");

    // Delete column -> should cascade delete cards
    res = await request(app).delete(`/api/columns/${column._id}`);
    expect(res.status).toBe(204);

    // Verify card removed from DB using model
    const { createRequire } = await import("module");
    const req = createRequire(import.meta.url);
    const Card = req("../src/models/Card.js");
    const found = await Card.findById(card._id);
    expect(found).toBeNull();
  });
});
