# 🧠 Project Memory & System Context
## ApartmentMS – Historical Knowledge Base & Solved Gotchas

This document serves as the persistent memory repository storing historical architectural decisions, domain logic formulas, resolved technical gotchas, and system context for ApartmentMS.

---

### 1. Key Business Logic Formulas

| Logic Domain | Algorithm / Formula | Implementation Location |
| :--- | :--- | :--- |
| **Society Acronym** | Take first letter of each word in society name upper-case (e.g. `Green Valley Society` → `GVS`). | `Flats.jsx` (`getSocietyAcronym`) |
| **1-to-1 Parking Tag** | `Acronym + "-P-" + Pad2(flatIndex + 1)` (e.g. `GVS-P-01` for flat `GVS-01`). | `Flats.jsx` (`calcParkingForFlatNumber`) |
| **Floor Index Calculation** | `Math.floor(flatIndex / flatsPerFloor) + 1` | `Flats.jsx` (`calcFloorForFlatNumber`) |
| **BHK Auto Presets** | Position `0,1` → `2BHK` (₹12k rent/₹2k maint), `2` → `3BHK` (₹18k/₹3k), `3` → `4BHK` (₹25k/₹4k). | `Flats.jsx` (`calcBHKForFlatNumber`) |

---

### 2. Solved Technical Gotchas

| Issue ID | Diagnostic Symptom | Root Cause | Permanent Resolution |
| :--- | :--- | :--- | :--- |
| **GOT-01** | PowerShell `npm` script execution policy error | Windows ExecutionPolicy restriction on `.ps1` scripts | Execute commands via `cmd /c npm run build` or `cmd /c npm run dev` |
| **GOT-02** | Parking showing "Not assigned" on resident dashboard despite flat assignment | `Flat.parkingSlot` string stored, but `Parking` collection document not linked | Added `syncParkingForFlat` helper & auto-sync logic on `GET /my-slot` endpoint |
| **GOT-03** | Sidebar bottom options overflowing screen | Sidebar missing `flex flex-col` & fixed height constraints | Refactored `Sidebar.jsx` with `flex flex-col h-screen` and `<nav className="custom-scrollbar overflow-y-auto">` |
| **GOT-04** | Resident vehicle plate edit security bypass | Lack of state locking on vehicle submission | Added `detailsSubmitted` boolean flag to `Parking` schema & enforced backend verification |
