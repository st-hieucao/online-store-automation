---
name: summarize-test
description: Summarize the test cases just implemented into a human-readable markdown doc under docs/test-cases/, following this skill's fixed template exactly (same headers, table columns, smoke marker, disabled-test and notes convention every time) so output is identical regardless of who/which session runs it. If a doc already covers the same feature, update the matching section in place instead of creating a new file. Always run this right after /write-test finishes (typecheck/lint/test all green) — before /review-test — and whenever the user asks to "tóm tắt test case" / summarize or get an overview of a spec file to verify.
---

# Summarize Test — human-readable test case doc

Goal: after `/write-test` finishes, produce a scannable, plain-language record of exactly what was
tested, saved under `docs/`, so the user can verify coverage without reading Playwright code line by
line — and so the doc keeps accumulating across sessions instead of being lost in chat history.

**This skill has a fixed template (below) — do not improvise headers, table columns, or notation.**
Two different sessions summarizing two different features must produce structurally identical docs
(same section order, same column set, same smoke marker, same conventions for disabled/uncovered
tests) — only the content differs. This was found to drift across contributors before the template
was made explicit, so treat every part of the template as mandatory, not a style suggestion.

## When to run

- Automatically as the last step after `/write-test` reports done (typecheck/lint/test all green) —
  don't wait for the user to ask.
- Whenever the user asks to summarize/tóm tắt test cases, or wants an overview of a spec file to
  verify.

## Scope

Default to the spec file(s) just changed in this session (the files `/write-test` touched). If the
user names a specific file/path instead, summarize that.

## Output location

- Doc lives at `docs/test-cases/<feature>.md`, where `<feature>` is the top-level folder name under
  `tests/e2e/` (e.g. `tests/e2e/search/sidebar.spec.ts` → `docs/test-cases/search.md`). This mirrors
  how `docs/test-plan.md` and `tests/e2e/<feature>/` are already organized by feature, not by spec
  file — a feature folder can contain several spec files (sidebar.spec.ts, sort.spec.ts,
  pagination.spec.ts...) that all belong in the same doc.
- Inside the doc, one `##` section per spec file, each with its own tables grouped by describe block.

## The template

Copy this structure exactly — placeholders are `<angle-bracketed>`, everything else (headings,
column names, punctuation, the 🔥 legend wording, the closing section title) is literal and must
match verbatim.

```markdown
# Test cases — <Feature display name> (`<primary route, e.g. /search>`)

Tóm tắt test case tự động (Playwright) cho tính năng <Feature display name>, để verify nhanh không
cần đọc code. Cập nhật bởi skill `/summarize-test` — mỗi khi thêm/sửa test trong feature này, tìm
file này để cập nhật thay vì tạo file mới.

## <spec-file-name>.spec.ts

Spec: [tests/e2e/<feature>/<spec-file-name>.spec.ts](../../tests/e2e/<feature>/<spec-file-name>.spec.ts)
Page/Component Object: [tests/pages/<page>.page.ts](../../tests/pages/<page>.page.ts)<, more component links, comma-separated, if the spec composes shared Component Objects>

### <Describe block label, in the file's own wording> (<N> case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| 1 🔥 | <exact test title string from the code, English, verbatim> | <scenario in Vietnamese — actions taken, in order> | <the assertion(s) that actually matter> |
| 2 | <exact test title string> | <scenario> | <expectation> |
| ~~3~~ | ~~<exact test title string>~~ | ~~<scenario>~~ | ~~Tắt: <one-line reason>~~ |

> <Any caveat specific to THIS subsection's tests — live-data dependency, deliberately narrowed scope, flaky risk. Omit this blockquote entirely if there's nothing worth flagging for this subsection.>

### <Next describe block label> (<M> case)

| # | Tên test | Kịch bản | Kỳ vọng chính |
|---|---|---|---|
| ... | ... | ... | ... |

<repeat the `### <describe block> (<N> case)` + table (+ optional `>` note) pattern for every describe block in the file, in the file's own order>

🔥 = tagged `@smoke` (chạy trong `pnpm test:smoke`; các test khác trong file vẫn tính `@regression`
trừ khi ghi chú khác).

<repeat the whole `## <spec-file-name>.spec.ts` block for every additional spec file in this feature>

## Chưa cover / ngoài phạm vi

- <Scenario or feature area not automated> — <one-line reason: needs fixed test data, mutates live
  data, needs mocking not available in E2E, deliberately deferred, etc.> <(ID-xxxxx) if the team
  tracks it against an external ticket/requirement ID — omit the ID entirely if there is none, don't
  invent one>
- <repeat for every known gap; this section accumulates across spec files in the same feature — when
  adding a new spec file to an existing doc, merge into this section, don't duplicate or replace it>
```

### Rules for filling in the template

1. **Doc title**: `# Test cases — <Feature> (`<route>`)`. If the feature has one clear primary route,
   put it in backticks after the name. If there's no single clean route (e.g. an auth-gated feature
   with several sub-pages), drop the `(`<route>`)` parenthetical entirely rather than guessing one.
2. **Per spec-file header**: always both a `Spec:` line and a separate `Page/Component Object:` line
   (not merged into one "Source:" line) — the reader needs to know which Component Objects are
   reused, not just where the spec lives.
3. **Describe-block subsections**: always end the heading with `(<N> case)` — never omit the count.
4. **Table is always exactly 4 columns**: `# | Tên test | Kịch bản | Kỳ vọng chính`. The `Tên test`
   column is the literal, verbatim test title string from the code (English) — this is what lets
   someone reading a failed CI run's Playwright report find the matching doc row; do not paraphrase
   or translate it.
5. **Smoke marker**: append a literal ` 🔥` right after the row number for any test tagged `@smoke`
   — nothing else in the row changes. Include the 🔥 legend line exactly once per spec-file section,
   directly after that section's last table (before moving to the next spec file or to "Chưa cover").
   Skip the legend for a spec-file section that has zero `@smoke` tests.
6. **Disabled/commented-out-but-present tests**: still get a row, in their original position, with
   `~~strikethrough~~` on all three content cells, and the `Kỳ vọng chính` cell replaced with
   `~~Tắt: <reason>~~`. Never silently drop a test that exists in the code (even commented out) from
   the doc — the strikethrough row is what makes "this exists but is off" visible at a glance.
7. **Notes/caveats go inline**, as a `>` blockquote directly under the table they apply to — not
   collected into one section at the end of the file. A note that applies to the whole spec file
   (not one subsection) goes right after that spec file's last table instead.
8. **"Chưa cover / ngoài phạm vi"** is one section, once, at the very end of the whole doc (after all
   spec-file sections) — it accumulates across every spec file/session for that feature. When
   updating the doc for a new spec file, merge new gaps into this existing section rather than
   duplicating it or leaving a second copy.

## Steps

### 1. Find the right file before creating a new one
- List `docs/test-cases/` (it may not exist yet — that's fine, this is establishing the convention).
- If `docs/test-cases/<feature>.md` already exists, **read it fully** first.
  - If it already has a section for this exact spec file, **replace that `##` block in place** (the
    spec file's tests may have changed — don't leave stale rows alongside new ones). Leave every
    other spec-file section and the "Chưa cover" section untouched except for merging in new gaps.
  - If it covers the same feature but this is a new spec file, **append a new `##` section** right
    before "Chưa cover / ngoài phạm vi" — don't create a second file for the same feature.
- Only create a brand-new `docs/test-cases/<feature>.md` if no doc for that feature exists yet.
- If a spec file's feature folder doesn't map cleanly (rare), ask rather than guess where it belongs.

### 2. Read the spec file(s) in full
Read every `test(...)` and `test.describe(...)` block directly from the file — don't rely on memory
from earlier in the conversation, the file may have changed since (e.g. after `/review-test` fixes).
Note which tests are tagged `@smoke` (for the 🔥 marker) and which are commented out or wrapped in a
conditional `test.skip(...)` that effectively disables them for the current data/environment.

### 3. Group by describe block
Mirror the file's own grouping (e.g. desktop / mobile / applied filter tags) — don't invent new
groupings, and keep the file's own order.

### 4. For each test case, fill the 4 columns
- **# / Tên test**: row number (continuous across the whole spec-file section, not reset per
  subsection) + the verbatim test title, with the 🔥 marker if `@smoke`.
- **Kịch bản (scenario)**: what the test actually does, in plain language — the sequence of actions
  (which page/section/filter, what's clicked, in what order) — not a restatement of the test title.
- **Kỳ vọng chính (main expectation)**: the assertion(s) that actually matter — what would fail if
  the underlying feature broke. Skip incidental or lint-driven assertions that only duplicate an
  earlier, more precise check in the same test (e.g. a trailing `expect(page).toHaveURL(...)` added
  just to satisfy `playwright/expect-expect`).
- One row per test. Dense enough to scan in one pass, not a step-by-step transcript.

### 5. Flag anything worth double-checking as an inline `>` note (see template rule 7)
- Depends on live/external data (aggregation counts, catalog contents, real env) rather than fixed
  fixtures or mocks.
- Deliberately narrows scope vs. the original `/plan` checklist (e.g. dropped a combination due to
  flakiness risk) — say why in one line.
- Was only verified against a live/shared environment, if that affects how much to trust the result.

### 6. Compile "Chưa cover / ngoài phạm vi"
List every scenario from the original `/plan` checklist (or otherwise known to be in scope) that
isn't automated, with a one-line reason each. If the team tracks these against external ticket IDs
and you know the ID, include it; otherwise don't invent one.

### 7. Write/update the file
- Use `Write` for a brand-new doc, `Edit` for updating an existing one (replace the matching `##`
  block wholesale rather than patching individual rows).
- After writing, reply in chat with a short pointer (path + one-line summary of what changed) — don't
  paste the full table again in the chat message, the user can open the file.

## What NOT to do

- Don't paste raw code blocks from the spec — the point is a plain-language summary, not a code dump.
- Don't re-run tests or re-review code as part of this skill — that's `/write-test`'s and
  `/review-test`'s job. This only summarizes what's already there and already passing.
- Don't invent test cases that aren't in the file — if coverage looks thin against the plan, put it
  in "Chưa cover / ngoài phạm vi" instead of padding the summary.
- Don't create a second doc for a feature that already has one — always check `docs/test-cases/`
  first.
- Don't deviate from the template's headers/columns/markers "because it reads better" — consistency
  across features is the entire point; if the template genuinely doesn't fit a case, ask rather than
  improvise silently.
