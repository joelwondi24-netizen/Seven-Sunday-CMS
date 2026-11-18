# Seven Sunday Ethiopia — Unified Corporate Management Platform

**Company:** Seven Sunday Manufacturing & Trading PLC  
**Brand:** Seven Sunday Ethiopia  
**Primary Slogan:** The Home of quality product  
**Secondary Slogan:** Together for a Stronger and Better Tomorrow  

## Architecture Overview

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Recharts, QRCode, PWA (`vite-plugin-pwa`)
- **Offline & Real-Time Local Storage:** IndexedDB (`SevenSundayERP_DB`) + `localStorage` snapshot mirror + `BroadcastChannel` multi-tab sync + background/manual mutation queue with UUID idempotency and explicit version conflict resolution.
- **Backend & Real-Time Sync:** Node.js + Express + `ws` WebSockets (`/ws`) + atomic persistent data store (`data/erp-db.json`).
- **Multilingual & Calendar:** English, Amharic (`አማርኛ`), Afaan Oromoo, Chinese (`中文`) UI + 4-language Official Document & Letter translation exchange + Dual Gregorian/Ethiopian Calendar.

## Implemented Modules

1. **Master Administration & Control Center**: Company branding, logo/stamp/signature upload, TIN & registration configuration, branches, departments (including Secretary Department), 16 RBAC roles + custom roles, user account management, login history, device management, SMTP settings, and safe Load/Clear Optional Sample Data.
2. **Executive Dashboard**: Real-time metrics computed from database records, Revenue/Expense/Inventory/Department charts, date & department filters, CSV & print export.
3. **Human Resources & Employees**: Staff registration (`SSE-EMP-XXXX`), RBAC-protected salary & bank fields, promotions/transfers/evaluations/disciplinary history, QR Staff ID Card generator & print.
4. **Secretary Department & Official Documents**: Incoming/outgoing correspondence desk + 20 official document templates + 4-language exchange (Amharic ↔ English ↔ Chinese ↔ Afaan Oromiffa) + letterhead, QR verification, print & HTML/PDF download.
5. **Attendance & Leave Management**: Daily check-in/out, overtime, Hikvision & ZKTeco CSV log import, correction requests, leave workflows.
6. **Payroll & Bonus Management**: Configurable Ethiopian income tax brackets & pension rates (7% / 11%), multi-step approval workflow, individual & bulk printable payslips, bonus calculator, CSV/Excel export.
7. **Inventory, Materials, GRN & GIN**: Multi-warehouse product catalog, barcode & QR labels, Goods Receiving Notes (GRN), Goods Issuing Notes (GIN), stock transfers, material requests, physical audits, and automatic stock balance updates.
8. **Procurement & Sales**: Supplier & Customer profiles, Purchase Orders, Quotations, Sales Orders, Invoices, Delivery Notes, auto-stock deduction & double-entry finance posting.
9. **Finance & Double-Entry Accounting**: Chart of Accounts, Payment/Receipt/Petty Cash Vouchers, Journal Ledger, Trial Balance, P&L, Balance Sheet, Budgets.
10. **Uniforms, Assets & Fleet**: Staff PPE/uniforms/equipment issuance & return tracking; vehicles, fuel, maintenance forms, and insurance expiry alerts.
11. **Internal Chat, Approvals, Audit, Sync & Reports**: WebSocket team chat & announcements, centralized approvals queue, immutable audit logs, IndexedDB sync & conflict resolution center, JSON backup & restore.

## Running Locally & Production

```bash
npm install
npm run dev      # Starts Express + WebSocket + Vite on port 3000
npm run build    # Builds production frontend bundle
npm start        # Runs production server on port 3000
```

## Default Accounts (Default Password: `SevenSunday@2026`)

- `admin` — Super Administrator
- `hr.manager` — Human Resource Manager
- `finance.mgr` — Finance Manager
- `secretary` — Secretary Department
- `warehouse` — Warehouse Manager
- `employee` — Employee
