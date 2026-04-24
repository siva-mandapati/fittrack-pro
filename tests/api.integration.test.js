const request = require("supertest");
const createTestApp = require("./testApp");

const app = createTestApp();

const registerPayload = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  level: "beginner",
  daysPerWeek: 3,
};

const registerAndGetToken = async () => {
  const response = await request(app).post("/api/auth/register").send(registerPayload);
  return response.body.token;
};

describe("API Integration Tests", () => {
  describe("POST /api/auth/register", () => {
    it("registers a user and returns token + user object", async () => {
      const res = await request(app).post("/api/auth/register").send(registerPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toMatchObject({
        name: registerPayload.name,
        email: registerPayload.email,
      });
      expect(res.body.user).not.toHaveProperty("password");
    });

    it("returns 400 for duplicate registration", async () => {
      await request(app).post("/api/auth/register").send(registerPayload);
      const res = await request(app).post("/api/auth/register").send(registerPayload);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message", "User already exists.");
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in successfully and returns token + user object", async () => {
      await request(app).post("/api/auth/register").send(registerPayload);

      const res = await request(app).post("/api/auth/login").send({
        email: registerPayload.email,
        password: registerPayload.password,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("email", registerPayload.email);
    });

    it("returns 401 for invalid credentials", async () => {
      await request(app).post("/api/auth/register").send(registerPayload);

      const res = await request(app).post("/api/auth/login").send({
        email: registerPayload.email,
        password: "wrong_password",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("message", "Invalid credentials.");
    });
  });

  describe("POST /api/workout/log", () => {
    it("logs workout successfully with valid body", async () => {
      const token = await registerAndGetToken();

      const res = await request(app)
        .post("/api/workout/log")
        .set("Authorization", `Bearer ${token}`)
        .send({
          entries: [
            {
              exerciseName: "Bench Press",
              setsCompleted: 3,
              repsCompleted: 10,
              weightUsed: 50,
              difficulty: "easy",
            },
          ],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("workoutLog");
      expect(res.body.workoutLog).toHaveProperty("entries");
      expect(res.body).toHaveProperty("streak");
    });

    it("returns 400 for invalid workout body", async () => {
      const token = await registerAndGetToken();

      const res = await request(app)
        .post("/api/workout/log")
        .set("Authorization", `Bearer ${token}`)
        .send({
          entries: [
            {
              exerciseName: "Bench Press",
              setsCompleted: 3,
              repsCompleted: 10,
              // weightUsed missing intentionally
              difficulty: "easy",
            },
          ],
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message");
    });
  });

  describe("POST /api/progress/analyze", () => {
    it("analyzes progress and returns structured response", async () => {
      const token = await registerAndGetToken();

      await request(app)
        .post("/api/workout/log")
        .set("Authorization", `Bearer ${token}`)
        .send({
          entries: [
            {
              exerciseName: "Bench Press",
              setsCompleted: 3,
              repsCompleted: 10,
              weightUsed: 50,
              difficulty: "easy",
            },
          ],
        });

      const res = await request(app)
        .post("/api/progress/analyze")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("analysis");
      expect(res.body).toHaveProperty("updatedPlan");
      expect(res.body).toHaveProperty("exerciseAnalytics");
      expect(Array.isArray(res.body.exerciseAnalytics)).toBe(true);
      expect(res.body).toHaveProperty("recommendations");
      expect(Array.isArray(res.body.recommendations)).toBe(true);
    });

    it("returns 401 when token is missing", async () => {
      const res = await request(app).post("/api/progress/analyze").send({});

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("message");
    });
  });
});
