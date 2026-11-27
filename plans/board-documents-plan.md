# Board Documents for MPGA (in the mpga admin)

## Context

The MPGA board needs a better way to work with documents, and more board members need access to them.

We've decided to **build** this ourselves.

Decisions:

- **Location:** inside the existing mpga admin, as a new **Library** area at `/library`. The name avoids a clash with the existing `/settings/documents` and `/match-play/documents` screens.
- **Access:** a new better-auth role, `board`, alongside the existing `admin` and `super_admin` roles. It is granted in user management. The `admin` and `super_admin` roles get library access automatically.
- **Document admins:** the users with the `admin` or `super_admin` role. They manage folders, restricted access, renames, moves, deletes and restores.
- **Members:** everyone with library access. They can view, download, upload, and add new versions.
- **Storage:** a new **private** S3 bucket, separate from the public `mpgagolf` bucket.
- **Publishing:** attaching a library file to a public page creates a **snapshot** of that version.

---

## 1. Feature list

**Access**

- A new `board` role, granted and revoked in user management by a super_admin.
- Users are invited through the existing admin invitation flow (an emailed link where they set their name and password), with the role set to `board`. After that they sign in with email and password.
- When a user loses the role, their sessions are revoked, so access ends on their next request. Download links they already have expire within 5 minutes.

**Folders**

- Nested folders, up to 4 levels deep.
- Document admins create, rename, move, and delete folders.
- **Restricted folders:** a document admin can limit a folder, and everything below it, to chosen users. For example, an Executive Committee folder. Other users can't tell the folder exists.
  - When restricted folders are nested, a user must be a member of **every** restricted ancestor to see a folder. Document admins always have access.

**Files**

- **Upload:** one or many files at once (drag and drop on a laptop, file picker on a phone). Each file can be up to **5 MB**. Files are sent one at a time, each with its own status.
- **Allowed types:** PDF, Word, Excel, PowerPoint, images (jpg, png, gif and webp, but not SVG), text, CSV, and markdown. The type is checked from the file's contents, not from the browser's reported type.
- **Preview:** PDFs and the allowed image types open in the browser. Every other type is always downloaded.
- **Versions:** uploading a new version of a file keeps the earlier versions, each with who uploaded it and when. Any version can be downloaded. A document admin can restore an earlier version as current. Restoring adds a new version; history is never deleted.
- **Changes by document admins:**
  - rename
  - move to another folder (with a warning if the move makes the file visible to more people)
  - delete, which moves it to Trash
  - restore from Trash
- File names must be unique within a folder. Rename and move fail with a clear message if the name is already taken.

**Search**

- Search by file name and by the text inside PDF, Word, Excel, text, CSV, and markdown files.
- Results show the folder path and a text snippet. They include only files the searcher can see, and never files in Trash.
- Scanned PDFs with no text layer, PowerPoint files, and images match by name only. If text extraction fails, the upload still succeeds and the file matches by name only.

**History and safety**

- Every change writes a row to a new `library_audit` table, in the same database transaction as the change itself. The recorded changes are:
  - create
  - rename
  - move
  - delete
  - restore
  - upload
  - new version
  - access change
  - publish
- Each file shows its version history.
- Files live in a **private** S3 bucket. A file becomes public only when a document admin attaches it to a tournament or another public page. That copies the chosen version into the public bucket as a snapshot.
- Every download or preview uses a short-lived signed link (5 minutes). The link is issued only after a permission check.

## 2. User experience

**Getting in**

- A user signs in at the admin with their email and password.
- A board-only user goes straight to the **Library** screen. Other admin areas don't appear in the menu, and a direct link to any of them redirects to Library.
- Admins see **Library** in the admin menu along with everything else.

**Browsing**

- **Laptop:** two panes.
  - Left: the folder tree, with a lock icon on restricted folders.
  - Right: the current folder's contents. Subfolders come first, then files, each showing name, type icon, last updated, updated by, size, and version count.
- **Phone:** one column. A breadcrumb trail sits at the top, followed by subfolders and then files. Tap targets are large.
- **Toolbar:** a search box and **Upload**. Document admins also get **New folder** and a folder menu (Rename, Move, Restrict access, Delete).
- **Empty folder:** "No documents yet. Upload one."

**Uploading**

- **Upload** opens a dialog with:
  - a drop zone or file picker
  - a list showing each file's status (pending, done, or error)
  - the target folder, which defaults to the current one
- Files over 5 MB or of a disallowed type are rejected before they're sent, with a clear message.
- If a file with the same name already exists in the folder, the member chooses between **Add as new version** and **Keep both**. Keep both saves the new file with a " (2)" suffix.

**A file**

- PDFs and images show an inline preview, using the browser's PDF viewer for PDFs. Other files show a type icon and a **Download** button.
- **Details:** folder path, size, current version, who uploaded it and when, and where it is published (if anywhere).
- **Actions:**
  - everyone: Download and **Upload new version**
  - document admins: also Rename, Move, Delete, and **Re-publish latest** (when the file is published)
- **Version history:** a list (v3, v2, v1) showing each version's uploader, date, and size, with a Download link. Document admins also get **Restore this version**.

**Search**

- Results list each file's name and folder path, with a snippet that highlights the match. Only files the member can see are included.

**Restricting a folder** (document admins)

- **Restrict access** opens a dialog that lists board members with checkboxes. Document admins are always included and are labeled as such.
- After saving, the folder shows the lock icon. Turning the restriction off makes the folder visible to the whole board again.

**Trash**

- Trash is for document admins only. Each deleted file or folder shows who deleted it and when, with a **Restore** button.
- Deleting a folder sends its whole subtree to Trash as one batch, and restoring the folder brings the batch back.
- If you restore an item whose parent folder is still in Trash, it goes to the root, or to a folder the admin picks.
- Nothing is purged automatically.

**Existing upload screens**

- The tournament, match-play and settings document dialogs default to **Choose from library**. A document admin picks a file, and the current version is published as a snapshot.
- If the chosen file is in a restricted folder, the admin must confirm before it's published.
- An **Upload new** tab keeps the current upload flow, with the same 5 MB limit and a clear error message.

---

## 3. Implementation plan

### 3.0 Problems found in the original draft (now resolved above)

| #   | Problem                                                                                                                                                                           | Resolution                                                                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The draft referred to the BHMC board and a Django "Board" group. This repo has no Django. Auth is better-auth (`apps/admin/src/lib/auth.ts`), with a single `user.role` per user. | Add a `board` role. The admin roles include library access automatically, so no group table is needed.                                                                                                                                                      |
| 2   | The draft relied on an "admin audit history" that doesn't exist. There are only `updateBy` columns.                                                                               | Add a new `library_audit` table, written inside the same `db.transaction` as each change.                                                                                                                                                                   |
| 3   | "Invited via email and OTP" contradicted "sign in with password". In this app, OTP is used only by the club-contact and captain portals.                                          | Reuse `lib/invitation.ts` with a role picker.                                                                                                                                                                                                               |
| 4   | Nothing currently stops a non-admin role from opening admin pages. `(dashboard)/layout.tsx` and `src/proxy.ts` only check that a session exists.                                  | Gate pages by role in the dashboard layout and filter the sidebar by role.                                                                                                                                                                                  |
| 5   | The 50 MB limit doesn't fit server-action uploads, which are capped at 1 MB by default.                                                                                           | Set the limit to 5 MB, send one file per action call, and set `bodySizeLimit: "6mb"` to leave room for multipart overhead. Also confirm the CapRover nginx `client_max_body_size` allows at least 6 MB. Next 16's proxy body limit (default 10 MB) is fine. |
| 6   | An S3 write can't be part of a database transaction.                                                                                                                              | Write the object to S3 first (under a UUID key), then write the rows and audit entry in one transaction. Objects left behind by a failed transaction are harmless, and a cleanup script can find them.                                                      |
| 7   | The draft didn't say how nested restricted folders combine.                                                                                                                       | A user needs membership in every restricted ancestor (intersection).                                                                                                                                                                                        |
| 8   | Moving a file out of a restricted folder could expose it without anyone noticing.                                                                                                 | Show a warning when a move widens who can see the file.                                                                                                                                                                                                     |
| 9   | Serving SVG or HTML files inline from signed URLs is an XSS risk.                                                                                                                 | Allow only jpg, png, gif and webp images, check magic bytes, and serve every non-preview type as an attachment.                                                                                                                                             |
| 10  | The draft didn't cover how search interacts with restrictions and Trash.                                                                                                          | Filter search results by visible folders and exclude anything in Trash.                                                                                                                                                                                     |
| 11  | Restoring folders and items from Trash wasn't defined.                                                                                                                            | Folder deletes are batched, and orphaned items restore to the root or a chosen folder.                                                                                                                                                                      |
| 12  | Name collisions on rename and move weren't handled.                                                                                                                               | Names are unique within a folder among items not in Trash.                                                                                                                                                                                                  |
| 13  | "Documents" collides with the existing menu entries of the same name.                                                                                                             | Call it **Library**, at `/library`.                                                                                                                                                                                                                         |
| 14  | `apps/admin/start.sh` applies only `--only=0006_wet_microbe`, so the new tables would never reach production.                                                                     | `start.sh` now applies every unrecorded journal migration (production records `0000` onward), so new migrations deploy automatically. `migrate.mjs` refuses to replay over a database with tables but no records.                                           |
| 15  | "Access ends on next request" depends on how sessions are cached.                                                                                                                 | No better-auth `cookieCache` is used today. Also revoke the user's sessions when their role is removed.                                                                                                                                                     |
| 16  | The draft didn't say who can publish files or what happens to restricted files.                                                                                                   | Only document admins can publish, and files from restricted folders need a confirmation first.                                                                                                                                                              |
| 17  | Text extracted from very large files could be very large.                                                                                                                         | Truncate extracted text at about 1 MB.                                                                                                                                                                                                                      |
| 18  | The draft said "chosen uses".                                                                                                                                                     | Corrected to "chosen users".                                                                                                                                                                                                                                |

### 3.1 Data model

New file `packages/database/src/schema/library.ts`, using MySQL and drizzle. It's exported from the schema index.

- **`library_folder`:** `id`, `parent_id` (null for top-level folders), `name`, `depth` (at most 4, enforced in code), `is_restricted`, `created_by`, `created_at`, `deleted_at`, `deleted_by`, `deleted_batch_id`
- **`library_folder_member`:** `folder_id`, `user_id`. Used only when the folder is restricted.
- **`library_file`:** `id`, `folder_id`, `name`, `current_version_id`, `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_at`, `deleted_by`, `deleted_batch_id`. The service enforces that names are unique within a folder among files not in Trash.
- **`library_file_version`:** `id`, `file_id`, `version_no`, `s3_key`, `size`, `content_type`, `original_name`, `uploaded_by`, `uploaded_at`, `restored_from_version_id`
- **`library_file_text`:** `version_id`, `body` (MEDIUMTEXT) with a `FULLTEXT(body)` index
- **`library_audit`:** `id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `details` (JSON), `created_at`
- **`document`:** gains `library_file_version_id`, a nullable foreign key that records which snapshot was published.

Generate the migration with `pnpm db:generate`. `apps/admin/start.sh` applies any unrecorded migration on deploy; keep migrations re-runnable (`CREATE TABLE IF NOT EXISTS`).

### 3.2 Roles and access

- **`apps/admin/src/lib/permissions.ts`:** add a `library` statement and a `boardRole`. Register the role in both `auth.ts` and `auth-client.ts`.
- **`apps/admin/src/lib/require-auth.ts`:** add two guards:
  - `requireLibraryUser()` allows board, admin and super_admin.
  - `requireDocumentAdmin()` allows admin and super_admin.
- **`lib/invitation.ts`, `accept-invitation/actions.ts`, `admin/invitations/*`:** add a role picker (admin or board). Change `createInvitation`, which currently hardcodes `"admin"`, and `registerInvitedUser`, which currently rejects any role but `"admin"`, so both accept either role.
- **`admin/users/actions.ts` (`setRoleAction`):** add `board` to the allowed roles. When a user loses access, call `auth.api.revokeUserSessions`.
- **`(dashboard)/layout.tsx`:** read the user's role. A `board` user requesting any path outside `/library` is redirected to `/library`. The layout passes the role to `components/app-sidebar.tsx`, which shows only Library to board users.
- **`apps/admin/src/lib/library/access.ts`:** a single `visibleFolderIds(user)` function. It loads the whole folder table (it's small) and applies the intersection rule. Every library action and search goes through it.

### 3.3 Storage (`apps/admin/src/lib/library/storage.ts`)

- **Env vars:** add `S3_LIBRARY_BUCKET` and `S3_LIBRARY_REGION`. The bucket has Block Public Access turned on. It needs no CORS rules because uploads go through the server.
- **Dependency:** add `@aws-sdk/s3-request-presigner`, used only for signed downloads.
- **`putLibraryObject(buffer, contentType)`:** reuses the S3 client setup in `apps/admin/src/lib/s3.ts` and writes to `library/{uuid}`.
- **`signedGetUrl(versionId, disposition)`:** checks access, then returns a URL that expires after 300 seconds. It sets `ResponseContentDisposition` (inline only for PDFs and images) and `ResponseContentType`.
- **`publishVersion(versionId)`:** uses `CopyObject` to copy the version into the public bucket at `${S3_MEDIA_PREFIX}/documents/{ts}-{name}`. That path is where `getMediaUrl` in `packages/types/src/media.ts` expects public documents.

### 3.4 Server actions

The actions live in `apps/admin/src/app/(dashboard)/library/actions.ts` and use the existing `ActionResult<T>` pattern.

- **Read:**
  - `listFolder`
  - `getFolderTree`
  - `getFile`
  - `getDownloadUrl`
  - `search`
- **Member:** `uploadFile(formData)` handles one file per call, in one of three modes: new file, new version, or keep both. It runs these steps in order:
  1. Checks access, the 5 MB limit, the extension allowlist, and the file's magic bytes.
  2. Writes the object to S3.
  3. Writes the database rows and the audit entry in one transaction.
  4. Runs text extraction and writes the result to `library_file_text`. The upload response doesn't wait for this step.
- **Document admin:**
  - folders: `createFolder`, `renameFolder`, `moveFolder`, `setFolderRestriction`, `deleteFolder`
  - files: `renameFile`, `moveFile`, `deleteFile`, `restoreVersion`
  - trash: `listTrash`, `restoreFromTrash`
- Every write goes through a function in `apps/admin/src/lib/library/service.ts`. These functions take a transaction and call `writeAudit(tx, …)`. The actions stay thin, and the tests target the service.
- **Config:** set `experimental.serverActions.bodySizeLimit: "6mb"` in `apps/admin/next.config.ts`.

### 3.5 Text extraction and search

Extraction lives in `apps/admin/src/lib/library/extract.ts`:

| File type     | Library                       |
| ------------- | ----------------------------- |
| PDF           | `unpdf`                       |
| Word (.docx)  | `mammoth`                     |
| Excel (.xlsx) | `exceljs` (already installed) |
| txt, csv, md  | read directly                 |

The extracted text is truncated at about 1 MB.

The search query combines two matches:

- `MATCH(body) AGAINST(? IN NATURAL LANGUAGE MODE)` on the extracted text
- a `LIKE` match on the file name

It then keeps only files in folders from `visibleFolderIds` and drops anything in Trash. The snippet is built on the server around the first match.

### 3.6 UI

The pages live under `apps/admin/src/app/(dashboard)/library/`:

- `page.tsx`: the two-pane browser. The current folder is held in a `?folder=` URL parameter, using nuqs.
- `file/[id]/page.tsx`: file details, preview, and version history.
- `trash/page.tsx`: document admins only.

The components live in `apps/admin/src/components/library/`:

- `folder-tree`, built from the `collapsible` component
- `folder-contents`, built from `table`
- `upload-dialog`, which extends `file-drop-zone.tsx` to take several files and upload them one after another
- `restrict-dialog`, a list of checkboxes
- `move-dialog`
- `version-list`
- `library-picker`, built from `command` and `dialog`

Add the shadcn `progress` component, and `scroll-area` if it's needed. Headings use `font-heading` and secondary-500. On mobile, the browser collapses to a single column with a breadcrumb.

### 3.7 Integration with existing upload screens

- Add `attachFromLibrary(versionId, …)` to these actions:
  - `tournaments/[systemName]/document-actions.ts`
  - `match-play/documents/actions.ts`
  - `settings/documents/actions.ts`

  It runs these steps:
  1. Runs `publishVersion`.
  2. Creates the `document` row, with `library_file_version_id` set.
  3. Calls `revalidatePublicSite`.

- The document dialogs open on the `library-picker` tab. The **Upload new** tab keeps the existing flow, and adds the 5 MB check.
- The file detail page lists where the file is published. It also offers **Re-publish latest**, which copies the current version over the published snapshot.

### 3.8 Build order

1. Schema, migration, and the `start.sh` change
2. Roles, invitations, and layout and sidebar gating
3. Storage and upload
4. Browse, file detail, and version UI
5. Folder administration, restriction, and Trash
6. Text extraction and search
7. Library picker in the existing upload screens
8. The migration script (section 4)

## 4. Migration

Existing documents are imported from a super-admin page, **Administration → Import documents** (`/admin/import-documents`), running inside the deployed app with its own database and AWS access. It shows a preview first and changes nothing until you import.

1. **Preview:** for every document not yet imported, the target folder and file name, and whether it will be skipped and why (no file, file missing from the public bucket, unsupported type, or contents that don't match the type). It checks each file exists and reads its first 16 KB.
2. **Folders:** tournament documents go under `Tournaments/{tournament name}/{year}`; everything else under `{document type}/{year}`. Documents without a year go straight into their type folder. Existing folders with the same name are reused.
3. **Files:** for each document, in batches of 20:
   1. Read the file from the public bucket and check its contents match its type. Files without an extension are recognised from their contents.
   2. Store it in the library bucket as version 1, dated from the document's `lastUpdate`.
   3. Link the document to that version in `library_publication`. `document.file` is unchanged, so public pages keep showing the same file.
   4. Name collisions in a folder use the " (2)" rule.
   5. Extract search text.
4. **Audit:** one `library_audit` row per file with the action `migrate`, plus a `create` row per new folder.
5. **Idempotent:** documents already linked are skipped, so the import can be stopped and run again.
6. **Rollback:** delete the `library_publication` rows and the library rows, then the private bucket objects. Nothing public changes.

**Rehearsal (done):** the production image ran against a restored production dump with the test buckets. All 372 documents imported in about 3 minutes: 280 under `Tournaments`, 222 folders, 77.7 MB, both extensionless files recognised as PDFs, versions dated correctly, and the `document` table byte-for-byte unchanged. 341 files have search text; the rest are legacy `.doc` files and PDFs without a text layer. A second run found nothing to import.

**Production runbook**

1. Run `scripts/setup-aws-library.sh` (done): private library bucket, IAM access for the production app user.
2. Set `S3_LIBRARY_BUCKET=mpgagolf-library` and `S3_LIBRARY_REGION=us-west-2` in CapRover.
3. Deploy the admin app. `start.sh` applies `0007_library` (validated against a restored production dump).
4. As a super admin, open **Administration → Import documents**, review the preview, then import.
5. Invite board users with the `board` role.

## 5. Verification

**Unit tests** (vitest, in `apps/admin/src/lib/library/__tests__/`)

- `visibleFolderIds` intersection rule, including nested restricted folders
- 4-level depth limit
- Name collisions and the " (2)" suffix
- Allowlist and magic-byte checks, including rejection of SVG and HTML disguised as images
- Snippet builder
- Text extraction for each supported type, using fixture files

**Integration tests** (`*.integration.test.ts`, run against the MySQL test database on port 25062)

- Service functions write the audit row in the same transaction as the change: a forced error rolls back both.
- Deleting a folder sends the whole batch to Trash, and restoring it brings the batch back. An item whose parent is still in Trash restores to the root.
- `restoreVersion` adds a new version and keeps history.
- Search never returns restricted files to non-members, or files in Trash.
- Removing the role revokes the user's sessions.
- A startup migration test for the new tag, modeled on `startup-migration.integration.test.ts`.
- The migration script, run against seeded documents, is idempotent.

**End-to-end tests** (Playwright, `e2e/admin/library.spec.ts`, with a board-role login added in `auth-setup`)

- A board user lands on `/library` and is redirected away from `/tournaments`.
- Uploading several files at once, including `e2e/fixtures/test-document.pdf`. A file just under 5 MB succeeds, and a file over 5 MB shows the size error.
- Uploading a new version, then downloading the earlier version.
- An admin restricts a folder. The board user (not a member) can no longer see it or find its files in search.
- Deleting a file or folder, then restoring it from Trash.
- Attaching a library file to a tournament: the public page link works, and uploading a later version doesn't change the public copy.

**Security checks**

- A signed URL stops working after 5 minutes.
- A non-member calling `getDownloadUrl` for a file in a restricted folder gets "forbidden".
- A direct request to a private bucket object URL returns 403.

**Manual checks**

- Rebuild the admin container with `docker compose up -d --build admin`.
- Use playwright-cli on http://localhost:4100 to check the laptop two-pane layout and the phone layout at 390 px width.
