import fs from "node:fs";
import path from "node:path";

if (process.platform === "win32") {
	const sourceRoot = path.resolve("node_modules");
	const standaloneRoot = path.resolve(".next", "standalone", "node_modules");
	let repaired = 0;
	let mirrored = 0;

	function targetFor(sourcePath) {
		const target = fs.readlinkSync(sourcePath);
		const sourceTarget = path.resolve(path.dirname(sourcePath), target);
		if (!fs.existsSync(sourceTarget) || !fs.statSync(sourceTarget).isDirectory()) {
			return null;
		}

		const relativeTarget = path.relative(sourceRoot, sourceTarget);
		const standaloneTarget = path.join(standaloneRoot, relativeTarget);
		return fs.existsSync(standaloneTarget) ? standaloneTarget : null;
	}

	function ensureDirectoryLink(linkPath, targetPath) {
		fs.mkdirSync(path.dirname(linkPath), { recursive: true });

		try {
			fs.lstatSync(linkPath);
			try {
				fs.statSync(linkPath);
				return;
			} catch (error) {
				if (error?.code !== "EPERM" && error?.code !== "ENOENT") {
					throw error;
				}
				fs.rmSync(linkPath, { force: true });
				repaired += 1;
			}
		} catch (error) {
			if (error?.code !== "ENOENT") {
				throw error;
			}
			mirrored += 1;
		}

		fs.symlinkSync(targetPath, linkPath, "junction");
	}

	function walkSource(dir) {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const sourcePath = path.join(dir, entry.name);
			const info = fs.lstatSync(sourcePath);

			if (info.isSymbolicLink()) {
				const standalonePath = path.join(standaloneRoot, path.relative(sourceRoot, sourcePath));
				const targetPath = targetFor(sourcePath);
				if (targetPath) {
					ensureDirectoryLink(standalonePath, targetPath);
				}
				continue;
			}

			if (info.isDirectory()) {
				walkSource(sourcePath);
			}
		}
	}

	if (fs.existsSync(sourceRoot) && fs.existsSync(standaloneRoot)) {
		walkSource(sourceRoot);
	}

	if (repaired > 0 || mirrored > 0) {
		console.log(`Repaired ${repaired} Windows standalone links. Mirrored ${mirrored} missing links.`);
	}
}

