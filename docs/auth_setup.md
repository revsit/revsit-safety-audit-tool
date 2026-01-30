# Authentication Setup Guide

This guide documents the process of creating and configuring test users for the Revsit Safety Audit Tool.

## 1. Database Cleanup (Fresh Start)
If the user database is corrupted or contains invalid manual entries, run the following SQL in the **Supabase SQL Editor**:

```sql
-- Drops problematic triggers and cleans auth/public tables
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DELETE FROM auth.identities;
DELETE FROM auth.users;

TRUNCATE public.profiles, public.fir_reports, public.fir_details, public.attachments, public.risk_assessments CASCADE;
```

## 2. Manual User Creation
Since programmatic creation can be blocked by rate limits or schema mismatches, users were created manually:

1.  Navigate to **Supabase Dashboard** -> **Authentication** -> **Users**.
2.  Click **Add User** -> **Create New User**.
3.  Enter the following details:
    - **Email**: `alex@revsit.com` / **Password**: `Revsit@2026`
    - **Email**: `sarah@revsit.com` / **Password**: `Revsit@2026`
    - **Email**: `david@revsit.com` / **Password**: `Revsit@2026`
4.  Ensure **Auto Confirm User** is checked.

## 3. Synchronizing Profiles & Roles
The `auth.users` table only stores credentials. To assign business roles (Engineer, Manager, Head), run the sync script:

```powershell
cd web
node scripts/sync-profiles.js
```

### Role Mapping
The script maps the emails as follows:
- `alex@revsit.com` -> **Safety Engineer**
- `sarah@revsit.com` -> **Safety Manager**
- `david@revsit.com` -> **Department Manager**

## 4. Verification
Log in to the Web App (`http://localhost:5173`) using the credentials above to verify that each user is redirected to the correct dashboard based on their role.
