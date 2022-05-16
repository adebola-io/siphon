<h1 align=center> Configurations </h1>

The following is a list of Siphon's configuration parameters and what they do:

#### `outDir`

The output folder for the bundled project. The default is `'./build'`.

#### `rootDir`

The root folder to watch during automatic bundling. The default is `'./src'`

#### `relations`

Relations are links between base HTML files in the root directory and their bundled outputs in the output directory. The `relations` parameter in the config file holds an array of these links.
For example, the config file:

```js
 module.exports = {
    rootDir: "src",
    outDir: "build",
    relations: [{ from: "start.html", to: "index.html" }]
  }
}
```

has only one relation.

This instructs the Siphon core compiler to start bundling from `src/start.html` and release the bundled file as `build/index.html`.

#### `internalJS`

Determines whether the bundler should write all external Javascript into the HTML file. The default value is `false`.

#### `allowJSX`

Determines whether React's JSX syntax should be parsed along with regular javascript. Each JSX element will be replaced with its DOM equivalent. The default value is `false`.

#### `internalStyles`

Determines whether the bundler should write all external stylesheets into the HTML file. The default is `false`.

#### `wickedMode`

<p style='font-size:10pt; font-style: italic'> This parameter is experimental, and could exponentially increase your project load time, so it should only be used with very small projects and files. </p>

When set to true, Siphon will compress **\*ALL\*** your assets into the HTML file, including all script files, stylesheets and images. The default value is `false`.

#### `formatFiles`

Determines whether the output files should be formatted. The default value is `false`.

#### `storeImagesSeparately`

Determines whether images should stay at the root of the build folder or be packed up nicely into an `img` folder. The default value is `false`.
