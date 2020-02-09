import { Command } from "commander";
interface Package {
    name: string;
    license: string;
    dependencies: Opts;
    devDependencies: Opts;
    author: string;
}
export interface Opts {
    [key: string]: string;
}
export interface Options {
    dep: string[];
    devDep: string[];
    react: boolean;
    parcel: boolean;
    license: "Apache-2.0" | "BSD-2-Clause" | "BSD-3-Clause" | "MIT";
    licenseFn: (year: number, name: string) => string;
    args: string[];
}
/**
 * Converts the parsed args from commander, into something more digestable (an Options type)
 *
 * @param args
 */
export declare const parseArgs: (args: Command) => Options;
/**
 * Higher order function that allows editing of a representation of a package.json file
 *
 * @param type
 * @param deps
 */
export declare const setDependency: (type: "name" | "license" | "dependencies" | "devDependencies" | "author", deps: string[]) => (pkg?: Package) => Package;
/**
 * Sets the license in the package.json
 *
 * @param license
 */
export declare const setLicense: (license: string) => (pkg: Package) => Package;
/**
 * Sets up web npm dependencies (if needed)
 *
 * @param opts
 */
export declare const setWeb: (opts: Options) => (pkg: Package) => Package;
/**
 * This is the "main" function that scaffolds the project
 *
 * @param args
 * @param pkgjson
 */
export declare const start: (args: Command, pkgjson?: Package) => void;
export {};
