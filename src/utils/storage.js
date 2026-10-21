// Simple localStorage-backed data service for the app
const KEY_PREFIX = "easycheck_";

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error("storage read error", e);
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("storage write error", e);
    return false;
  }
};

// Attendance records: array of { id, userId, date, checkInTime, checkOutTime, checkInLocation, checkOutLocation }
export const getAttendanceRecords = () => read("attendanceRecords", []);
export const saveAttendanceRecords = (arr) => write("attendanceRecords", arr);
export const addOrUpdateAttendance = (record) => {
  const records = getAttendanceRecords();
  const idx = records.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    records[idx] = { ...records[idx], ...record };
  } else {
    records.push(record);
  }
  saveAttendanceRecords(records);
  return record;
};

// Absence history
export const getAbsenceHistory = () => read("absenceHistory", []);
export const saveAbsenceHistory = (arr) => write("absenceHistory", arr);

export const getAbsenceRequests = () => read("absenceRequests", []);
export const saveAbsenceRequests = (arr) => write("absenceRequests", arr);

// Add new request
export const addAbsenceRequest = (request) => {
  const list = getAbsenceRequests();
  const newRequest = {
    id: Date.now(),
    status: "pending", // pending, approved, rejected
    timestamp: new Date().toLocaleString("th-TH"),
    ...request,
  };
  list.unshift(newRequest);
  saveAbsenceRequests(list);
  return newRequest;
};

// Update request status (Admin action)
export const updateAbsenceStatus = (requestId, status, approverName) => {
  const list = getAbsenceRequests();
  const index = list.findIndex((r) => r.id === requestId);
  if (index !== -1) {
    list[index].status = status;
    list[index].approver = approverName;
    list[index].approvedTime = new Date().toLocaleString("th-TH");
    saveAbsenceRequests(list);
    return list[index];
  }
  return null;
};

// Events
export const getEvents = () => read("events", []);
export const saveEvents = (arr) => write("events", arr);

// Helper to update event participant count
export const updateEventParticipantCount = (eventId, increment = true) => {
  const events = getEvents();
  const index = events.findIndex((e) => e.id === eventId);

  if (index !== -1) {
    const event = events[index];
    // Calculate new count
    let newCount = (event.registered || 0) + (increment ? 1 : -1);

    // Safety bounds
    if (newCount < 0) newCount = 0;
    if (newCount > event.quota) newCount = event.quota;

    events[index] = { ...event, registered: newCount };
    saveEvents(events);
    return events; // Return updated list
  }
  return events;
};

// Registered events per user: map userId -> [eventIds]
export const getRegisteredEvents = () => read("registeredEvents", {});
export const saveRegisteredEvents = (map) => write("registeredEvents", map);

// Notifications
export const getNotifications = () => read("notifications", []);
export const saveNotifications = (arr) => write("notifications", arr);

// Helper to add a notification from anywhere in the app
export const addNotification = (userId, type, title, message) => {
  const notifications = getNotifications();
  const newNote = {
    id: Date.now(), // Unique ID based on timestamp
    userId, // Link to specific user
    type, // 'success', 'warning', 'error', 'info'
    title,
    message,
    timestamp: new Date().toLocaleString("th-TH"),
    read: false,
  };

  // Add to beginning of array
  notifications.unshift(newNote);
  saveNotifications(notifications);
  return newNote;
};

// Users (for demo, create default users if absent)
export const getUsers = () => {
  const users = read("users", null);
  if (!users) {
    const demo = [
      {
        id: "EMP001",
        role: "employee",
        name: "Somchai Employee",
        email: "somchai@gmail.com",
        password: "1234",
        status: "active",
      },
      {
        id: "EMP002",
        role: "admin",
        name: "Somsri Admin",
        email: "somsri@gmail.com",
        password: "1234",
        status: "active",
      },
      {
        id: "EMP003",
        role: "superadmin",
        name: "Sompot Superadmin",
        email: "sompot@gmail.com",
        password: "1234",
        status: "active",
      },
    ];
    write("users", demo);
    return demo;
  }
  return users;
};

export const saveUsers = (arr) => write("users", arr);

export default {
  getAttendanceRecords,
  saveAttendanceRecords,
  addOrUpdateAttendance,
  getAbsenceHistory,
  saveAbsenceHistory,
  getAbsenceRequests,
  saveAbsenceRequests,
  addAbsenceRequest,
  updateAbsenceStatus,
  getEvents,
  saveEvents,
  updateEventParticipantCount,
  getRegisteredEvents,
  saveRegisteredEvents,
  getNotifications,
  saveNotifications,
  addNotification,
  getUsers,
  saveUsers,
};
