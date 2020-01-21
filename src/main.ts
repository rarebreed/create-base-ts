#!/usr/bin/env node
import program from "commander";
import { parseArgs, start } from "./lib";
import { parse } from "querystring";

const validLicense = new Set(["BSD-2", "BSD-3", "MIT", "Eclipse"]);

const collect = (value: string, accum: [string]) => {
  if (value.includes(",")) {
    return accum.concat(value.split(","));
  } else {
    return accum.concat([value]);
  }

}

const validateLicense = (value: string, dummy: any) => {
  if (!validLicense.has(value)) {
    throw new Error(`${value} is not in Valid Licences [${validLicense}]`)
  }
  return value;
}

let args = program
  .usage("name-of-project [options]")
  .description("Scaffolds a typescript project with some optional dependencies")
  .option("-r, --react", "Add react dependencies")
  .option("-p, --parcel", "Use parcel instead of webpack (only useful if -r selected)")
  .option("-m, --mobx", "Use mobx state mangement library.  Defaults to redux")
  .option("--es <esversion>", "Javascript version to use (defaults to ES2015)")
  .option("-d, --dep <dep>", "Comma separated list of extra dependencies.  Can be used multiple times", collect, [])
  .option("--dev-dep <dev>", "Comma separated list of extra dev dependencies. Can be used multiple times", collect, [])
  .option("-l, --license <license>", "License to use (defaults to Apache-2.0 [BSD-2, BSD-3, MIT, Eclipse]", validateLicense)
  .option("--dry-run", "Only show the package.json it would produce, do not write anything")
  .parse(process.argv);

console.log(parseArgs(args))

start(args);