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
- [x] Write and store reusable email templates in the admin (`/admin/templates`)
- [x] Split the admin into Applicants and Booked tabs — booking someone moves them across
- [x] Pick which nights a booked comedian is on, and flag dates that already have a comic
- [x] Admin table fits the screen — no sideways scrolling, one-tap status, notes fold away
- [x] Hide declined comedians from the working list, behind the Declined card
- [x] Submission form says what's missing per field, and shrinks big headshots itself
- [x] Open and close show nights from the admin — closed nights leave the public form
- [x] Booked contacts list (names + emails), with each comedian's nights behind a toggle

## Up Next
- [ ] Send confirmation email to comedian on submission
- [ ] Add email notifications to admin on new submission
- [ ] Pick a template straight from a submission row, instead of via the templates page

## Ideas / Future
- [ ] Server-side pagination for very large submission sets
- [ ] Bulk status update in admin
