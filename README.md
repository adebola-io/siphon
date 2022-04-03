<p align=center><img width=200 height=200 src="./siphon_proto.png"></img></p>

---
 
 ​<p align="center"> 
 ​  <a href="https://www.npmjs.com/package/rollup"> 
 ​    <img src="https://img.shields.io/npm/v/rollup.svg" alt="npm version"></img>
 ​  </a> 
 ​  <a href="https://packagephobia.now.sh/result?p=rollup"> 
 ​    <img src="https://packagephobia.now.sh/badge?p=rollup" alt="install size" > 
 ​  </a> 
 ​  <a href="https://codecov.io/gh/rollup/rollup"> 
 ​    <img src="https://codecov.io/gh/rollup/rollup/graph/badge.svg" alt="code coverage" > 
 ​  </a> 
 ​  <a href="#backers" alt="sponsors on Open Collective"> 
 ​      <img src="https://opencollective.com/rollup/backers/badge.svg" alt="backers" > 
 ​  </a>  
 ​  <a href="#sponsors" alt="Sponsors on Open Collective"> 
 ​    <img src="https://opencollective.com/rollup/sponsors/badge.svg" alt="sponsors" > 
 ​  </a>  
 ​  <a href="https://github.com/rollup/rollup/blob/master/LICENSE.md"> 
 ​    <img src="https://img.shields.io/npm/l/rollup.svg" alt="license"> 
 ​  </a> 
 ​  <a href="https://david-dm.org/rollup/rollup"> 
 ​    <img src="https://david-dm.org/rollup/rollup/status.svg" alt="dependency status"> 
 ​  </a> 
 ​  <a href='https://is.gd/rollup_chat?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge'> 
 ​    <img src='https://img.shields.io/discord/466787075518365708?color=778cd1&label=chat' alt='Join the chat at https://is.gd/rollup_chat'> 
 ​  </a> 
 ​</p>

---

<h1 align=center> Siphon </h1>

<p align=center style='font-style: italic'>Siphon is still in an early stage of development.

</p>

Siphon is a Node JS web bundler that reads HTML documents and resolves their assets into fewer files for production.

It can also format and minify your source code.

---

## Quick Start

To get started, install Siphon with the node command:

```shell
npm install -g siphon.cli
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
