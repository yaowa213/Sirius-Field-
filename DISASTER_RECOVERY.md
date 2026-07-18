# Sirius Field: Disaster Recovery & Backup Strategy (v2.0)

## 1. Data Backup Schedule
To ensure "Boardroom-Grade" reliability, the system employs a tiered backup architecture that separates structured state from heavy unstructured assets.

| Data Type | Backup Frequency | Method | Retention |
| :--- | :--- | :--- | :--- |
| **Audit & Survey Data** | Continuous (WAL) | Incremental hourly snapshots + Full daily | 5 Years |
| **Audit Logs** | Real-time | Append-only stream to secondary immutable vault | Indefinite |
| **Photos & Attachments** | Daily | Geographic replication (Mirroring) | Parent Life-cycle |
| **Exports (PDF/XL)** | On-Creation | Stored in immutable object storage with versioning | 7 Years |
| **System Config/Briefs** | Daily | Snapshot of system configuration and bulletin state | Indefinite |

---

## 2. Recovery Procedures (Playbook)

### Scenario A: Accidental Data Deletion
*   **Trigger**: Unauthorized or accidental "Soft Delete" of a critical audit.
*   **Procedure**: 
    1. Admin initiates "Audit Reinstatement" via `compliance` metadata.
    2. System restores `deletedAt` to `null`.
    3. Change is logged in the `AuditLog` with actor attribution and justification.
*   **Status**: No data loss.

### Scenario B: Corrupted Export Files
*   **Trigger**: A 4k photo fails to render in a PDF or a CSV is malformed.
*   **Procedure**: 
    1. Admin triggers "Atomic Reconstruction" for the specific `ExportID`.
    2. System verifies the `dataHash` of original Golden Source records.
    3. If hash matches, a fresh file is generated using the *exact same* source data version.
*   **Status**: File integrity restored.

### Scenario C: Lost or Damaged Mobile Device
*   **Trigger**: Team Leader device is stolen or physically destroyed.
*   **Procedure**: 
    1. IT provisions a new device with Sirius Field.
    2. Team Leader authenticates.
    3. System triggers "Golden Sync," pulling all non-superseded, approved records from the last 12 months.
    4. Local Drafts not synced before loss are considered unrecoverable (minimized by 30-day purge rule).
*   **Status**: Operational within minutes.

### Scenario D: Partial or Full Backend Outage
*   **Trigger**: Regional server failure or database lock.
*   **Procedure**: 
    1. **Client Side**: Mobile app automatically detects `SyncStatus.PENDING` and continues in **Offline Mode**.
    2. **Field Work**: Team Leaders continue store audits normally. Submissions are queued in LocalStorage.
    3. **Resolution**: Once backend is restored, background workers initiate `reconcileOfflineData()` in batches to avoid CPU throttling.
*   **Status**: Field operations continue without interruption.

---

## 3. RPO & RTO Targets

*   **Recovery Point Objective (RPO)**:
    *   **Approved Data**: **Zero Data Loss**. Every approved record is mirrored across two geographic regions before the client receives a "Success" response.
    *   **In-Progress Drafts**: **Max 30 minutes**. Clients are optimized to sync changes to the cloud every 30 minutes or on store clock-out.
*   **Recovery Time Objective (RTO)**:
    *   **Critical Field Operations**: **Near-Zero**. The app is structurally designed to work without a backend connection indefinitely.
    *   **Administrative Reporting**: **< 2 Hours**. Infrastructure can be redeployed to secondary nodes in under 120 minutes.

---

## 4. Roles & Responsibilities

### Admin (Ops Center)
*   **Integrity Verifier**: Must run `verifyDataIntegrity()` weekly to ensure local hashes match cloud backups.
*   **Recovery Orchestrator**: Authorized to trigger soft-delete reversals and export reconstructions.
*   **Legal Liaison**: Responsible for activating `SYSTEM_LEGAL_HOLD` during active litigation.

### Team Leader (Field)
*   **Local Custodian**: Responsible for ensuring their device enters a "Synced" state at least once every 24 hours.
*   **Frontline Auditor**: Continues field work during outages; notifies Ops Center only if sync fails for > 48 hours.

---

## 5. Audit Readiness & Defense
Every recovery action is self-documenting. The system maintains a "Chain of Custody" by linking every restored record back to the specific backup snapshot used for the recovery, ensuring legal defensibility in the event of a regulatory audit.