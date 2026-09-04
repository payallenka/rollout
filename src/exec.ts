import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

export interface RunResult {
  stdout: string;
  stderr: string;
}

export class CommandError extends Error {
  constructor(
    message: string,
    readonly command: string,
    readonly stderr: string,
  ) {
    super(message);
    this.name = "CommandError";
  }
}

/**
 * Runs a command with arguments as an array - never through a shell, so a
 * branch name or repository slug from a config file cannot become an
 * injection.
 */
export async function sh(
  command: string,
  args: string[],
  opts: { cwd?: string; timeout?: number } = {},
): Promise<RunResult> {
  try {
    const { stdout, stderr } = await run(command, args, {
      cwd: opts.cwd,
      timeout: opts.timeout ?? 120_000,
      maxBuffer: 32 * 1024 * 1024,
      encoding: "utf8",
    });
    return { stdout, stderr };
  } catch (err) {
    const e = err as { stderr?: string; message?: string };
    const detail = (e.stderr || e.message || "").trim().split("\n").slice(0, 4).join("\n");
    throw new CommandError(
      `${command} ${args.slice(0, 3).join(" ")} failed: ${detail}`,
      `${command} ${args.join(" ")}`,
      e.stderr ?? "",
    );
  }
}

export async function has(command: string): Promise<boolean> {
  try {
    await sh(command, ["--version"], { timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}
