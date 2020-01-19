# create-base-ts

create-base-ts is an npm initializer that will create a basic typescript application.  Additional
parameters can be passed to further tailor what is needed.

At its most basic level, it will install typescript and ts-lint dev-dependencies, an Apache-2.0
license, src and test directories, and a basic tsconfig.json file.

You can run it like this:

```bash
npm init base-ts <name-of-project> [options]
```

Or alternatively with npx like this:

```bash
npx create-base-ts <name-of-project> [options]
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

### react

Adding this option means that the latest version of react and react-dom will be added to the package.json file.
In addition, webpack will be added as a dependency

Example:

```bash
npm init base-ts my-project -r
```

### parcel

This option is only useful in conjunction with -r above, otherwise it is ignored.  If this is set, then
it will add parcel instead of webpack as a dependency

Example:

```bash
npm init base-ts my-project -rp
```

### deps

You can pass additional dependencies here, either in a comma separated format, or multiple times.  The latest
version of the dependencies will be added to the package.json

Example:

```bash
npm init base-ts my-project -d rxjs -d ramda

# alternatively

npm init base-ts my-project -d rxjs,ramda
```

### dev-deps

As deps above, but these dependencies will be added to the devDependencies field of the package.json.

Example:

```bash
npm init base-ts my-project --dev-dep ava --dev-dep @types/config

# alternatively

npm init base-ts my-project --dev-dep ava,@types/config
```

### license

You can pass one of 3 different options: BSD-2, BSD-3 or MIT.  The default is to use Apache-2.0.  This will
set the license field of the package.json, as well as include the appropriate LICENSE file.

Example:

```bash
npm init base-ts my-project -l MIT
```