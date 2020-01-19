# create-base-ts

create-base-ts is an npm initializer that will create a basic typescript application.  Additional
parameters can be passed to further tailor what is needed.

At its most basic level, it will install typescript and ts-lint dev-dependencies, an Apache-2.0
license, src and test directories, and a basic tsconfig.json file.

You can run it like this:

```bash
npm init base-ts <name-of-project>
```

After which you should see the following:

```
name-of-project
- /src
- /test
- package.json
- tsconfig.json
- LICENSE
```

## Options

There are a couple of options that you can pass to create-base-ts to make it more useful.

- -r, --react will also add react, react-dom and @types definitions with webpack and dependencies
- -t, --test \<Jest | mocha | jasmine\> The default is to use AVA. This will add testing library to package.json instead
- -d, --deps comma separated list of additional dependencies
- --dev-deps comma separated list of dev-dependencies
- -o, --ts-opt key=value to be set in tsconfig.  Can be called multiple times
- --license <MIT, BSD-2, BSD-3, Eclipse> Defaults to Apache-2.0
