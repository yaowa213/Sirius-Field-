
# Sirius Field: Production Guide

## Environment Configuration
Ensure `api.isDevMode()` is disabled. The `DevRoleSwitcher` component in `App.tsx` depends on this flag.

## Role RBAC Enforcement
- **Admin**: Has access to `SupervisorDashboard`, `ExecutiveAnalytics`, `ExcelAuditExport`, and Brief Creation.
- **Team Leader**: Focused on `DashboardScreen` and `StoreVisitScreen`. Can only read active Briefs.

## Data Life-Cycle
1. **Submission**: LocalStorage with `SyncStatus.PENDING`.
2. **Reconciliation**: Background worker triggers `api.reconcileOfflineData()`.
3. **Audit**: Admins can trigger "Redo" which marks current records as `superseded: true`.
4. **Reporting**: Only `SyncStatus.SYNCED` and `superseded: false` records are included in reports.

## Disaster Recovery
If a device's LocalStorage is corrupted, perform a "Full Sync" by clearing the site data and re-authenticating while online. The "Golden Source" on the server is the source of truth.
