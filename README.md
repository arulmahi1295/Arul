# GreenHealth LIMS

GreenHealth LIMS (Laboratory Information Management System) is a comprehensive web-based application designed to streamline pathology lab operations, from patient registration to report generation.

## 🚀 Key Features

- **Patient Registration**: easy entry of patient details with auto-synchronization of Age and DOB.
- **Phlebotomy & Order Management**: Create orders, select tests, and track sample collection status.
- **Accession Module**: Centralized tracking for sample reception, lab assignment (In-House vs. Outsourced), and Turnaround Time (TAT) monitoring.
- **Result Entry & Reporting**: Enter test results, automatic flag for abnormal values, and generate PDF reports with digital signatures.
- **Billing & Finance**: Track daily revenue, manage dues, and view financial history.
- **Admin Dashboard**: Manage users, lab configurations, and view operational statistics.

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite)
- **Styling**: Vanilla CSS / Tailwind CSS
- **Database**: Firebase Firestore (Live Cloud Storage)
- **Deployment**: Vercel (SPA Routing Configured)

## 📦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blood-collection-lis
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will run at `http://localhost:5173`.

## ☁️ Firebase Configuration

The application is configured to use the `greenhealth-lis` Firebase project. Configuration is located in `src/lib/firebase.js`.
Ensure your environment supports Firebase SDK connections.

## 🚀 Deployment

This project is configured for seamless deployment on Vercel.
- **Configuration**: `vercel.json` is set up to handle Single Page Application (SPA) routing/rewrites.
- **Trigger**: Pushing to the `master` branch will automatically trigger a new deployment.

## 📚 User Guide

For detailed instructions on how to use the application, refer to the [User Guide](USER_GUIDE.md).
