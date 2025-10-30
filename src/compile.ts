#!/usr/bin/env node
import { program } from "commander";

program.option("-d --debug", "display debug information", false);
program.parse();

const logDebug: boolean = program.getOptionValue("debug");
