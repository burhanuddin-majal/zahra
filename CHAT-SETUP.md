# Kitty Club chat setup (parent/guardian only)

The website's chat interface is committed, but it stays disconnected until an adult completes this setup. Do not publish or share any service-role key.

## 1. Create the backend
1. A parent/guardian creates a Supabase project at https://supabase.com/ and keeps the dashboard private.
2. In **SQL Editor**, run the contents of `supabase/schema.sql`.
3. In **Project Settings → API**, copy the Project URL and anon/public key into the two placeholders near the top of `script.js`. The anon key is designed for browser use; never put the service-role key in website files.
4. In Authentication settings, enable email confirmation, set reasonable rate limits, and configure the allowed site URL to `https://burhanuddin-majal.github.io/zahra/`.

## 2. Configure the guardian email sender
1. A guardian creates a Resend account and verifies a sending domain if required: https://resend.com/.
2. Deploy both Edge Functions in `supabase/functions/request-access/index.ts` and `supabase/functions/approve-access/index.ts`.
3. Set these Edge Function secrets in Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GUARDIAN_EMAIL`, `RESEND_API_KEY`, and optionally `EMAIL_FROM`. Set them in the Supabase dashboard/CLI, never in GitHub files. Use the guardian's email only in the private secret setting.
4. Deploy functions with JWT verification enabled for `request-access`. The approval link function must allow unauthenticated GET requests because the guardian opens it from email; it validates a random, hashed, one-use token that expires after 24 hours.
5. Check the sender's email-domain requirements before expecting delivery. Test with the guardian's own account first.

## 3. Test before inviting anyone
- Create a test account, confirm its email, sign in, then request approval.
- Check the guardian receives the email and that the one-use link approves only that account.
- Confirm a non-approved account cannot read or post messages; test with a second account.
- Add adult moderation and a clear report/block process before allowing children to use this chat. Supabase RLS controls who can access messages, but this starter does not provide a full moderation dashboard, automated abuse detection, or a message-reporting workflow yet.
- Do not store IP addresses. Use account approval, rate limits, and minimal data instead.

## Important limitations
- The chat is **not live until backend setup is complete**.
- The parent/guardian must supervise use and decide who may join. Do not put school names, real names, addresses, phone numbers, photos, or passwords in chat.
- GitHub Pages is static hosting; it cannot securely send email by itself.
