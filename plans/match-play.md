# Match Play Improvements Plan

## Context

Match play team management currently lacks captain tracking, canonical group name management, and bulk import/export. Teams have a free-text `groupName` field with no validation against a master list, no way to associate captains with teams, and no bulk operations. This plan adds those capabilities across 7 work items.

---

## 1. Database: `teamCaptain` Junction Table

**Files:**

- `packages/database/src/schema/schema.ts` — add `teamCaptain` table
- `packages/database/src/schema/relations.ts` — add relations
- `packages/database/src/schema/index.ts` — already exports `*` from schema (no change needed)

**Table definition:**

```
teamCaptain: id (int PK auto), teamId (int FK→team.id), contactId (int FK→contact.id)
```

**Relations:**

- `teamCaptainRelations`: one team, one contact
- Update `teamRelations`: add `many(teamCaptain)`
- Update `contactRelations`: add `many(teamCaptain)`

**Apply:** `pnpm db:push` for dev, generate migration for prod later.

---

## 2. Database: `matchPlayGroup` Lookup Table

**Files:** same schema files as above

**Table definition:**

```
matchPlayGroup: id (int PK auto), year (int), groupName (varchar 20)
```

No foreign keys to/from other tables (pure lookup). Unique constraint on (year, groupName).

---

## 3. Admin: Match Play Groups Management Page

**Files:**

- `apps/admin/src/app/(dashboard)/settings/match-play-groups/page.tsx` — replace placeholder
- `apps/admin/src/app/(dashboard)/settings/match-play-groups/actions.ts` — server actions
- `apps/admin/src/app/(dashboard)/settings/match-play-groups/groups-manager.tsx` — client component

**UI:** Year selector at top. Below it, an editable list of group names for that year with:

- Inline text input + "Add" button to add a new group
- Delete button (X) on each row to remove a group
- "Copy from Year" button to clone groups from a previous year

**Server actions:** `listGroupsAction(year)`, `addGroupAction(year, name)`, `deleteGroupAction(id)`, `copyGroupsAction(fromYear, toYear)`

---

## 4. Team Form: Group Name Dropdown from Lookup

**Files:**

- `apps/admin/src/app/(dashboard)/match-play/teams/team-form.tsx` — change groupName `<Input>` to `<Combobox>` populated from `matchPlayGroup`
- `apps/admin/src/app/(dashboard)/match-play/teams/actions.ts` — add `listGroupNamesAction(year)`
- `apps/admin/src/app/(dashboard)/match-play/teams/[id]/page.tsx` — fetch group names
- `apps/admin/src/app/(dashboard)/match-play/teams/new/page.tsx` — fetch group names

The combobox will re-fetch when the year field changes. Still allows free text entry as fallback (teams may need custom groups).

---

## 5. Team Form: Captain Management (Inline Add/Remove)

**Files:**

- `apps/admin/src/app/(dashboard)/match-play/teams/team-form.tsx` — add captains section below the form
- `apps/admin/src/app/(dashboard)/match-play/teams/actions.ts` — add captain CRUD actions
- `apps/admin/src/app/(dashboard)/match-play/teams/captain-list.tsx` — new component

**UI (shown only when editing an existing team):**

- Card section "Team Captains" below the main form
- List of current captains with name, email, phone, and a Remove button
- Combobox at the bottom to search contacts from the team's club and add them
- Server actions: `listTeamCaptainsAction(teamId)`, `addTeamCaptainAction(teamId, contactId)`, `removeTeamCaptainAction(teamCaptainId)`, `listClubContactsAction(clubId)` (returns contacts for the team's club)

---

## 6. Captain Export

**Files:**

- `apps/admin/src/app/(dashboard)/match-play/teams/page.tsx` — add "Export Captains" button
- `apps/admin/src/app/(dashboard)/match-play/teams/actions.ts` — add `listTeamCaptainsForExportAction(year)`

**Approach:** Reuse the existing ExcelJS client-side pattern. Columns: Year, Group, Club, Senior (Yes/No), Captain Name, Email, Phone. One row per captain (a team with 2 captains = 2 rows).

---

## 7. Season Import (Excel → Teams + Captains)

**Files:**

- `apps/admin/src/app/(dashboard)/match-play/teams/import-dialog.tsx` — new dialog component
- `apps/admin/src/app/(dashboard)/match-play/teams/actions.ts` — add `importTeamsAction`
- `apps/admin/src/app/(dashboard)/match-play/teams/page.tsx` — add "Import" button

**Approach:**

- Dialog with year input + file upload (.xlsx)
- Client reads the Excel file with ExcelJS, parses rows
- Expected columns: Group, Club, Senior, Captain Email (multiple captain columns or comma-separated)
- Client sends parsed data to `importTeamsAction(year, rows[])`
- Server action: deletes all existing teams (and their captains via cascade or manual delete) for that year, then creates new teams + captain associations
- Captains matched by email. Unmatched emails collected and returned as warnings
- UI shows results: X teams created, Y captains assigned, Z warnings

---

## Implementation Order

1. Schema changes (items 1 + 2) — foundation for everything else
2. Groups management page (item 3) — can be used immediately
3. Team form: group dropdown (item 4) — depends on item 2
4. Team form: captain management (item 5) — depends on item 1
5. Captain export (item 6) — depends on item 1
6. Season import (item 7) — depends on items 1 + 2

---

## Verification

- After schema changes: `pnpm db:push`, then rebuild admin container
- Groups page: create/delete groups, copy between years, verify they appear in team form dropdown
- Captain management: add/remove captains on a team, verify they persist
- Export: export captains for a season, open xlsx and verify columns/data
- Import: create a test spreadsheet, import it, verify teams + captains created, verify warnings for unknown emails
