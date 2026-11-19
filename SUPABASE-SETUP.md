# AMESI SALEM portfolio — cloud backend setup

Your website can remain hosted on GitHub Pages. Supabase provides the hosted database and admin authentication. **The backend is not live until you complete these one-time steps.** The ZIP deliberately contains placeholders, not private credentials.

## 1. Create the backend
1. Visit https://supabase.com and create a project.
2. In the project, open **SQL Editor → New query**.
3. Paste and run all SQL from `supabase/schema.sql`.
4. Open **Project Settings → API**. Copy the Project URL and the `anon` / publishable key.
5. Edit `javascript/supabase-config.js` and replace both `PASTE_...` placeholders.
   - The anon/publishable key is intended for browser use; database Row Level Security protects the data.
   - NEVER put the `service_role` or secret key in this website, GitHub, or a browser.

## 2. Create your private admin login
1. In Supabase open **Authentication → Users → Add user**.
2. Create an account using your private admin email and a strong password.
3. Disable public sign-ups in **Authentication → Providers → Email** if enabled. Only users you create in the dashboard should be able to sign in.
4. Open `admin.html` and sign in with that email/password. The old browser-only passcode is replaced by Supabase authentication.

## 3. Deploy
Upload the extracted ZIP contents to the root of your GitHub Pages repository, replacing the old files. Commit and wait for GitHub Pages to publish. Keep `supabase-config.js` populated with the project URL and anon key.

## 4. What works after setup
- Visitors' contact/enquiry form submissions are stored in the hosted `enquiries` table.
- You can open Admin → Messages on another device, read enquiries, mark them read, delete them, and save a reply against the enquiry.
- Admin → Services lets you add, edit, publish/unpublish and delete services. Published services appear on `services.html`.
- Admin access is protected by Supabase Auth and database Row Level Security.

## Important about replies
The reply is saved in the admin inbox record. This first version does **not** send an email automatically or create a visitor account/website chat thread. Use the customer's email link from the message to send the saved reply, or add an email provider later for automatic sending. Saving a reply in the dashboard alone does not notify the customer.

## Troubleshooting
- “Cloud backend is not configured”: check `javascript/supabase-config.js` and make sure the URL and anon key are correct.
- “Invalid login credentials”: create the admin user in Supabase Authentication → Users.
- “relation does not exist”: run `supabase/schema.sql` in the SQL Editor.
- “row-level security” / permission error: confirm the SQL ran completely and that you are signed in with the admin account.
