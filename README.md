<h1 align=center> Siphon </h1>

Siphon is a Node JS web bundler that reads HTML documents and resolves their assets into fewer files for production.

Unlike Webpack and Rollup, Siphon is document based, ergo it's entry point is a HTML file, rather than a Javascript one.

---

## Quick Start

To get started, install Siphon with the node command:

```shell
npm install -g siphon-js
```

Once it is installed, you can cd into a project folder with an `index.html` file and run the command:

```shell
siphon bundle index.html
```

This command will read the file, determine all its required assets, and bundle them up into an `index.html` file in a `build` folder.

---

## Watch Mode

Running Siphon in watch mode will set it to automatically bundle up your project whenever changes are made to the base file or its assets.

**By default, Siphon assumes your base file is src/index.html, and all your assets are stored in the src folder.**

To run Siphon in watch mode, cd to the root of your project and run the command:

```shell
siphon watch
```

---

## Configuration

You can reconfigure the behavior of the bundler by including an `spnconfig.json` file in the root of your project.

For example, to change the output directory, create the config file and add:

```json
{
  "bundlerOptions": {
    "outDir": "./dist"
  }
}
```

When the bundler is run, it will bundle files into a `dist` folder, rather than the default `build`.

For more on configuration, see [Siphon Configs](CONFIG.md).
