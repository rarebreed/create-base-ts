import fs from "fs";
import { Command } from "commander";
import { execSync, spawnSync } from "child_process";
import { tsconfig } from "./tsconfig-template";
import * as licenses from "./licenses";

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

const template = {
  "name": "",
  "repository": "",
  "version": "0.1.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "Apache-2.0",
  "devDependencies": {
  },
  "dependencies": {
  }
}

interface Package {
  name: string,
  license: string,
  dependencies: Opts,
  devDependencies: Opts,
  author: string
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
    opts.react = true
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

type DepType = keyof Package;

/**
 * Higher order function that allows editing of a representation of a package.json file
 * 
 * @param type 
 * @param deps 
 */
export const setDependency = (type: DepType, deps: string[]) => (pkg: Package = template) => {
  console.log(`Adding ${deps} to ${type}`);
  let cmd = spawnSync("npm", ["install", "--dry-run", ...deps]);

  cmd.stdout.toString()
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
  return pkg
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
  let devDeps = ["@types/react", "@types/react-dom", "@types/react-router"];

  if (opts.parcel) {
    devDeps = devDeps.concat(["parcel"])
  } else {
    devDeps = devDeps.concat(["webpack"])
  }

  if (opts.mobx) {
    deps = deps.concat(["mobx"]);
  } else {
    deps = deps.concat(["redux"])
  }
  pkg = setDependency("dependencies", deps)(pkg);
  pkg = setDependency("devDependencies", devDeps)(pkg);
  return pkg
}

/**
 * This function generates the package.json based on the options passed in
 */
const setPackageJson = (opts: Options, pkgjson: Package) => {
  let pkg = setDependency("devDependencies", ["typescript", "tslint", "ava"])(pkgjson);
  pkg = setWeb(opts)(pkg);
  pkg = setLicense(opts.license)(pkg);
  pkg.name = opts.args[0];
  pkg.author = fullName;

  if (opts.dep.length > 0)
    pkg = setDependency("dependencies", opts.dep)(pkg);
  if (opts.devDep.length > 0)
    pkg = setDependency("devDependencies", opts.devDep)(pkg);

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
  tsconfig.compilerConfig.target = opts.esVersion;
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

  if (opts.dryRun) {
    console.log(JSON.stringify(pkg, null, 2));
    return;
  }

  console.log("Creating folders")
  fs.mkdirSync(pkg.name);
  fs.mkdirSync(`${pkg.name}/src`);
  fs.mkdirSync(`${pkg.name}/dist`);
  fs.mkdirSync(`${pkg.name}/test`);

  let writer = writeFile(pkg.name);
  console.log("Writing package.json");
  writer("package.json", pkg);
  console.log("Writing tsconfig.json");
  writer("tsconfig.json", tsconfig);

  makeGitIgnore(pkg.name);
  console.log("Writing LICENSE");
  writeLicense(pkg.name, opts.licenseFn);
}