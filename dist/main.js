#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const lib_1 = require("./lib");
const validLicense = new Set(["BSD-2", "BSD-3", "MIT", "Eclipse"]);
const collect = (value, accum) => {
    if (value.includes(",")) {
        return accum.concat(value.split(","));
    }
    else {
        return accum.concat([value]);
    }
};
const validateLicense = (value, dummy) => {
    if (!validLicense.has(value)) {
        throw new Error(`${value} is not in Valid Licences [${validLicense}]`);
    }
    return value;
};
let args = commander_1.default
    .usage("name-of-project [options]")
    .description("Scaffolds a typescript project with some optional dependencies")
    .option("-r, --react", "Add react dependencies")
    .option("-p, --parcel", "Use parcel instead of webpack (only useful if -r selected)")
    .option("-d, --dep <dep>", "Comma separated list of extra dependencies.  Can be used multiple times", collect, [])
    .option("--dev-dep <dev>", "Comma separated list of extra dev dependencies. Can be used multiple times", collect, [])
    .option("-l, --license <license>", "License to use (defaults to Apache-2.0 [BSD-2, BSD-3, MIT, Eclipse]", validateLicense)
    .parse(process.argv);
console.log(lib_1.parseArgs(args));
lib_1.start(args);
