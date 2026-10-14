# High-Speed Execution & Token Efficiency

To minimize latency and turnaround time during agent tasks:

1. **Immediate Execution:**
   - Execute file edits and bash/powershell commands on the first turn.
   - Do not summarize what you plan to do before doing it.

2. **Tool Batching:**
   - Call read, edit, and execution tools in parallel whenever dependencies allow.

3. **Compact Token Output:**
   - Write concise answers.
   - Do not re-output full files in conversational text when file tools already updated the code.
   - Avoid generic disclaimers.

4. **Engine & CLI:**
   - Use `bun` exclusively for package management and script execution.
