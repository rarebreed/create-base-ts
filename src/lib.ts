import fs from "fs";
import { Command } from "commander";
import { execSync, spawnSync, SpawnSyncReturns } from "child_process";
import { tsconfig } from "./tsconfig-template";
import * as licenses from "./licenses";
import defaults from "./defaults"

const getNameFromGit = () => {
  let fullName = "";

  let errmsg = "Could not get name from git config --global";
  try {
    let name = spawnSync("git", ["config", "--global", "user.name"]);
    if (name.status === 0) {
      fullName = name.stdout.toString().trim();
    } else {
      console.log(errmsg);
    }
  } catch (ex) {
    console.log(errmsg);
  }
  return fullName;
}

const fullName = getNameFromGit();

const template: Package = {
  name: "",
  repository: "",
  version: "0.1.0",
  description: "",
  main: "index.js",
  scripts: {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  keywords: [],
  author: "",
  license: "Apache-2.0",
  devDependencies: {
  },
  dependencies: {
  }
}

interface Package {
  name: string,
  repository: string | { url: string, type: string },
  version: string,
  description: string,
  main: string,
  keywords: string[],
  license: string,
  dependencies: Opts,
  devDependencies: Opts,
  author: string,
  scripts: Opts
}

export interface Opts {
  [key: string]: string
}

export interface Options {
  dep: string[],
  devDep: string[],
  react: boolean,
  parcel: boolean,
  mobx: boolean,
  esVersion: "ES3" | "ES5" | "ES2015" | "ES2016" | "ES2017" | "ES2018" | "ES2019" | "ESNext",
  dryRun: boolean,
  module: "commonjs" | "es2015",
  license: "Apache-2.0" | "BSD-2-Clause" | "BSD-3-Clause" | "MIT",
  licenseFn: (year: number, name: string) => string,
  args: string[]
}

/**
 * Converts the parsed args from commander, into something more digestable (an Options type)
 * 
 * @param args 
 */
export const parseArgs = (args: Command) => {
  let opts: Options = {
    dep: [],
    devDep: [],
    react: false,
    parcel: false,
    mobx: false,
    esVersion: "ES2015",
    dryRun: false,
    module: "commonjs",
    license: "Apache-2.0",
    licenseFn: licenses.APACHE_LICENSE,
    args: args.args
  }

  if (args.args.length !== 1) {
    throw new Error("Must supply the name of the project as first argument")
  }

  if (args.dep) {
    opts.dep = args.dep;
  }

  if (args.devDep) {
    opts.devDep = args.devDep;
  }

  if (args.license) {
    switch (args.license) {
      case "BSD-2":
        opts.license = "BSD-2-Clause";
        opts.licenseFn = licenses.BSD2_LICENSE;
        break;
      case "BSD-3":
        opts.license = "BSD-3-Clause";
        opts.licenseFn = licenses.BSD3_LICENSE;
        break;
      case "MIT":
        opts.license = "MIT";
        opts.licenseFn = licenses.MIT_LICENSE;
        break;
      default:
        throw new Error("Unknown license type");
    }
  }

  if (args.react) {
    opts.react = true;
    opts.module = "es2015";
  }

  if (args.parcel) {
    opts.parcel = true
  }

  if (args.es) {
    opts.esVersion = args.es;
  }

  if (args.dryRun) {
    opts.dryRun = true;
  }

  return opts;
}

type DepType = "dependencies" | "devDependencies";

const parseNPMInstall = (cmd: SpawnSyncReturns<Buffer>, pkg: Package, type: DepType) => {
  cmd.stdout.toString("utf-8")
    .split("\n")
    .filter((line) => line.startsWith("+"))
    .map(line => {
      let patt = /(?<name>(@types\/)?\w+([-_]?\w*)*)@(?<version>(\d+\.?)+)/m;
      let matched = line.match(patt);
      if (matched) {
        if (matched.groups) return matched.groups
        else return null
      } else {
        return null
      }
    })
    .forEach(dep => {
      if (dep) {
        let kt = pkg[type];
        if (typeof kt !== "string") {
          kt[dep.name] = dep.version;
        }
      }
    });
  return pkg;
}

/**
 * Higher order function that allows editing of a representation of a package.json file
 * 
 * @param type 
 * @param deps 
 */
export const setDependency = (type: DepType, deps: string[]) => (pkg: Package = template) => {
  console.log(`Adding ${deps} to ${type}`);
  let cmd = spawnSync("npm", ["install", "--dry-run", ...deps]);

  //pkg = parseNPMInstall(cmd, pkg, type);
  return pkg
}

export const setDep = (type: DepType, deps: string[], opts: Options) => (pkg: Package = template) => {
  let cwd = process.cwd();
  let name = opts.args[0];
  let args = ["install"];

  if (opts.dryRun) {
    args = args.concat("--dry-run");
  } else {
    cwd = `${cwd}/${name}`;
  }

  if (type === "devDependencies") {
    args = args.concat(["--save-dev"]);
  }

  args = args.concat([...deps]);

  console.log(`Adding ${deps} to ${type}`);
  let cmd = spawnSync("npm", args, { cwd });

  if (cmd.status !== 0) {
    throw new Error(`Failed to npm install: ${cmd.stderr}`)
  }

  if (opts.dryRun) {
    return parseNPMInstall(cmd, pkg, type);
  }

  let pkgJsonFile = `${cwd}/package.json`;
  if (!fs.existsSync(pkgJsonFile)) {
    throw new Error(`${pkgJsonFile} does not exist. Error creating package.json file`);
  }
  let pkgjson = fs.readFileSync(pkgJsonFile).toString("utf-8");

  pkg = JSON.parse(pkgjson);

  return pkg;
}

/**
 * Sets the license in the package.json
 * 
 * @param license 
 */
export const setLicense = (license: string) => (pkg: Package) => {
  pkg.license = license;
  return pkg
}

const writePackageJsonScripts = (base: string, keyvals: [string, string][]) => {
  console.log(`path is ${base}/package.json`);
  let pkg = JSON.parse(fs.readFileSync(`${base}/package.json`).toString("utf-8")) as Package;
  keyvals.forEach(([key, val]) => {
    pkg.scripts[key] = val;
  });

  fs.writeFileSync(`${base}/package.json`, JSON.stringify(pkg, null, 2));
}

/**
 * Sets up web npm dependencies (if needed)
 * 
 * @param opts 
 */
export const setWeb = (opts: Options) => (pkg: Package) => {
  if (!opts.react) {
    return pkg;
  }

  let deps = ["react", "react-dom", "react-router"];
  let devDeps = [
    "@types/react",
    "@types/react-dom",
    "@types/react-router",
    "bulma"
  ];

  if (opts.parcel) {
    devDeps = devDeps.concat(["parcel-bundler"]);
  } else {
    // Ughh, webpack sucks
    devDeps = devDeps.concat([
      "webpack",
      "webpack-cli",
      "webpack-dev-server",
      "copy-webpack-plugin",
      "css-loader",
      "extract-text-webpack-plugin@next",
      "mini-css-extract-plugin",
      "node-sass",
      "style-loader",
      "ts-loader"
    ]);
  }

  if (opts.mobx) {
    deps = deps.concat(["mobx"]);
  } else {
    deps = deps.concat(["redux"])
  }
  pkg = setDep("dependencies", deps, opts)(pkg);
  pkg = setDep("devDependencies", devDeps, opts)(pkg);

  return pkg
}

/**
 * This function generates the package.json based on the options passed in
 */
const setPackageJson = (opts: Options, pkgjson: Package) => {
  if (!opts.dryRun) {
    let name = opts.args[0];
    let writer = writeFile(name);
    pkgjson.author = fullName;
    pkgjson.name = name;

    if (opts.parcel) {
      pkgjson.scripts = Object.assign({
        build: "parcel ./build/index.html",
        serve: "parcel build ./build/index.html",
        clean: "rimraf dist build"
      }, pkgjson.scripts)
    } else if (opts.react) {
      pkgjson.scripts = Object.assign({
        build: "tsc && webpack --mode production",
        serve: "tsc && webpack-dev-server --mode development --open",
        clean: "rimraf dist build"
      }, pkgjson.scripts)
    }

    makeDirs(name);
    writer(`package.json`, pkgjson);
  }

  let pkg = setDep("devDependencies", ["typescript", "tslint", "ava", "rimraf"], opts)(pkgjson);
  pkg.name = opts.args[0];
  pkg.author = fullName;
  pkg = setWeb(opts)(pkg);
  pkg = setLicense(opts.license)(pkg);

  if (opts.dep.length > 0)
    pkg = setDep("dependencies", opts.dep, opts)(pkg);
  if (opts.devDep.length > 0)
    pkg = setDep("devDependencies", opts.devDep, opts)(pkg);

  return pkg
}

const writeFile = (base: string) => (fname: string, data: any) => {
  let pkgfile = `${base}/${fname}`;

  if (typeof data !== "string") {
    data = JSON.stringify(data, null, 2);
  }

  fs.writeFileSync(pkgfile, data);
}

/**
 * Creates a .gitignore file
 * 
 * @param pkg 
 */
const makeGitIgnore = (base: string) => {
  let data = [
    "node_modules/",
    "dist/"
  ]

  let ignoreFile = data.reduce((acc, n) => {
    acc = acc + "\n" + n;
    return acc;
  });

  writeFile(base)(".gitignore", ignoreFile);
}

/**
 * Writes the license file for our project
 * 
 * @param project 
 * @param fn 
 */
const writeLicense = (project: string, fn: (year: number, name: string) => string) => {
  let year = new Date().getFullYear();

  let writer = writeFile(project);
  let license = fn(year, fullName);
  writer("LICENSE", license);
}

const setTSConfig = (opts: Options) => {
  tsconfig.compilerOptions.target = opts.esVersion;
  
  if (opts.react) {
    tsconfig.compilerOptions.module = opts.module;
  }
  return tsconfig;
}

export const getWebPackTemplate = () => {
  let file = fs.readFileSync(`${__dirname}/webconfig-template.js`);
  return file;
}

const makeDirs = (name: string) => {
  console.log("Creating folders")
  fs.mkdirSync(name);
  fs.mkdirSync(`${name}/src`);
  fs.mkdirSync(`${name}/dist`);
  fs.mkdirSync(`${name}/test`);
}

const checkFolder = (basePath: string) => {
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath);
  }
}

const makeIndexHtml = (name: string) => {
  let basePath = `${name}/static`;
  checkFolder(basePath);
  let indexHtmlPath = `${basePath}/index.html`
  fs.writeFileSync(indexHtmlPath, defaults.indexHtml);
}

const makeDefaultApp = (base: string) => {
  checkFolder(`${base}/src`);
  let writer = writeFile(`${base}/src`);
  writer("app.tsx", defaults.helloWorld);
}

/**
 * This is the "main" function that scaffolds the project
 * 
 * @param args 
 * @param pkgjson 
 */
export const start = (args: Command, pkgjson: Package = template) => {
  let opts = parseArgs(args);

  console.log("Setting up package.json file");
  let pkg = setPackageJson(opts, pkgjson);

  let tsCfg = setTSConfig(opts);
  if (opts.dryRun) {
    console.log(JSON.stringify(pkg, null, 2));
    console.log(JSON.stringify(tsCfg, null, 2));
    return;
  }

  console.log(`pkg is now ${JSON.stringify(pkg, null, 2)}`);

  let writer = writeFile(pkg.name);
  console.log("Writing tsconfig.json");
  writer("tsconfig.json", setTSConfig(opts));

  if (opts.react) {
    console.log("Writing default index.html file");
    makeIndexHtml(pkg.name);
    console.log("Writing default app.tsx file");
    makeDefaultApp(pkg.name);
  }
  
  if (!opts.parcel) {
    console.log("Writing webpack.config.js");
    let config = getWebPackTemplate();
    fs.writeFileSync(`${pkg.name}/webpack.config.js`, config);
  }

  makeGitIgnore(pkg.name);
  console.log("Writing LICENSE");
  writeLicense(pkg.name, opts.licenseFn);
}