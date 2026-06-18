import { execFileSync } from "node:child_process";

const protectedPrefixes = [
	"src/db/schema.ts",
	"drizzle/migrations/",
	"src/db/contract/",
	"src/app/internal/",
	"src/server/auth/permissions.ts",
	"src/auth.ts",
];

const deployNotePaths = ["docs/operations/shared-dev-deploy-note.md", "docs/operations/migrations.md", "README.md", "AGENTS.md", "CLAUDE.md"];

function git(args: string[]): string {
	return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function changedFiles(): string[] {
	const output = git(["diff", "--name-only", "HEAD"]);
	return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

const files = changedFiles();
const protectedChanged = files.some((file) => protectedPrefixes.some((prefix) => file === prefix || file.startsWith(prefix)));
const noteChanged = files.some((file) => deployNotePaths.includes(file));

if (protectedChanged && !noteChanged) {
	console.error("Shared-dev-sensitive files changed without a shared dev deploy note.");
	console.error(`Add or update one of: ${deployNotePaths.join(", ")}`);
	process.exit(1);
}

console.log("Shared dev deploy note check passed.");
