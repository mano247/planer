"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  activities: {
    getWeek: (weekStart, weekEnd) => electron.ipcRenderer.invoke("activities:getWeek", weekStart, weekEnd),
    getRange: (startDate, endDate) => electron.ipcRenderer.invoke("activities:getRange", startDate, endDate),
    upsert: (input) => electron.ipcRenderer.invoke("activities:upsert", input),
    delete: (id) => electron.ipcRenderer.invoke("activities:delete", id),
    updateCategory: (id, categoryId) => electron.ipcRenderer.invoke("activities:updateCategory", id, categoryId)
  },
  categories: {
    getAll: () => electron.ipcRenderer.invoke("categories:getAll"),
    create: (input) => electron.ipcRenderer.invoke("categories:create", input),
    update: (id, input) => electron.ipcRenderer.invoke("categories:update", id, input),
    delete: (id) => electron.ipcRenderer.invoke("categories:delete", id)
  },
  events: {
    getMonth: (year, month) => electron.ipcRenderer.invoke("events:getMonth", year, month),
    getRange: (startDate, endDate) => electron.ipcRenderer.invoke("events:getRange", startDate, endDate),
    create: (input) => electron.ipcRenderer.invoke("events:create", input),
    update: (id, input) => electron.ipcRenderer.invoke("events:update", id, input),
    delete: (id) => electron.ipcRenderer.invoke("events:delete", id)
  },
  todos: {
    getAll: () => electron.ipcRenderer.invoke("todos:getAll"),
    create: (input) => electron.ipcRenderer.invoke("todos:create", input),
    update: (id, input) => electron.ipcRenderer.invoke("todos:update", id, input),
    delete: (id) => electron.ipcRenderer.invoke("todos:delete", id)
  },
  books: {
    getAll: () => electron.ipcRenderer.invoke("books:getAll"),
    create: (input) => electron.ipcRenderer.invoke("books:create", input),
    update: (id, input) => electron.ipcRenderer.invoke("books:update", id, input),
    delete: (id) => electron.ipcRenderer.invoke("books:delete", id)
  },
  notes: {
    getByDate: (date) => electron.ipcRenderer.invoke("notes:getByDate", date),
    getDatesWithNotes: () => electron.ipcRenderer.invoke("notes:getDatesWithNotes"),
    upsert: (date, content) => electron.ipcRenderer.invoke("notes:upsert", date, content)
  },
  settings: {
    get: (key) => electron.ipcRenderer.invoke("settings:get", key),
    set: (key, value) => electron.ipcRenderer.invoke("settings:set", key, value),
    getAll: () => electron.ipcRenderer.invoke("settings:getAll")
  },
  data: {
    export: () => electron.ipcRenderer.invoke("data:export"),
    import: () => electron.ipcRenderer.invoke("data:import")
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
