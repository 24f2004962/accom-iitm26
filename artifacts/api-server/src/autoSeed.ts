import {
  db,
  usersTable,
  hostelsTable,
} from "@workspace/db";
import { eq, count } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";

function generateId() { return crypto.randomBytes(8).toString("hex"); }
async function hashPassword(p: string) { return bcrypt.hash(p, 8); }

const REAL_HOSTELS = [
  "Bhadra","Brahmaputra","Cauvery","Ganga","Godavari",
  "Jamuna","Krishna","Mandakini","Narmada","Saraswathi",
  "Sharavathi","Swarnamukhi","Tapti",
];

// Demo staff accounts seeded in development/staging
const DEMO_STAFF = [
  {
    name: "Super Admin",
    email: "superadmin@iitm.ac.in",
    password: "qwerty",
    role: "superadmin" as const,
    hostelId: null,
    assignedHostelIds: "[]",
    phone: "+91 9876543001",
  },
  {
    name: "Admin User",
    email: "admin@iitm.ac.in",
    password: "123456",
    role: "admin" as const,
    hostelId: null,
    assignedHostelIds: '["Bhadra","Brahmaputra","Cauvery","Ganga"]',
    phone: "+91 9876543002",
  },
  {
    name: "Coordinator User",
    email: "coordinator@iitm.ac.in",
    password: "123456",
    role: "coordinator" as const,
    hostelId: "Bhadra",
    assignedHostelIds: '["Bhadra","Brahmaputra"]',
    phone: "+91 9876543003",
  },
  {
    name: "Volunteer User",
    email: "volunteer@iitm.ac.in",
    password: "123456",
    role: "volunteer" as const,
    hostelId: "Bhadra",
    assignedHostelIds: "[]",
    phone: "+91 9876543004",
  },
  {
    name: "Volunteer Two",
    email: "volunteer2@iitm.ac.in",
    password: "123456",
    role: "volunteer" as const,
    hostelId: "Brahmaputra",
    assignedHostelIds: "[]",
    phone: "+91 9876543005",
  },
];

export async function autoSeed() {
  try {
    // --- Hostels: create real hostels if none exist ---
    const existingHostels = await db.select().from(hostelsTable);
    if (existingHostels.length === 0) {
      for (const name of REAL_HOSTELS) {
        await db.insert(hostelsTable)
          .values({ id: name, name, location: "IITM Campus" })
          .onConflictDoNothing();
      }
      console.log("[seed] Real hostels created");
    }

    // --- Demo staff: upsert each account so passwords/roles are always correct ---
    for (const staff of DEMO_STAFF) {
      const [existing] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, staff.email));

      const passwordHash = await hashPassword(staff.password);

      if (existing) {
        await db.update(usersTable).set({
          passwordHash,
          role: staff.role,
          hostelId: staff.hostelId,
          assignedHostelIds: staff.assignedHostelIds,
          isActive: true,
        }).where(eq(usersTable.id, existing.id));
      } else {
        await db.insert(usersTable).values({
          id: generateId(),
          name: staff.name,
          email: staff.email,
          passwordHash,
          role: staff.role,
          hostelId: staff.hostelId,
          assignedHostelIds: staff.assignedHostelIds,
          phone: staff.phone,
          isActive: true,
        }).onConflictDoNothing();
      }
    }
    console.log("[seed] Demo staff accounts ready");
    console.log("[seed] Setup complete ✓");
  } catch (err) {
    console.error("[seed] Error:", err);
  }
}
