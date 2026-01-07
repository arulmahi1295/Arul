# GreenHealth LIMS - User Manual

**Version:** 2.2
**Date:** January 2026

---

## 1. Getting Started

### Accessing the System
- **URL**: Open your deployment URL (or `http://localhost:5173` for testing).
- **Login**: Enter your credentials.
  - *Default Admin*: `admin` / `pass123`

### Dashboard Overview
The main dashboard provides a snapshot of daily operations:
- **Statistics**: Total patients, samples collected, pending reports, and revenue.
- **Activity Log**: Recent system actions.
- **Quick Actions**: Navigation to key modules.

---

## 2. Core Workflows

### Step 1: Patient Registration
1. Navigate to **Patient Registration**.
2. **Personal Details**: Enter Name, Age/DOB (auto-synced), Gender.
3. **Contact**: Phone number is mandatory for SMS alerts.
4. **Billing**: Select Payment Mode (Cash/Card/UPI).
5. Click **Register Patient**.
   - *Success*: You will see a confirmation modal with the new `Patient ID`.
   - *Action*: You can "Print Patient Card" or "Proceed to Test Selection".

### Step 2: Order Creation (Phlebotomy)
1. Navigate to **Phlebotomy**.
2. **Search**: Find the patient by Name or Mobile.
3. **Select Tests**: Search and add tests from the catalog.
   - *Total Amount* is calculated automatically.
4. **Save Order**: Click "Create Order".
   - Status becomes `Pending Collection`.
5. **Collection**: Click "Collect Sample" to mark samples as collected.
   - Status updates to `Collected`.

### Step 3: Accession & Outsourcing
*New in v2.2*
1. Navigate to **Accession**.
2. **Reception**: View pending collections. Click "Receive Sample" to acknowledge receipt at the central lab.
3. **Assignment**: Assign each test to a processing lab:
   - *In-House*: For tests done locally.
   - *Outsource*: Select a partner (e.g., Lal PathLabs, Thyrocare).
4. **Processing**: Once assigned, the order moves to `Processing` status.

### Step 4: Results & Reporting
1. Navigate to **Reports**.
2. **Entry**: Click "Enter Result" on a pending order.
3. **Input**: Fill in the observed values. The system flags abnormal values automatically.
4. **Verify & Save**: Click "Save & Verify".
5. **Print**: Click the "Print" icon to generate the PDF report with the digital signature.

---

## 3. Administration

### User Management
- Go to **Admin > Employee Management**.
- Add new Phlebotomists, Lab Technicians, or Managers.
- Deactivate users who have left the organization.

### Lab Configuration
- Go to **Admin > Lab Configuration**.
- **Digital Signature**: Upload a PNG signature to appear on all reports automatically.
  - *Note*: The image file size must be less than **500KB**. If your image is larger, please resize it before uploading.

### Data Management
- **Import/Export**: Use this to backup your data or migrate from an older system.

---

## 4. Troubleshooting

- **"System Error" on Login**: Check your internet connection.
- **Sync Issues**: Refresh the page. The system is connected to a live cloud database.
