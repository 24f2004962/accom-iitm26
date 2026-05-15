# CampusOps — Complete System Guide
### IIT Madras BS Hostel Management Portal

---

## What is CampusOps?

CampusOps is a digital hostel management system built for IIT Madras BS students and staff. It replaces paper registers, WhatsApp groups, and scattered spreadsheets with one unified portal accessible on mobile (the app) and on desktop (the web admin panel).

The system handles:
- Daily room attendance (who is on campus, who is out)
- Bedsheet/mattress/pillow inventory handout during hostel check-in
- Mess card distribution
- Lost and found items
- Campus announcements and emergency contacts
- Staff coordination (who is on duty right now)
- Admin reporting and data exports

---

## The 5 Roles — Who Does What

There are five types of users. Each person only sees what they need to do their job.

### 1. Student
A registered hostel resident. Can:
- View their own hostel info and room number
- Report or browse lost & found items
- Read campus announcements
- See emergency contact numbers

### 2. Volunteer
A student worker assigned to a specific hostel. Can do everything a Student can, plus:
- **Must go Active at the start of every shift**
- Mark room attendance (Campus In / Campus Out) for their hostel's students
- Record inventory handout (mattress, bedsheet, pillow) and lock it when done
- Distribute mess cards
- See which fellow staff are currently on duty

### 3. Coordinator
Oversees multiple hostels. Can do everything a Volunteer can, plus:
- See combined stats across all their assigned hostels
- Post announcements
- View the full staff list and activity
- See inventory submission status across hostels

### 4. Admin
Campus-level manager. Can do everything a Coordinator can, plus:
- Manage lost & found items (update status, delete)
- Access all reports and CSV data exports
- View full activity logs

### 5. Super Admin
The master account. Can do everything an Admin can, plus:
- Import students, mess allocations, hostel assignments via CSV upload
- Export full PDF reports
- Manage all staff accounts (create, approve, deactivate)
- View the Master Table (all students in one searchable view)
- Purge and re-import staff lists

---

## Login Credentials

### Demo Accounts (for testing)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@iitm.ac.in | `qwerty` |
| Admin | admin@iitm.ac.in | `123456` |
| Coordinator | coordinator@iitm.ac.in | `123456` |
| Volunteer | volunteer@iitm.ac.in | `123456` |
| Second Volunteer | volunteer2@iitm.ac.in | `123456` |
| Student (any) | student1@iitm.ac.in … student60@iitm.ac.in | `123456` |

### Staff Added via CSV Import
When the Super Admin imports staff accounts from a CSV file, each person's **initial password is their contact/phone number** from the CSV. If no phone number is in the file, the password defaults to the part of their email before the `@` sign.

Example:
- CSV row: `Name: Rahul Singh, Email: rahul@iitm.ac.in, Contact: 9876543210`
- Login: `rahul@iitm.ac.in` / Password: `9876543210`

Staff should change their password after first login.

---

## How the System Works — Step by Step

---

### Flow 1: Daily Room Attendance (Volunteer)

This is the core daily workflow. Every morning/evening, a volunteer opens the app and marks who is on campus.

**Step 1 — Go Active**
When the volunteer opens the app, they see a "Shift Not Active" screen with a green **Go Active** button. They must tap this before anything else unlocks. This tells the system they are on duty.

> The system auto-deactivates them if they go 10 minutes without any activity. The volunteer app sends a silent "heartbeat" every 5 minutes while they are active.

**Step 2 — Open Attendance & Inventory**
After going active, the volunteer taps "Mark Attendance & Inventory" from the home screen. They see a list of all students in their assigned hostel.

**Step 3 — Mark Each Student**
For each student card, the volunteer can:
- Tap **Campus In** — student is on campus (green pill)
- Tap **Campus Out** — student is not present (orange pill)
- Check the boxes: **Mattress ✓**, **Bedsheet ✓**, **Pillow ✓** — recording which items were handed to the student
- Toggle **Mess Card Given** — marks whether the mess card was distributed

**Step 4 — Submit & Lock Inventory**
Once all items are confirmed for a student, the volunteer taps **Submit Inventory**. This permanently locks the record — no one can edit it again (not even the volunteer). This prevents mistakes after the fact and ensures data integrity.

> A locked record shows a padlock icon. If a genuine error was made, only a Super Admin can unlock it from the admin panel.

**Step 5 — Mess Card Distribution**
Separately, the volunteer can go to the **Mess Cards** tab and toggle "Card Given" for each student. This is a simple yes/no toggle per student — no quantities, no meal-by-meal tracking.

---

### Flow 2: Student Check-In Process (Volunteer)

When a new student checks in to the hostel:

1. Volunteer finds the student's card in the attendance list
2. Marks them **Campus In**
3. Checks off the inventory items (mattress, bedsheet, pillow) that were handed to them
4. Taps **Submit Inventory** — this locks the record as "handout complete"

The student's profile now shows their room number, hostel, and confirmed inventory items.

---

### Flow 3: Reporting Lost Items (Any User)

Any logged-in user — student or staff — can report a lost or found item:

1. Go to the **Lost & Found** tab
2. Tap **Report Item**
3. Enter: title (e.g. "Blue water bottle"), description, and location found/lost
4. Submit

Admin and above can update the status of items (Active → Claimed → Resolved) or delete old entries.

---

### Flow 4: Importing Students in Bulk (Super Admin)

When a new batch of students needs to be added to the system:

1. Super Admin goes to **CSV Import**
2. Downloads the **Students Template** to see the correct column format
3. Fills in the spreadsheet: Name, Email, Roll Number, Phone, Hostel Name, Room Number, Mess Assignment, Area
4. Uploads the filled CSV
5. The system creates accounts for all students. Each student's password defaults to their email prefix (e.g. `21f3001234`) unless a `password` column is included.

Similarly, hostel assignments and mess allocations can be bulk-updated via separate CSV uploads — without re-creating accounts.

---

### Flow 5: Importing Staff in Bulk (Super Admin)

1. Download the **Staff Template** — columns: Email, Name, Contact Number, Gender, Role
2. Fill in the sheet. Roles accepted: `Volunteer`, `Coordinator`, `Admin`, `Super Admin`
3. Upload the CSV
4. Each new account's password = their contact number from the sheet

Optional: tick **Purge existing staff** before importing to wipe all current staff accounts and start fresh. The Super Admin calling the import is never deleted.

After importing, each new staff member can log in with their email and contact number as password.

---

### Flow 6: Monitoring Who Is On Duty (Admin / Coordinator)

The **Staff Status** screen shows every staff member and whether they are online or offline right now.

- **Green dot** = Active (logged in and sent a heartbeat within the last 10 minutes)
- **Grey dot** = Offline (inactive or not logged in)

The list refreshes every 5 seconds automatically. No manual refresh needed.

Staff can also mark themselves Active/Inactive with a custom remark (e.g. "Doing room inspection", "On break").

---

### Flow 7: Viewing Reports & Exporting Data (Admin / Super Admin)

From the **Reports** or **Activity Logs** screens:

- Download **attendance CSV** for any date
- Download **inventory CSV** showing which students received items
- Download **full PDF report** of all campus activity
- Download **activity logs** showing who did what and when
- View hostel occupancy charts and attendance summaries

PDF exports are generated server-side and download directly to the device.

---

## Key Rules to Know

| Rule | Detail |
|------|--------|
| Volunteers must go Active first | The home screen blocks all content until they press "Go Active" |
| Inventory lock is permanent | Once a volunteer submits inventory for a student, no one can edit it (except Super Admin unlock) |
| 10-minute auto-inactive | If a volunteer/admin stops using the app for 10 minutes, their shift ends automatically |
| Hostel scoping | Volunteers only ever see their own hostel's students. Coordinators see all their assigned hostels. Super Admin sees everything |
| Heartbeat | The app silently pings the server every 5 minutes while a shift is active to keep it alive |

---

## Accessing the System

| Platform | URL / Method |
|----------|-------------|
| **Web Admin Panel** | `https://campusops-api-production.up.railway.app/` |
| **Mobile App** | Scan the Expo Go QR code (development) or install the EAS build |
| **API Base** | `https://campusops-api-production.up.railway.app/api` |

The web admin panel is the full desktop experience with charts, tables, and bulk operations. The mobile app is optimized for field use — attendance marking, inventory, and mess cards work best on phone.

---

## Quick Reference — Passwords Summary

| Who | Initial Password |
|-----|-----------------|
| Demo Super Admin | `qwerty` |
| All other demo staff/students | `123456` |
| Staff imported via CSV | Their **contact number** from the CSV |
| Students imported via CSV | Their **roll number** (or email prefix if no password column) |

---

*CampusOps — Built for IIT Madras BS · Designed by Kartik Chilkoti*
