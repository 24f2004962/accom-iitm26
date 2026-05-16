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

    // --- Superadmin: ensure at least one superadmin exists ---
    const [{ count: saCount }] = await db
      .select({ count: count() })
      .from(usersTable)
      .where(eq(usersTable.role, "superadmin"));

    if (Number(saCount) === 0) {
      const passwordHash = await hashPassword("qwerty");
      await db.insert(usersTable).values({
        id: generateId(),
        name: "Super Admin",
        email: "superadmin@iitm.ac.in",
        passwordHash,
        role: "superadmin",
        isActive: true,
        assignedHostelIds: "[]",
      }).onConflictDoNothing();
      console.log("[seed] Default superadmin created (superadmin@iitm.ac.in / qwerty)");
    }

    console.log("[seed] Setup complete ✓");
  } catch (err) {
    console.error("[seed] Error:", err);
  }
}
