# Quality & Anti-Hallucination Protocol

To ensure 100% genuine task completion without fake or partial work:

1. **Physical Verification:**
   - Every modified file must be saved and confirmed.
   - Run `bun run lint` (or `bun run build`) before stating completion to verify zero build or syntax errors.

2. **No Placeholders:**
   - Never insert dummy implementations, `// TODO`, or truncation comments in production code.

3. **Report Exact Facts:**
   - Report exact files changed with clickable links.
   - If a build fails, resolve the errors immediately before concluding.
