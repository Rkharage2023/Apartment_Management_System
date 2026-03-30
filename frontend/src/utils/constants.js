export const ROLES = {
  ADMIN: "admin",
  RESIDENT: "resident",
  SECURITY: "security",
  STAFF: "staff",
};

export const COMPLAINT_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in-progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  OVERDUE: "overdue",
};

export const FLAT_STATUS = {
  OCCUPIED: "occupied",
  VACANT: "vacant",
  RENOVATION: "under-renovation",
};

export const VISITOR_PURPOSE = ["guest", "delivery", "maintenance", "cab"];

export const COMPLAINT_CATEGORIES = [
  "plumbing",
  "electrical",
  "lift",
  "security",
  "cleanliness",
  "noise",
  "other",
];

export const NAV_ITEMS = [
  {
    path: "/",
    label: "Dashboard",
    icon: "home",
    roles: ["admin", "resident", "security", "staff"],
  },
  {
    path: "/flats",
    label: "Flats",
    icon: "building",
    roles: ["admin", "resident"],
  },
  {
    path: "/billing",
    label: "Billing",
    icon: "receipt",
    roles: ["admin", "resident"],
  },
  {
    path: "/complaints",
    label: "Complaints",
    icon: "alert",
    roles: ["admin", "resident", "staff"],
  },
  {
    path: "/visitors",
    label: "Visitors",
    icon: "users",
    roles: ["admin", "resident", "security"],
  },
  {
    path: "/events",
    label: "Events",
    icon: "calendar",
    roles: ["admin", "resident"],
  },
  {
    path: "/parking",
    label: "Parking",
    icon: "car",
    roles: ["admin", "resident"],
  },
  { path: "/waste", label: "Waste", icon: "trash", roles: ["admin", "staff"] },
  { path: "/gate", label: "Gate", icon: "shield", roles: ["security"] },
];
