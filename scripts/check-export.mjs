import { existsSync } from "node:fs";

const required = [
  "out/index.html",
  "out/signup.html",
  "out/login.html",
  "out/home.html",
  "out/videos.html",
  "out/videos/upload.html",
  "out/404.html",
  "out/_headers",
];

const missing = required.filter((file) => !existsSync(file));
if (missing.length > 0) {
  console.error(`Static export is missing:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log("Static export contains the expected routes.");
