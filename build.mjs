// Cloudflare Pages uploads only these public website files from dist.
import { cp, copyFile, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist");
for (const file of ["index.html", "style.css", "script.js"]) {
  await copyFile(file, "dist/" + file);
}
await cp("img", "dist/img", { recursive: true });
