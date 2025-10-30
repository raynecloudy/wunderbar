#!/usr/bin/env node
import chalk from "chalk";
import { constants } from "node:fs"; 
import { cwd, env, exit } from "node:process";
import { access, mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { program } from "commander";

type WunderbarConfig = {
  output: string
};

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

try {
  await access(join(cwd(), "wbconfig.json"), constants.F_OK);
} catch (error) {
  if (error.code === "ENOENT") {
    console.error("file wbconfig.json does not exist or cannot be accessed.");
  } else throw error;
}

const wbconfig: Partial<WunderbarConfig> = JSON.parse(await readFile(join(cwd(), "wbconfig.json"), "utf-8"));

if (join(cwd()) === join(cwd(), wbconfig.output ?? "build")) {
  console.error("output directory cannot be working directory");
}

await rm(join(cwd(), wbconfig.output ?? "build"), {
  recursive: true,
  force: true
})
await mkdir(join(cwd(), wbconfig.output ?? "build"), {
  recursive: true
});
