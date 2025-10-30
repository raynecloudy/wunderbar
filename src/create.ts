#!/usr/bin/env node
import { createInterface } from "readline/promises";
import { cwd, stdin, stdout } from "process";
import { join } from "path";
import { mkdir, writeFile } from "fs/promises";
import { valid } from "semver";

const wd = cwd();

const i = createInterface({
  input: stdin,
  output: stdout,
});
let name = await i.question("project name: ");
name = name.length > 0 ? name : "wunderbar-project";
let description = await i.question("description: ");
description = description.length > 0 ? description : undefined
let version = await i.question("version (0.0.1): ");
version = version.length > 0 && valid(version) ? version : "0.0.1";
let license = await i.question("license (ISC): ");
license = license.length > 0 ? license : "ISC";
let author = await i.question("author: ");
author = author.length > 0 ? author : undefined
i.close();

await mkdir(join(wd, name), {
  recursive: true
});
await mkdir(join(wd, name, "web"));
await mkdir(join(wd, name, "server"));
await writeFile(join(wd, name, "package.json"), JSON.stringify({
  name,
  description,
  version,
  license,
  author
}));
await writeFile(join(wd, name, "wbconfig.json"), JSON.stringify({
  hostName: "localhost",
  output: "build",
  port: 3000
}));
