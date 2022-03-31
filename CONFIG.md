<h1 align=center> Configurations </h1>

The following is a list of Siphon's configuration parameters and what they do:

#### `outDir`

The output folder for the bundled project. The default is `'./build'`.

#### `rootDir`

The root folder to watch during automatic bundling. The default is `'./src'`

#### `baseFiles`

The entry points to start bundling from. Having multiple entry points means that Siphon will bundle into multiple html files. The default value is `['src/index.html']`

#### `internalJS`

Determines whether the bundler should write all external Javascript into the HTML file. The default value is `false`.

#### `internalStyles`

Determines whether the bundler should write all external stylesheets into the HTML file. The default is `true`.

#### `deep`

<h6 style='font-size:10pt; font-style: italic'> This parameter is experimental, and could exponentially increase your project load time, so it should only be used with very small projects and files. </h6>

When set to true, Siphon will compress **ALL** your assets into the HTML file, including all script files, stylesheets and images. The default value is `false`.

#### `formatFiles`

Determines whether the output files should be formatted. The default value is `true`.
