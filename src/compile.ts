#!/usr/bin/env node
import chalk from "chalk";
import { constants, PathLike } from "node:fs"; 
import { cwd, env, exit } from "node:process";
import { access, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import js_beautify from "js-beautify";
import { program } from "commander";
const { js } = js_beautify;

type Entry = {
  children?: Entry[],
  name: string
};
type npmPackageConfig = {
  name: string,
  description: string,
  version: string,
  license: string,
  author: string
};
type WunderbarConfig = {
  hostName: string,
  output: string,
  port: number,
  static: boolean
};

const logDebug: boolean = program.getOptionValue("debug");
const wd = cwd();

const descendants = async (path: string) => {
  let list: Entry[] = [];
  for (const entry of await readdir(path)) {
    if ((await stat(join(path, entry))).isDirectory()) {
      list.push({
        children: await descendants(join(path, entry)),
        name: entry
      });
    } else {
      list.push({
        name: entry
      });
    }
  }
  return list;
}
const exists = async (path: PathLike) => {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    else throw error;
  }
}
const unescape = (value: any) => "".concat(value).replaceAll("\"", "\\\"").replaceAll("'", "\\'").replaceAll("`", "\\`");

program.option("-d --debug", "display debug information", false);
program.option("-v --version", "display version", false);
program.parse();

if (program.getOptionValue("version")) {
  console.log(env.npm_package_version);
  exit(0);
}

const cDebug = console.debug;
const cError = console.error;
console.debug = (...data: any[]) => logDebug ? cError(chalk.yellow.bold("(debug)"), ...data) : void(0);
console.error = (...data: any[]) => cDebug(chalk.red.bold("(error)"), ...data);

if (!await exists(join(wd, "wbconfig.json"))) {
  console.error("file \"wbconfig.json\" does not exist or cannot be accessed.");
  exit(1);
}
if (!await exists(join(wd, "web"))) {
  console.error("directory \"web\" does not exist or cannot be accessed.");
  exit(1);
}

const wbconfig: Partial<WunderbarConfig> = JSON.parse(await readFile(join(wd, "wbconfig.json"), "utf-8"));
const hostName = (wbconfig.hostName ?? "").length > 0 ? wbconfig.hostName : "localhost";
const port = isNaN(wbconfig.port * 1) ? 3000 : wbconfig.port;

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

if (!wbconfig.static) {
  await writeFile(join(buildDir, "package.json"), js(JSON.stringify({
    name: packageJSON.name,
    private: true,
    description: packageJSON.description,
    version: packageJSON.version,
    main: "server.js",
    license: packageJSON.license,
    author: packageJSON.author,
    type: "module"
  }), {
    indent_with_tabs: false,
    indent_size: 2
  }));
  const routeScript = await (async () => {
    let routeScript = "";
    const des = await descendants(join(wd, "web"));
    for (const descendant of des) {
      if (descendant.children) {
        routeScript = routeScript.concat(`  else if (req.url === \"/${unescape(descendant.name)}\") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("hello!");
  }\n`);
      }
    }
    routeScript = routeScript.concat(`  else {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end("Not Found");
  }`);
    return routeScript;
  })();
  await writeFile(join(buildDir, "server.js"),
`import { createServer } from "node:http";
const server = createServer((req, res) => {
  if (!req.url) return;
${routeScript}
});
server.listen(${port}, "${unescape(hostName)}", () => console.log("wunderbar project live at http://${unescape(hostName)}:${port}"));`);
}
