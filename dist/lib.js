"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const tsconfig_template_1 = require("./tsconfig-template");
const licenses = __importStar(require("./licenses"));
const getNameFromGit = () => {
    let fullName = "";
    let errmsg = "Could not get name from git config --global";
    try {
        let name = child_process_1.spawnSync("git", ["config", "--global", "user.name"]);
        if (name.status === 0) {
            fullName = name.stdout.toString().trim();
        }
        else {
            console.log(errmsg);
        }
    }
    catch (ex) {
        console.log(errmsg);
    }
    return fullName;
};
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
    "devDependencies": {},
    "dependencies": {}
};
/**
 * Converts the parsed args from commander, into something more digestable (an Options type)
 *
 * @param args
 */
exports.parseArgs = (args) => {
    let opts = {
        dep: [],
        devDep: [],
        react: false,
        parcel: false,
        license: "Apache-2.0",
        licenseFn: licenses.APACHE_LICENSE,
        args: args.args
    };
    if (args.args.length !== 1) {
        throw new Error("Must supply the name of the project as first argument");
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
    }
    if (args.parcel) {
        opts.parcel = true;
    }
    return opts;
};
/**
 * Higher order function that allows editing of a representation of a package.json file
 *
 * @param type
 * @param deps
 */
exports.setDependency = (type, deps) => (pkg = template) => {
    console.log(`Adding ${deps} to ${type}`);
    let cmd = child_process_1.spawnSync("npm", ["install", "--dry-run", ...deps]);
    cmd.stdout.toString()
        .split("\n")
        .filter((line) => line.startsWith("+"))
        .map(line => {
        let patt = /(?<name>(@types\/)?\w+([-_]?\w*)*)@(?<version>(\d+\.?)+)/m;
        let matched = line.match(patt);
        if (matched) {
            if (matched.groups)
                return matched.groups;
            else
                return null;
        }
        else {
            return null;
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
};
/**
 * Sets the license in the package.json
 *
 * @param license
 */
exports.setLicense = (license) => (pkg) => {
    pkg.license = license;
    return pkg;
};
/**
 * Sets up web npm dependencies (if needed)
 *
 * @param opts
 */
exports.setWeb = (opts) => (pkg) => {
    if (!opts.react) {
        return pkg;
    }
    else {
        pkg = exports.setDependency("dependencies", ["react", "react-dom"])(pkg);
    }
    if (opts.parcel) {
        return exports.setDependency("devDependencies", ["parcel"])(pkg);
    }
    else {
        return exports.setDependency("devDependencies", ["webpack"])(pkg);
    }
};
/**
 * This function generates the package.json based on the options passed in
 */
const setPackageJson = (opts, pkgjson) => {
    let pkg = exports.setDependency("devDependencies", ["typescript", "ts-lint", "ava"])(pkgjson);
    pkg = exports.setWeb(opts)(pkg);
    pkg = exports.setLicense(opts.license)(pkg);
    pkg.name = opts.args[0];
    pkg.author = fullName;
    if (opts.dep)
        pkg = exports.setDependency("dependencies", opts.dep)(pkg);
    if (opts.devDep)
        pkg = exports.setDependency("devDependencies", opts.devDep)(pkg);
    return pkg;
};
const writeFile = (base) => (fname, data) => {
    let pkgfile = `${base}/${fname}`;
    if (typeof data !== "string") {
        data = JSON.stringify(data, null, 2);
    }
    fs_1.default.writeFileSync(pkgfile, data);
};
/**
 * Creates a .gitignore file
 *
 * @param pkg
 */
const makeGitIgnore = (base) => {
    let data = [
        "node_modules/",
        "dist/"
    ];
    let ignoreFile = data.reduce((acc, n) => {
        acc = acc + "\n" + n;
        return acc;
    });
    writeFile(base)(".gitignore", ignoreFile);
};
/**
 * Writes the license file for our project
 *
 * @param project
 * @param fn
 */
const writeLicense = (project, fn) => {
    let year = new Date().getFullYear();
    let writer = writeFile(project);
    let license = fn(year, fullName);
    writer("LICENSE", license);
};
/**
 * This is the "main" function that scaffolds the project
 *
 * @param args
 * @param pkgjson
 */
exports.start = (args, pkgjson = template) => {
    let opts = exports.parseArgs(args);
    console.log("Setting up package.json file");
    let pkg = setPackageJson(opts, pkgjson);
    console.log("Creating folders");
    fs_1.default.mkdirSync(pkg.name);
    fs_1.default.mkdirSync(`${pkg.name}/src`);
    fs_1.default.mkdirSync(`${pkg.name}/dist`);
    fs_1.default.mkdirSync(`${pkg.name}/test`);
    let writer = writeFile(pkg.name);
    console.log("Writing package.json");
    writer("package.json", pkg);
    console.log("Writing tsconfig.json");
    writer("tsconfig.json", tsconfig_template_1.tsconfig);
    makeGitIgnore(pkg.name);
    console.log("Writing LICENSE");
    writeLicense(pkg.name, opts.licenseFn);
};
