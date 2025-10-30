#!/usr/bin/env node
import chalk from "chalk";
import { constants, PathLike } from "node:fs"; 
import { cwd, env, exit } from "node:process";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { program } from "commander";

type WunderbarConfig = {
  output: string
};
type npmPackageConfig = {
  name: string,
  description: string,
  version: string,
  license: string,
  author: string
};

const wd = cwd();

const exists = async (path: PathLike) => {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    else throw error;
  }
}

program.option("-d --debug", "display debug information", false);
program.option("-v --version", "display version", false);
program.parse();

if (program.getOptionValue("version")) {
  console.log(env.npm_package_version);
  exit(0);
}

const logDebug: boolean = program.getOptionValue("debug");

const cDebug = console.debug;
const cError = console.error;
console.debug = (...data: any[]) => logDebug ? cError(chalk.yellow.bold("(debug)"), ...data) : void(0);
console.error = (...data: any[]) => cDebug(chalk.red.bold("(error)"), ...data);

if (!await exists(join(wd, "wbconfig.json"))) {
  console.error("file wbconfig.json does not exist or cannot be accessed.");
  exit(1);
}

const wbconfig: Partial<WunderbarConfig> = JSON.parse(await readFile(join(wd, "wbconfig.json"), "utf-8"));
const buildDir = join(wd, wbconfig.output ?? "build");

if (join(wd) === buildDir) {
  console.error("output directory cannot be working directory");
  exit(1);
}

await rm(buildDir, {
  recursive: true,
  force: true
})
await mkdir(buildDir, {
  recursive: true
});

await writeFile(join(buildDir, ".gitignore"), "*");

const packageJSON: npmPackageConfig = JSON.parse(await readFile(join(wd, "package.json"), "utf-8"));

if (await exists(join(wd, "server/"))) {
  await writeFile(join(buildDir, "package.json"), JSON.stringify({
    name: packageJSON.name,
    description: packageJSON.description,
    version: packageJSON.version,
    main: "server.js",
    license: packageJSON.license,
    author: packageJSON.author,
    type: "module"
  }));
  await writeFile(join(buildDir, "server.js"), "\n");
}
