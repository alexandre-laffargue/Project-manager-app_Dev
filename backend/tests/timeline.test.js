import request from "supertest";
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

// Mocks
const mockTimelineFindOne = vi.fn();
const mockTimelineFindById = vi.fn();
const mockTimelineConstructor = vi.fn();
const mockTimelineSave = vi.fn();
const mockBoardFindOne = vi.fn();
const mockSprintFind = vi.fn();
const mockIssueFind = vi.fn();

let app;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  const { createRequire } = await import("module");
  const req = createRequire(import.meta.url);

  // Patch auth middleware
  const auth = req("../src/middlewares/auth.js");
  auth.requireAuth = (req2, res, next) => {
    req2.user = { sub: "owner-1" };
    next();
  };

  // Patch Board model
  const Board = req("../src/models/Board.js");
  Board.findOne = (...args) => mockBoardFindOne(...args);

  // Patch Sprint model
  const Sprint = req("../src/models/Sprint.js");
  Sprint.find = (...args) => mockSprintFind(...args);

  // Patch Issue model
  const Issue = req("../src/models/Issue.js");
  Issue.find = (...args) => mockIssueFind(...args);

  // Patch Timeline model
  const Timeline = req("../src/models/Timeline.js");
  Timeline.findOne = (...args) => mockTimelineFindOne(...args);
  Timeline.findById = (...args) => mockTimelineFindById(...args);

  // Mock Timeline constructor
  const MockedTimeline = function (data) {
    this.save = async () => {
      mockTimelineSave();
      return { ...data, _id: "timeline-new" };
    };
    Object.assign(this, data);
    mockTimelineConstructor(data);
  };
  MockedTimeline.findOne = Timeline.findOne;
  MockedTimeline.findById = Timeline.findById;

  req.cache[req.resolve("../src/models/Timeline.js")].exports = MockedTimeline;

  app = req("../src/app.js");
});

beforeEach(() => {
  mockTimelineFindOne.mockReset();
  mockTimelineFindById.mockReset();
  mockTimelineConstructor.mockReset();
  mockTimelineSave.mockReset();
  mockBoardFindOne.mockReset();
  mockSprintFind.mockReset();
  mockIssueFind.mockReset();
});

describe("Timeline API", () => {
  describe("GET /api/timeline", () => {
    it("should return existing snapshot if available", async () => {
      const snapshot = {
        _id: "timeline-1",
        boardId: "board-1",
        ownerId: "owner-1",
        data: { sprints: [], backlog: [] },
        snapshotDate: new Date(),
      };
      mockBoardFindOne.mockResolvedValue({
        _id: "board-1",
        ownerId: "owner-1",
      });
      mockTimelineFindOne.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve(snapshot) }),
      });

      const res = await request(app).get("/api/timeline?boardId=board-1");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("snapshot");
    });

    it("should compute and persist new snapshot if none exists", async () => {
      mockBoardFindOne.mockResolvedValue({
        _id: "board-1",
        ownerId: "owner-1",
      });
      mockTimelineFindOne.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve(null) }),
      });

      // Mock Sprint and Issue queries for computing timeline
      mockSprintFind.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve([]) }),
      });
      mockIssueFind.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve([]) }),
      });

      const res = await request(app).get("/api/timeline?boardId=board-1");
      expect(res.status).toBe(200);
      expect(mockTimelineConstructor).toHaveBeenCalled();
      expect(mockTimelineSave).toHaveBeenCalled();
    });

    it("should return 404 when board not found", async () => {
      mockBoardFindOne.mockResolvedValue(null);

      const res = await request(app).get("/api/timeline?boardId=missing");
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Board not found");
    });

    it("should work without boardId (all boards)", async () => {
      const snapshot = {
        _id: "timeline-1",
        boardId: null,
        ownerId: "owner-1",
        data: { sprints: [], backlog: [] },
      };
      mockTimelineFindOne.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve(snapshot) }),
      });

      const res = await request(app).get("/api/timeline");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("snapshot");
    });
  });

  describe("POST /api/timeline", () => {
    it("should create a new timeline snapshot", async () => {
      mockBoardFindOne.mockResolvedValue({
        _id: "board-1",
        ownerId: "owner-1",
      });
      mockSprintFind.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve([]) }),
      });
      mockIssueFind.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve([]) }),
      });

      const res = await request(app)
        .post("/api/timeline")
        .send({ boardId: "board-1", name: "Q4 Snapshot" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("snapshot");
      expect(mockTimelineConstructor).toHaveBeenCalled();
      expect(mockTimelineSave).toHaveBeenCalled();
    });

    it("should create snapshot with provided data", async () => {
      mockBoardFindOne.mockResolvedValue({
        _id: "board-1",
        ownerId: "owner-1",
      });

      const customData = {
        sprints: [{ id: "s1", name: "Sprint 1" }],
        backlog: [],
      };
      const res = await request(app)
        .post("/api/timeline")
        .send({ boardId: "board-1", data: customData });

      expect(res.status).toBe(201);
      expect(mockTimelineConstructor).toHaveBeenCalled();
    });

    it("should return 404 when board not found", async () => {
      mockBoardFindOne.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/timeline")
        .send({ boardId: "missing" });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Board not found");
    });
  });

  describe("POST /api/timeline/:id/refresh", () => {
    it("should refresh timeline snapshot", async () => {
      const timeline = {
        _id: "timeline-1",
        ownerId: "owner-1",
        boardId: "board-1",
        version: 1,
        data: { sprints: [], backlog: [] },
        save: async function () {
          return this;
        },
      };
      mockTimelineFindById.mockResolvedValue(timeline);
      mockSprintFind.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve([]) }),
      });
      mockIssueFind.mockReturnValue({
        sort: () => ({ lean: () => Promise.resolve([]) }),
      });

      const res = await request(app).post("/api/timeline/timeline-1/refresh");
      expect(res.status).toBe(200);
      expect(res.body.snapshot.version).toBe(2);
    });

    it("should return 404 when timeline not found", async () => {
      mockTimelineFindById.mockResolvedValue(null);

      const res = await request(app).post("/api/timeline/missing/refresh");
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Timeline not found");
    });

    it("should return 403 when user is not owner", async () => {
      const timeline = { _id: "timeline-1", ownerId: "other-owner" };
      mockTimelineFindById.mockResolvedValue(timeline);

      const res = await request(app).post("/api/timeline/timeline-1/refresh");
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error", "Forbidden");
    });
  });

  describe("PATCH /api/timeline/:id", () => {
    it("should update timeline metadata", async () => {
      const timeline = {
        _id: "timeline-1",
        ownerId: "owner-1",
        name: "Old Name",
        isPublished: false,
        save: async function () {
          return this;
        },
      };
      mockTimelineFindById.mockResolvedValue(timeline);

      const res = await request(app)
        .patch("/api/timeline/timeline-1")
        .send({ name: "New Name", isPublished: true });

      expect(res.status).toBe(200);
      expect(res.body.snapshot).toHaveProperty("name", "New Name");
      expect(res.body.snapshot).toHaveProperty("isPublished", true);
    });

    it("should return 404 when timeline not found", async () => {
      mockTimelineFindById.mockResolvedValue(null);

      const res = await request(app)
        .patch("/api/timeline/missing")
        .send({ name: "Test" });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Timeline not found");
    });

    it("should return 403 when user is not owner", async () => {
      const timeline = { _id: "timeline-1", ownerId: "other-owner" };
      mockTimelineFindById.mockResolvedValue(timeline);

      const res = await request(app)
        .patch("/api/timeline/timeline-1")
        .send({ name: "Test" });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error", "Forbidden");
    });
  });

  describe("DELETE /api/timeline/:id", () => {
    it("should delete a timeline", async () => {
      const timeline = {
        _id: "timeline-1",
        ownerId: "owner-1",
        deleteOne: async function () {
          return;
        },
      };
      mockTimelineFindById.mockResolvedValue(timeline);

      const res = await request(app).delete("/api/timeline/timeline-1");
      expect(res.status).toBe(204);
    });

    it("should return 404 when timeline not found", async () => {
      mockTimelineFindById.mockResolvedValue(null);

      const res = await request(app).delete("/api/timeline/missing");
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Timeline not found");
    });

    it("should return 403 when user is not owner", async () => {
      const timeline = { _id: "timeline-1", ownerId: "other-owner" };
      mockTimelineFindById.mockResolvedValue(timeline);

      const res = await request(app).delete("/api/timeline/timeline-1");
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error", "Forbidden");
    });
  });
});
