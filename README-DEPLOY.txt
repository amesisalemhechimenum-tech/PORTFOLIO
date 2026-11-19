AMESI SALEM HECHIMENUM — PORTFOLIO DEPLOYMENT

The website files in this folder's root are the GitHub Pages version.
Upload the CONTENTS of this folder to the ROOT of your GitHub repository.
Do not upload this folder as a nested folder and do not upload only the ZIP.

IMPORTANT: The admin cloud backend requires one-time setup. Read:
SUPABASE-SETUP.md

Quick order:
1. Create a Supabase project.
2. Run supabase/schema.sql in Supabase SQL Editor.
3. Add your Supabase Project URL and anon/publishable key to
   javascript/supabase-config.js.
4. Create your private admin account in Supabase Authentication → Users.
5. Disable public sign-ups.
6. Upload the files at this folder's root to GitHub Pages and commit.
7. Open admin.html and sign in with your Supabase admin email/password.

Never place a Supabase service_role or secret key in the website.
GitHub Pages hosts the front end; Supabase stores services and enquiries.
