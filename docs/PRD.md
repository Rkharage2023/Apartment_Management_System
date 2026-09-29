# Product Requirement Document (PRD)
## Apartment Management System (ApartmentMS)

---

## 1. Feature Matrix & System Scope

```mermaid
mindmap
  root((ApartmentMS PRD))
    Authentication
      JWT Bearer Tokens
      Role Based Access
      Default Password Setup
    Society & Flats
      Multi-Society Config
      Auto Flat Numbering
      Floor Index Calc
    Parking System
      1-to-1 Flat Tagging (GVS-P-01)
      Resident Vehicle Lock
      Admin Overrides
    Billing & Payments
      Bulk Bill Generation
      Parking Rate Billing
      Razorpay & Cash
    Gate Security
      Visitor Gate Pass
      Entry / Exit Logs
      Pre-approvals
```

---

## 2. User Roles & Permission Matrix

| Role | Access Scope | Society Config | Flat Management | Vehicle Lock Override | Bulk Billing | Visitor Approval |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **System Admin** | Global System Access | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Resident (Owner/Tenant)** | Self Flat & Parking | ❌ Read Only | ❌ Read Only | ❌ Submit Only | ❌ Pay Only | ✅ Pre-approve |
| **Security Guard** | Gate & Parking Logs | ❌ None | ❌ Read Only | ❌ None | ❌ None | ✅ Verify Pass |
| **Maintenance Staff** | Complaints & Waste Logs | ❌ None | ❌ Read Only | ❌ None | ❌ None | ❌ None |

---

## 3. Vehicle Registration & Locking Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Resident
    participant App as Frontend (MyParking)
    participant API as Backend API
    participant DB as MongoDB Database
    actor Admin

    Resident->>App: Login & Open "My Parking"
    App->>API: GET /api/v1/parking/my-slot
    API->>DB: Query parking by assignedTo or Flat
    DB-->>App: Return Slot (detailsSubmitted: false)
    App-->>Resident: Show Vehicle Details Form

    Resident->>App: Input Plate No, Type, EV Choice & Submit
    App->>API: PUT /api/v1/parking/my-slot/vehicle-info
    API->>DB: Set vehicleNumber, detailsSubmitted=true
    DB-->>App: Return Success + Locked Slot
    App-->>Resident: Render "🔒 Details Locked" View

    Note over Resident,App: Subsequent edits blocked for Resident

    Admin->>API: PUT /api/v1/parking/:id (Override)
    API->>DB: Update slot details or detailsSubmitted flag
    DB-->>Admin: Return Updated Parking Slot
```

---

## 4. Flat & Parking Auto-Assignment Matrix

| Flat Number Format | Society Acronym | Derived Floor | Default BHK | Auto-Generated Parking Tag |
| :--- | :--- | :--- | :--- | :--- |
| **GVS-01** | GVS | Floor 1 | 2BHK | `GVS-P-01` |
| **GVS-02** | GVS | Floor 1 | 2BHK | `GVS-P-02` |
| **GVS-03** | GVS | Floor 1 | 3BHK | `GVS-P-03` |
| **GVS-04** | GVS | Floor 1 | 4BHK | `GVS-P-04` |
| **GVS-05** | GVS | Floor 2 | Penthouse | `GVS-P-05` |

---

## 5. Billing & Payment Workflow

```mermaid
flowchart LR
    A[Admin Opens Billing Module] --> B{Select Bill Type}
    B -->|Maintenance| C[Pull Flat Maintenance Charge]
    B -->|Parking Charge| D[Query Parking Slot MonthlyCharge]
    B -->|Rent| E[Pull Flat Monthly Rent]
    C --> F[Execute Bulk Generation]
    D --> F
    E --> F
    F --> G[(Generate Invoice Records)]
    G --> H[Resident Pays Online / Cash]
    H --> I[Update Status: PAID & Send Receipt]
```

---

## 6. Non-Functional Requirements & Performance Benchmarks

| NFR Domain | Requirement Metric | Target Standard | Compliance Method |
| :--- | :--- | :--- | :--- |
| **Page Load Speed** | First Contentful Paint (FCP) | $< 1.2\text{s}$ | Vite asset bundling & React lazy load |
| **Build Efficiency** | Production Build Time | $< 2.5\text{s}$ | Rolldown / Vite tree-shaking |
| **Security** | Auth Token Expiration | 24 Hours | JWT Bearer Token validation |
| **Layout Flexibility** | Mobile Drawer & Sticky Sidebar | 100% Viewport Height | CSS Flexbox + `custom-scrollbar` |
