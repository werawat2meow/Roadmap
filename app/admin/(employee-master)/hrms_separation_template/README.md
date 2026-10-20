# HRMS Enterprise • Employee Separation Template (Phase 1)

Reusable **display-only** React component for the separation document. This is **not** an implementation of Employee Movement/Approval, and it does not read or write your database.

## Included
- `components/EmployeeSeparationTemplate.jsx`
- `components/EmployeeSeparationTemplate.module.css`
- `examples/ExampleUsage.jsx` with 100% fictional data

## Integration
1. Copy the component and CSS module together to a suitable directory in your Next.js App Router project.
2. In your existing `/admin/employee-movements` view or a dedicated preview modal, render `<EmployeeSeparationTemplate employee={employee} separation={separation} brand={brand} />`.
3. Resolve `employee` and `separation` via your existing authenticated, scoped API; map the return fields to the props shown in ExampleUsage.
4. Resolve brand assets from **your real branch master and trusted URLs**; don't hardcode branch identifiers or guess relationships. Example: a branch config keyed by an actual `branch_id` -> `{ name, logoUrl, backgroundUrl }` (mapping storage is your choice).
5. Keep approval/status updates separate from this component. Don't automatically turn transfers into resignation events.
6. Print from the browser (A4 landscape CSS print rules). PDF generation server-side can be added later if needed.

## Important
- Photos / backgrounds must be URLs authorized for the viewer; never pass permanent public URLs for sensitive employee photos unless your security model permits it.
- `RESIGN` stamp is configurable: `showResignStamp={false}` for other separation types.
- Status and separation fields are not inferred from employee master. Pass exact source values from your approved separation record; otherwise show `—`.
- There are no schema changes, new tables, or changes to Running Number / Permission / Employee Scope in this ZIP.
- Background assets may be a different authorized image per branch; CSS provides a neutral fallback when missing.
