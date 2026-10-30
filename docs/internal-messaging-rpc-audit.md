# Internal messaging RPC authorization audit

Read-only live function definition inspection, 2026-10-29. No messages were read or sent, and no RPC was invoked.

## Findings

- All inspected messaging RPCs are `SECURITY DEFINER`. They check `private.is_reliefbridge_internal_user(auth.uid())`, which requires an active owner/admin/manager/staff profile, active organization, and either platform membership or a communications capability.
- Read, acknowledge, archive, trash and restore functions scope recipient updates to `auth.uid()`; sender trash/restore scopes sender changes to `auth.uid()`.
- `get_sent_message_recipients` returns recipients only for messages sent by `auth.uid()`.
- The **nine-argument** `send_internal_message_multi` validates active recipients, **same-organization membership**, priority, nonempty content, and reply-thread participation. Its authenticated EXECUTE grant was observed in the earlier inventory.
- The **six-argument** legacy overload does **not** contain the same-organization recipient check, but its authenticated and anonymous EXECUTE grants were both observed as denied in the earlier inventory.
- **Potential policy gap:** the three-argument `send_internal_message(target_recipient, message_subject, message_body)` checks both parties are eligible internal users but does **not** check that sender and recipient belong to the same organization. The earlier inventory showed authenticated EXECUTE is granted. If cross-organization internal messaging is not intended, this is a security boundary discrepancy requiring a controlled fix.
- The internal-user helper accepts a target UUID to validate eligibility; the caller's own identity is checked separately by the messaging RPCs.

## Required follow-up

1. Confirm whether one-to-one cross-organization staff messaging is intentional. Do not assume it is authorized merely because the function permits it.
2. If not intentional, add a sender/recipient organization equality check to the three-argument send RPC, using a reviewed migration and synthetic-account regression tests.
3. Confirm the legacy six-argument overload remains non-executable by client roles and has no privileged wrapper.
4. Test cross-organization denial, disabled staff, disabled organizations, revoked communications capability, unauthorized reply targets, and sender/recipient message isolation using synthetic accounts.
5. Keep all messaging private; do not expose it as a public partner API.

**No live messages or customer records were accessed, and no database or application changes were made.**
