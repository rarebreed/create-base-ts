# create-base-ts

create-base-ts is an npm initializer that will create a basic typescript application.  Additional
parameters can be passed to further tailor what is needed.

At its most basic level, it will install typescript and ts-lint dev-dependencies, an Apache-2.0
license, src and test directories, and a basic tsconfig.json file.

You can run it like this:

```bash
npm init create-base-ts <name-of-project>
```

After which you should see the following:

```
name-of-project
- /src
- /test
- /dist
- package.json
- tsconfig.json
- LICENSE
```

## Options

There are a couple of options that you can pass to create-base-ts to make it more useful.

- -r, --react will also add react, react-dom and @types definitions with webpack and dependencies
- -p, --parcel will use parcel (Only useful if -r also selected.  Uses webpack by default)
- -d, --deps comma separated list of additional dependencies
- --dev-deps comma separated list of dev-dependencies
- --license <MIT, BSD-2, BSD-3> Defaults to Apache-2.0
