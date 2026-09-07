---
name: commit-creation-en
description: Generate, split, and validate Git commits using this repository's Conventional Commits format with concise English summaries and bullet bodies. Use when staging changes, planning multiple commits, creating commits, or writing commit messages.
---

# Commit Creation

Analyze staged changes and automatically generate commit messages that follow the Conventional Commits specification.

## When to Use

Use this skill after making code changes to create commits with messages that follow the Conventional Commits format.
## Instructions

### 1. Work Flow

1. **Check All Changes**：Run `git status`, `git diff --name-status`, and `git diff --stat`.
2. **Categorize Before Staging**：Divide files into groups based on responsibilities such as dependencies/build, schema/API, domain tools, UI components, tests, and documentation, then stage each group with clear paths.
3. **Verify Staged Content**：Before each commit, run `git status` and `git diff --cached` in parallel to ensure the staging area contains only one responsibility group.
4. **Select Prefix**：Choose a prefix based on the responsibility group (see table below).
5. **Generate Message**：`<Prefix>(<Scope>): <Summary (within 50 characters)>` + bullet-pointed body (0-4 lines).
6. **Execute Commit**：After creating a commit, proceed to handle the next responsibility group until no changes remain in the working tree.

### Commit Splitting Rules

- **Prohibited**：When changes can be independently categorized by responsibility, do not put all files into a single commit.
- **Required**：Dependencies, backend contracts, domain tools, UI components, tests, and documentation should be committed separately.
- **Required**：Use explicit file paths when staging; avoid using `git add .` to mix multiple responsibility groups.
- **Required**：Each commit should maintain logical cohesion and ideally be in a buildable and reviewable state.
- **Exception**：Only atomic cross-layer changes that cannot be safely split may be merged; the commit message must explain why splitting is not possible.

### 2. Prefix Selection

| Prefix | Usage |
|--------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Refactoring (no behavior change) |
| `perf` | Performance optimization |
| `test` | Adding or modifying tests |
| `docs` | Documentation updates |
| `build` | Build system or external dependency changes |
| `ci` | CI related changes |
| `chore` | Chores (tooling configuration/scripts etc.) |
| `style` | Style changes (not affecting code logic) |
| `revert` | Revert |

### 3. Commit Message Format

```
<Prefix>(<Scope>): <Summary (imperative/clear)>

- Change content 1 (bullet point)
- Change content 2 (bullet point)
```

**Rules**: Summary limited to 50 characters in Simplified Chinese, body as 0-4 bullet points.

### 4. Execution Example

```bash
git commit -m "$(cat <<'EOF'
fix(debug): Remove unnecessary debug log output

- Remove redundant log lines in user information retrieval processing
EOF
)"
```

## Examples

```
fix(debug): Remove unnecessary debug log output
- Remove redundant log lines in user information retrieval processing

feat(auth): Add two-step verification feature
- Implement SMS authentication workflow
- Add generation and validation of authentication tokens
```

## Important Notes

- **must**: Use `git diff --cached` to analyze staged content (ignore unstaged changes)
- **must**: For multi-responsibility modifications, output commit groups first, then stage and commit each group sequentially
- **prohibited**: Vague summaries (e.g., "update", "fix bug"), prohibited from having unstructured long texts
- **prohibited**: Merging unrelated files into the same commit to reduce the number of commits
- For larger differences, focus on the main change points for summarization

## Runtime Considerations
- When the user requests a commit message, first use `git status` or `git diff --staged` to understand the changes, then propose a commit message in the above format.
