# TODO

## Done
- [x] Collect comedian name + video link via submission form
- [x] Add email field so comedians can be contacted directly
- [x] Allow admin to filter submissions by status
- [x] Add pagination to admin dashboard (25 per page)
- [x] Let comedians upload a headshot alongside the video link (requires BLOB_READ_WRITE_TOKEN)
- [x] Add a closing date / deadline notice to the submission page (set CLOSING_DATE env var)
- [x] Public "applications closed" toggle for off-season (set APPLICATIONS_OPEN=false)
- [x] Mobile polish — card view in admin, larger tap targets, no iOS zoom on form fields
- [x] Normalise pasted video/Instagram links so admin links aren't broken
- [x] Keep a local draft of the submission form so leaving the page doesn't lose it
- [x] Let admin delete submissions (with confirmation)
- [x] Ask submitters whether they have tattoos, and let them ask questions
- [x] Make every field required except questions
- [x] Ask about doing multiple shows when more than one date is offered
- [x] Export the booked lineup as a PDF from the admin dashboard
- [x] Admin polish — sort order, "/" to search, denser desktop table, notes no longer lost when a save fails

## Up Next
- [ ] Send confirmation email to comedian on submission
- [ ] Add email notifications to admin on new submission

## Ideas / Future
- [ ] Server-side pagination for very large submission sets
- [ ] Bulk status update in admin
