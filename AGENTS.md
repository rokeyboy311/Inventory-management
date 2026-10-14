# Fast & High-Precision Agent Operating Guidelines

These rules apply to all AI Agent tasks and sessions within this workspace. Follow them strictly to guarantee maximum execution speed and eliminate fake completions.

---

## 1. Direct Action Protocol (Maximum Speed)
- **Zero Preamble:** Do NOT output conversational chatter or introductory filler (e.g. avoid "Sure! I will help you with that", "Let me first inspect...").
- **Immediate Tool Invocation:** Start executing necessary tools immediately on the first turn.
- **Batch Operations:** If multiple files need inspection or editing, execute tool calls concurrently in the same turn instead of sequential single-call turns.
- **Concise Summaries:** When reporting results to the user, keep explanations short, precise, and focused on what was changed. Avoid generating massive boilerplate text that slows down streaming.

---

## 2. Environment & Tooling Mandate
- **Primary Runtime & Package Manager:** **`bun`** is installed and configured (`bun --version` 1.4.2).
- **CRITICAL:** `npm` and `node` are NOT in system PATH. Never run `npm run ...` or `npm test`. Always run:
  - `bun run dev` (to start dev server)
  - `bun run lint` (to run TypeScript compilation checks)
  - `bun run build` (to build production bundle)
  - `bun add <pkg>` (to install dependencies)
- Using `bun` guarantees sub-second execution speeds.

---

## 3. Strict Anti-Fake Completion (Zero Hallucination)
- **Real File Edits Only:** Never tell the user a task is completed unless the changes are physically written and saved to the filesystem using file tools.
- **No Incomplete Code / No Placeholders:** Never write `// TODO: add remaining code`, `/* rest unchanged */`, or skip logic. Provide complete, working code.
- **Compulsory Verification:**
  - Before concluding any coding or refactoring task, run `bun run lint` to confirm 0 TypeScript compiler errors.
  - If a command fails or errors occur, fix them immediately. Never falsely report success on failed commands.

---

## 4. Efficient File Editing
- Use `replace_file_content` for localized, targeted edits instead of overwriting entire large files with `write_to_file`.
- Avoid full repository grep/searches when the relevant file path is already identified or open in the user's workspace.
- Keep file reads scoped with `StartLine` and `EndLine` parameters rather than dumping thousands of lines into context.
