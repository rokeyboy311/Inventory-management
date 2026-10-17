# Compulsory GitHub Push Protocol

Always follow this rule strictly across every prompt and task:

1. After making any changes or working on any prompt, verify code integrity:
   `bun run lint`
2. Stage all files:
   `git add .`
3. Commit all changes:
   `git commit -m "feat/chore: <descriptive summary>"`
4. Push to remote:
   `git push origin main`

Never finish a turn or conclude without pushing all updated code to GitHub.
