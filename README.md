# QuantumOps

QunatumOps is a demo-ready Enterprise Asset & Resource Management System for the Odoo. It manages asset lifecycle, allocation and transfers, conflict-free shared resource bookings, maintenance approvals, audit cycles, notifications, logs, dashboards, and analytics.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: MySQL via Docker Compose
- ORM: Prisma
- Auth: JWT + bcrypt
- Uploads: local `backend/uploads`

## Run locally

```bash
npm install
npm run install:all
npm run db:up
cp backend/.env.example backend/.env
cd backend && npm exec prisma db push && npm run seed
cd ..
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:4000/api/health

## Demo users

All users use password `Password123!`.

| Role | Email |
| --- | --- |
| Admin | admin@assetflow.demo |
| Asset Manager | manager@assetflow.demo |
| Department Head | depthead@assetflow.demo |
| Employee | employee@assetflow.demo |

## Demo workflow

1. Login as Admin and create/edit departments, categories, and promote employees from Organization Setup.
2. Login as Asset Manager and register assets, allocate an available asset, attempt a double allocation, then create/approve a transfer.
3. Login as Employee and book a resource. Try an overlapping time slot to see rejection.
4. Raise a maintenance request and approve/start/resolve it as Asset Manager.
5. Create an audit cycle, mark assets verified/missing/damaged, then close the audit to lock it and update asset statuses.
6. Open Dashboard, Reports, and Logs & Alerts to show operational visibility.

## Implemented

- Employee-only signup and JWT login
- Backend RBAC middleware and service-level workflow checks
- Admin-only role promotion
- MySQL/Prisma normalized schema and seed data
- Asset directory, detail timeline, lifecycle states
- Allocation, returns with condition notes, transfer approvals
- Strict resource booking overlap validation
- Maintenance approval-before-work workflow
- Structured audit cycles with locked closure
- Role-scoped dashboard KPIs, reports, notifications, and activity logs
