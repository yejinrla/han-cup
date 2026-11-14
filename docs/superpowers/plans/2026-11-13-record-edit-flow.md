# Record editing flow repair

User reports difficulty finding the edit form and awkward navigation. Confirmed current form renders outside the record, above the list; edit links drop the pagination cursor, and save leaves edit mode open even after changing the consumed date.

- [x] Add authenticated browser regression: edit on page 2 stays in its card; cancel preserves date/page and discards edits; save closes edit mode and selects the changed date.
- [x] Render edit form within the selected record, keep creation form separate, preserve cursor on edit/cancel, and focus/scroll the opened form with reduced motion support.
- [x] On successful edit, redirect outside the server-action catch to the saved date, retaining cursor only when the date stays the same. Show completion status. Keep create behavior and authorization unchanged.
- [x] Verify authenticated regressions, unit/DB suite, existing public browser suite, lint/type/build; review, commit/push and check deployment.

Verification: missing inline form regression observed RED before implementation; authenticated suite 6/6, public browser suite 25/25 and unit/DB suite 47/47 passed. Expanded edit regression also passed after adding same-date page retention and reduced-motion coverage. Lint, build, typecheck and diff whitespace checks passed. Mobile inline form screenshot inspected. Fresh reviewer found a reduced-motion inheritance issue; explicit instant scrolling fixes it. Auth ownership filters and RLS behavior preserved.
