# Mother and BHW progress — October 24, 2026

This handoff describes the reviewed local UI and workflow changes included in this update. The current Markdown PRD remains `docs/InaAlaga_PRD.md`; the older DOCX was not used. This is a demonstration with fictional records, not an operational clinical service.

## Included changes

- Mother Home combines the next scheduled visit, countdown, assigned worker and coordinating station. Completed visits appear in Visits history, not Home. Coordination is distinct from the actual visit destination.
- Visits groups the earliest unresolved appointment as Next visit, later appointments as Future visits, and completed/cancelled appointments as Previous visits. An unresolved appointment does not auto-complete when its time passes. Future visits use a soft orange tint; completed badges are green.
- BHWs can schedule home visits or station check-ups and add separate future appointments. Each appointment has its own outcome action. Exact-start duplicate appointments for a mother or scheduled worker are rejected; visit-duration and travel conflicts are not modeled.
- Station destinations are stored on the visit independently of the coordinating station. The mother's Station location button opens the correct saved destination. Stations has a selectable two-station list, appointment context and an OpenStreetMap embed/external map link. Approximate locations and unverified entrances remain labeled. Travel estimates are not implemented.
- A mother can request contact again after acknowledgment. Existing request and event history is retained, and an already-open request is not duplicated.
- Filipino mother-facing copy now covers Home, Visits, Stations, countdowns, request states and access/error screens. Proper names and stored station values remain intact; display names omit the demo suffix.
- BHW layout has a wider table, circular initials and left-aligned names. The detail panel has a compact mother/responsibility summary, full-width visits, grouped contact actions, collapsed discharge/history sections and a fixed title/Close control. The placeholder notification bell was removed from BHW.
- New BHW audit timestamps and mother contact-request timestamps use the real save time, stored as UTC and displayed in Asia/Manila. Contact-attempt inputs default to the current time. Existing historical records are not rewritten.
- Cancel closes the contact-attempt modal without saving.
- Reset moved to `/demonstration/settings`, linked from the BHW header's Demonstration label. It requires confirmation. Reset restores browser-local sample data across perspectives; other tabs hydrate the restored seed instead of retaining stale data. Database-mode reset is explicitly unavailable.

## Local validation

From `web/`:

```sh
npm ci
npm run lint
npm test
npm run build -- --webpack
npm run dev
```

The update passed 32 tests and a production webpack build. Lint reports no errors and one existing image optimization warning in `src/components/ui/AppBar.js`. Tests cover mother-link access, repeat requests, independent appointments, duplicate start times, automatic Next-visit promotion, station destination persistence, Filipino coverage, real action timestamps and cross-tab reset behavior. Browser checks covered mother pages, station selection/navigation, BHW detail actions, Cancel and reset confirmation. The user's browser records were not reset during final settings verification.

## Deployment handoff

1. The Next.js application root is `web/`. Keep private environment values outside Git. To reproduce the reviewed local workflow, use `NEXT_PUBLIC_DATA_SOURCE=mock`; this mode uses each browser's local storage and does not share records across devices.
2. For `NEXT_PUBLIC_DATA_SOURCE=supabase`, apply the new migrations in order after the existing initial schema:
   - `web/supabase/migrations/002_visit_station.sql` adds and backfills `visits.station_name` and checks the location type/destination relationship.
   - `web/supabase/migrations/003_multiple_upcoming_visits.sql` adds unique indexes preventing exact-start collisions.
3. Review existing data before applying the indexes: duplicate non-cancelled mother start times or duplicate scheduled worker start times will prevent migration 003 from completing. Migration 002 also requires existing station visits to have a resolvable coordinating station for its backfill. Resolve ambiguous records explicitly; the update does not delete or silently rewrite conflicting appointments.
4. Existing canonical station names in Supabase must match the seeded Tanza and Linao West names. Their demo suffix is hidden only at display time.
5. Supabase migrations were prepared but were not applied to a remote database during this work. Database-mode integration and hosted deployment must be checked separately; local browser verification used mock mode. The code does not automatically deploy or migrate a database when pushed.

## Deferred by request

- Schedule/status/countdown calculations still use the fixed October 19 demonstration clock (the mother countdown advances while mounted); audit timestamps use real time. Refreshing the mother page restarts that demonstration countdown base.
- Rescheduling/cancellation controls, preventing future completion times, a contact-request filter and automatic BHW list refresh remain follow-up work. Detail panels and mother views poll; the BHW Cases list itself still requires refresh/re-entry to fetch new data.
- No routing service, travel-time estimates, full-city station directory, real SMS or operational emergency monitoring is added.
- The facilitator perspective has not received the next planned review.
