import { db, usersTable, hostelsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

function generateId() {
  return crypto.randomBytes(8).toString("hex");
}

async function hashPassword(p: string) {
  return bcrypt.hash(p, 8);
}

function cleanPhone(p: string | undefined): string | undefined {
  if (!p) return undefined;
  const digits = p.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return undefined;
}

async function importDeptMembers() {
  console.log("\n=== Importing Department Members ===");
  const raw = fs.readFileSync(
    path.join(process.cwd(), "attached_assets/DepartmentMembers_-_Sheet1_1777376906387.csv"),
    "utf-8"
  );
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  let inserted = 0, skipped = 0;
  for (const row of rows) {
    const email = (row["Email"] || "").trim().toLowerCase();
    const name = (row["Name"] || "").trim();
    const phone = cleanPhone(row["Contact Number"]);
    const rawRole = (row["Role"] || "").trim().toLowerCase().replace(/\s+/g, "");

    let role: string;
    if (rawRole.includes("superadmin") || rawRole.includes("super")) role = "superadmin";
    else if (rawRole === "admin") role = "admin";
    else role = "volunteer";

    if (!email || !name) { skipped++; continue; }

    // Password = email prefix (roll number)
    const emailPrefix = email.split("@")[0];
    const passwordHash = await hashPassword(emailPrefix);

    try {
      await db.insert(usersTable).values({
        id: generateId(),
        name,
        email,
        passwordHash,
        role,
        rollNumber: emailPrefix.toUpperCase(),
        phone,
        isActive: true,
        assignedHostelIds: "[]",
      }).onConflictDoNothing();
      inserted++;
      console.log(`  [${role}] ${name} (${email})`);
    } catch (e: any) {
      console.error(`  SKIP ${email}: ${e.message}`);
      skipped++;
    }
  }
  console.log(`  Done: ${inserted} inserted, ${skipped} skipped`);
}

async function importStudents() {
  console.log("\n=== Importing Students from Hostel CSV ===");

  // Get existing hostel IDs from DB
  const hostels = await db.select({ id: hostelsTable.id, name: hostelsTable.name }).from(hostelsTable);
  const hostelMap: Record<string, string> = {};
  for (const h of hostels) {
    hostelMap[h.name.toLowerCase().trim()] = h.id;
  }
  console.log("  Hostels in DB:", Object.keys(hostelMap).join(", "));

  const raw = fs.readFileSync(
    path.join(process.cwd(), "attached_assets/hostels  - Sheet2.csv"),
    "utf-8"
  );
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });
  console.log(`  Total rows to import: ${rows.length}`);

  // Get existing emails to skip duplicates fast
  const existingUsers = await db.select({ email: usersTable.email }).from(usersTable);
  const existingEmails = new Set(existingUsers.map((u: { email: string }) => u.email.toLowerCase()));

  let inserted = 0, skipped = 0, noHostel = 0;
  const BATCH = 50;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const toInsert = [];

    for (const row of batch) {
      const rollNumber = (row["Roll no."] || "").trim().toUpperCase();
      const name = (row["Name of the Student"] || "").trim();
      const email = (row["Email"] || "").trim().toLowerCase();
      const hostelName = (row["Allotted Hostel"] || "").trim();
      const roomNumber = (row["Room no."] || "").trim();
      const mess = (row["Allotted Mess"] || "").trim();
      const phone = cleanPhone(row["Mobile no."]);
      const gender = (row["Gender"] || "").trim();

      if (!rollNumber || !name || !email) { skipped++; continue; }
      if (existingEmails.has(email)) { skipped++; continue; }

      const hostelId = hostelMap[hostelName.toLowerCase()] || undefined;
      if (!hostelId) { noHostel++; }

      // Password = roll number (lowercase)
      const passwordHash = await hashPassword(rollNumber.toLowerCase());

      toInsert.push({
        id: generateId(),
        name,
        email,
        passwordHash,
        role: "student" as const,
        rollNumber,
        hostelId,
        roomNumber: roomNumber || undefined,
        assignedMess: mess || undefined,
        phone,
        gender: gender || undefined,
        isActive: true,
        assignedHostelIds: "[]",
      });
      existingEmails.add(email);
    }

    if (toInsert.length > 0) {
      try {
        await db.insert(usersTable).values(toInsert).onConflictDoNothing();
        inserted += toInsert.length;
      } catch (e: any) {
        console.error(`  Batch error: ${e.message}`);
        // Insert one by one if batch fails
        for (const u of toInsert) {
          try {
            await db.insert(usersTable).values(u).onConflictDoNothing();
          } catch {}
        }
      }
    }

    if ((i + BATCH) % 500 === 0 || i + BATCH >= rows.length) {
      console.log(`  Progress: ${Math.min(i + BATCH, rows.length)}/${rows.length} | Inserted: ${inserted} | Skipped: ${skipped} | No hostel match: ${noHostel}`);
    }
  }

  console.log(`\n  DONE: ${inserted} students inserted, ${skipped} skipped, ${noHostel} without hostel match`);
}

async function main() {
  console.log("Starting real data import...");
  await importDeptMembers();
  await importStudents();
  console.log("\n✅ All done!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
