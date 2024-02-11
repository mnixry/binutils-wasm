# binutils-wasm

![CI](https://github.com/mnixry/binutils-wasm/actions/workflows/build.yml/badge.svg) ![NPM Version of Binutils](https://img.shields.io/npm/v/%40binutils-wasm%2Fbinutils?style=flat&label=%40binutils-wasm%2Fbinutils)

This project is divided into several components:

- A WebAssembly version of GNU Binutils, which is available as an NPM package for use in both Node.js and browser environments. (This README is about this component)
- A command-line tool that is based on the aforementioned package. It provides a variety of platform-specific Binutils that can be used on any device supporting Node.js (work in progress).
- A static web page built on the aforementioned package that offers assembly and disassembly for multiple architectures. It's accessible directly through a web browser. (Refer to the [GitHub](https://github.com/mnixry/binutils-wasm#readme) page for more details)

## Introduction

This is a WebAssembly port of GNU Assembler. It's available as an NPM package that can be used in Node.js or browser environments. The package is built using [EMScripten](https://emscripten.org/).

## Features

- Supports ALL architectures that are supported by GNU Binutils
- Nearly identical in functionality to the original GNU Binutils

## Usage

To use it, install the package from NPM and import it into your project.

```bash
npm install @binutils-wasm/binutils
```

```javascript
import loader from "@binutils-wasm/binutils";

const objdump = await loader('objdump');

await objdump({
    print: console.log,
    printErr: console.error,
    arguments: ['-d', 'a.out'],
    preRun: [(m) => {
        m.FS.writeFile('a.out', new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, ...]));
    }],
    postRun: [(m) => {
        console.log(m.FS.readFile('a.out'));
    }]
})
```

## License

This project is licensed under the GPLv3 License in accordance with the license of GNU Binutils.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
