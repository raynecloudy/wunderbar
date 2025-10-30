#!/usr/bin/env node
import { constants } from "node:fs"; 
import { cwd } from "node:process";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { program } from "commander";

program.option("-d --debug", "display debug information", false);
program.parse();

const logDebug: boolean = program.getOptionValue("debug");

try {
  await access(join(cwd(), "wbconfig.json"), constants.F_OK)
} catch (error) {
  if (error.code === "ENOENT") {
    console.error("file wbconfig.json does not exist or cannot be accessed.")
  }
  else throw error;
}
