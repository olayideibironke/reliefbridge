begin;

-- Apply after production uses submit_website_intake for website submissions.
drop policy "Public can submit demo requests" on public.demo_requests;
revoke insert on table public.demo_requests from public, anon, authenticated;

commit;
