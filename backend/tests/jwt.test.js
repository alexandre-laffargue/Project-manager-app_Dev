import { describe, it, expect, beforeAll } from "vitest";
import { signJwt, verifyJwt } from "../src/utils/jwt.js";

beforeAll(() => {
  // ensure a deterministic secret for tests
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  process.env.JWT_EXPIRES_IN = "1h";
});

describe("JWT util", () => {
  it("signJwt should return a token string", () => {
    const token = signJwt({ sub: "user-1", email: "u@example.com" });
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);
  });

  it("verifyJwt should decode a valid token and return payload", () => {
    const payload = { sub: "user-2", email: "user2@example.com" };
    const token = signJwt(payload);
    const decoded = verifyJwt(token);
    // jwt.verify adds iat and exp fields; ensure our payload fields exist
    expect(decoded).toHaveProperty("sub", payload.sub);
    expect(decoded).toHaveProperty("email", payload.email);
    expect(decoded).toHaveProperty("iat");
    expect(decoded).toHaveProperty("exp");
  });

  it("verifyJwt should throw for invalid token", () => {
    let threw = false;
    try {
      verifyJwt("not-a-token");
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
