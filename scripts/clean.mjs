import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const targets = ["node_modules", "package-lock.json"];

for (const name of targets) {
  const p = join(root, name);
  if (!existsSync(p)) continue;
  rmSync(p, { recursive: true, force: true });
  console.log(`Removed ${name}`);
}

console.log("Clean complete. Run: npm install");
