import { container } from "@/app/container";
import { employeeApi } from "../api/employeeApi.js";

function unwrap(res) {
  if (res && typeof res === "object" && "data" in res) return res.data;
  return res;
}

function normalizeEmployee(emp, fallback = {}) {
  return {
    status: "active",
    department: "",
    phone: "",
    password: emp?.password || "",
    ...fallback,
    ...emp,
  };
}

function normalizeList(res) {
  if (Array.isArray(res)) return res.map((e) => normalizeEmployee(e));
  if (res && Array.isArray(res.data)) return res.data.map((e) => normalizeEmployee(e));
  return [];
}

function getStore() {
  return container.resolve("employeeStore");
}

export const employeeService = {
  async fetchList() {
    const res = await employeeApi.list();
    const employees = normalizeList(unwrap(res));
    getStore().setList(employees);
    return employees;
  },

  async create(payload) {
    const created = unwrap(await employeeApi.create(payload));
    const employee = normalizeEmployee(created);
    getStore().addEmployee(employee);
    return employee;
  },

  async update(id, payload) {
    const updated = unwrap(await employeeApi.update(id, payload));
    const employee = normalizeEmployee({ ...updated, id: updated?.id ?? id });
    getStore().updateEmployee(id, employee);
    return employee;
  },

  async remove(id) {
    await employeeApi.remove(id);
    getStore().removeEmployee(id);
  },
};
