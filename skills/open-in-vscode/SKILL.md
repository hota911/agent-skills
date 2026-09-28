---
name: open-in-vscode
description: Use when the user asks to open a file from the current Codex-managed Git worktree in Visual Studio Code, VS Code, or with the code command.
---

# Open in Visual Studio Code

Open the requested file in the Visual Studio Code window for the current Worktree.

1. Resolve the current Git Worktree root and the requested file to absolute paths.
2. Verify that the target exists and is inside that Worktree. If either check fails, do not start Visual Studio Code; report the mismatch.
3. Run the following command yourself:

   ```sh
   code <worktree-root> <absolute-file-path>
   ```

Pass the Worktree root first even if Visual Studio Code is already open. Do not add `-n` by default. Do not ask the user to locate or activate a window manually. If the runtime requires approval to launch a GUI application, request that approval through the command tool.
