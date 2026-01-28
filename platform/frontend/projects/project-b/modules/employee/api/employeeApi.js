// modules/employee/api/employeeApi.js
import { createClient } from "@/app/api/client.js";

function clone(data) {
  try {
    return structuredClone(data);
  } catch (err) {
    return JSON.parse(JSON.stringify(data));
  }
}

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiMode() {
  const forced = import.meta.env.VITE_API_MODE;
  if (forced === "real" || forced === "mock") return forced;
  const host = window.location.hostname;
  if (host === "moducore.test") return "real";
  return "mock";
}

const client = createClient();
const mode = getApiMode();

let mockDB = [];

export const employeeApi = {
  async list() {
    if (mode === "real") {
      return client.get("/api/employees/list");
    }
    await delay();
    return clone(mockDB);
  },
  async create(payload) {
    if (mode === "real") {
      return client.post("/api/employees/create", payload);
    }
    await delay();
    const nextId = mockDB.reduce((max, e) => Math.max(max, e.id), 0) + 1;
    const employee = {
      id: nextId,
      status: "active",
      password: payload.password || "",
      ...payload,
    };
    mockDB = [...mockDB, employee];
    return clone(employee);
  },
  async update(id, payload) {
    if (mode === "real") {
      return client.post("/api/employees/update", { id, ...payload });
    }
    await delay();
    mockDB = mockDB.map((e) => (e.id === id ? { ...e, ...payload } : e));
    return clone(mockDB.find((e) => e.id === id));
  },
  async remove(id) {
    if (mode === "real") {
      return client.post("/api/employees/delete", { id });
    }
    await delay();
    mockDB = mockDB.filter((e) => e.id !== id);
    return { success: true };
  },
};

export function resetMockEmployee() {
  mockDB = [];
}
