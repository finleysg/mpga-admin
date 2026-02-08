---
name: review-pr
description: Read and respond to GitHub PR code review comments on the current branch's PR.
user-invocable: true
disable-model-invocation: true
---

# Review PR Comments

Read GitHub PR code review comments, assess each one, and draft responses or make code changes as needed.

## Instructions

### 1. Detect the current PR

Run `gh pr view --json number,title,url` to identify the PR for the current branch. If no PR is found, inform the user and stop.

### 2. Fetch all review comments

Use the GitHub API to fetch threaded review comments:

```bash
gh api repos/{owner}/{repo}/pulls/{number}/comments --paginate
```

Extract from each comment:
- `id`, `in_reply_to_id` (for threading)
- `path` (file path)
- `line` or `original_line` (line number)
- `diff_hunk` (diff context)
- `body` (comment text)
- `user.login` (author)

If there are no review comments, inform the user and stop.

### 3. Group comments by thread and file

- Group comments into threads using `in_reply_to_id`
- Within each thread, order chronologically
- Group threads by file path

### 4. Read referenced files

For each file mentioned in the comments, read the file to understand the full context around the commented lines.

### 5. Assess each comment/thread

For each thread, determine:
- **Is the feedback valid?** Does it identify a real issue (bug, style, performance, readability)?
- **Is a code change warranted?** If yes, make the edit and draft a reply noting what was fixed.
- **Is it a question or discussion point?** Draft a thoughtful reply addressing the feedback.
- **Is it already resolved?** If the code already addresses the concern, draft a reply explaining why.

### 6. Present a summary to the user

Before posting anything, show the user a summary of all proposed actions:

For each thread:
- The original comment (abbreviated if long)
- Any code changes made (as a diff or description)
- The drafted reply text

Ask the user to approve, edit, or skip each response.

### 7. Post approved replies

Only after user confirmation, post each approved reply:

```bash
gh api repos/{owner}/{repo}/pulls/{number}/comments -f body="<reply>" -f in_reply_to=<comment_id>
```

## Important

- Never post replies without explicit user approval
- When making code changes, ensure they don't break existing functionality
- Keep reply tone professional and constructive
- If a comment thread already has a reply from the PR author, note this in the summary
