# binutils-wasm

![Website](https://img.shields.io/website?url=https%3A%2F%2Fbinutils-wasm.vercel.app%2F&up_message=online&down_message=offline&style=for-the-badge&logo=vercel&label=frontend)

![CI](https://github.com/mnixry/binutils-wasm/actions/workflows/build.yml/badge.svg) ![NPM Version of GAS](https://img.shields.io/npm/v/%40binutils-wasm%2Fgas?label=%40binutils-wasm%2Fgas) ![NPM Version of Binutils](https://img.shields.io/npm/v/%40binutils-wasm%2Fbinutils?style=flat&label=%40binutils-wasm%2Fbinutils)

This project is divided into several components:

- A WebAssembly version of GNU Binutils, available as an NPM package for use in Node.js or browser environments. (See [gas](https://www.npmjs.com/package/@binutils-wasm/gas) and [binutils](https://www.npmjs.com/package/@binutils-wasm/binutils))
- A command-line tool based on the aforementioned package, providing a variety of platform-specific Binutils for use on any device that supports Node.js (work in progress).
- A static web page built on the aforementioned package that offers assembly and disassembly for multiple architectures, accessible directly through a web browser. (This README is about this component)

## Introduction

This is a highly efficient, purely static website that offers assembly and disassembly for a variety of architectures. The site is built using [Mantine](https://mantine.dev/) and [Vite](https://vitejs.dev/).

## Features

- Assembly and disassembly for multiple architectures
- Exceptionally fast execution speed, nearly real-time
- No server-side code, eliminating any potential security concerns
- Parallels the `asm` and `disasm` functions in PwnTools

## Screenshots

![Assembler](https://github.com/mnixry/binutils-wasm/assets/32300164/0042cfee-99ab-489d-82d4-78e4613adc89)
![Disassembler](https://github.com/mnixry/binutils-wasm/assets/32300164/6174e6ba-e79c-4467-acc8-f05a5a32cb50)

## Usage

To use it, simply visit the website hosted on [Vercel](https://binutils-wasm.vercel.app/).

### Building for Offline Use

To build for offline use, clone the repository and run the following commands. Note that this process assumes you are operating on a Unix-like system and have Docker installed (to build the WebAssembly binary).

```bash
# in the root directory of the repository
pnpm install
# This process will take about 1-2 hours
pnpm build
```

Once the build process is complete, the static files can be found in the `./frontend/dist` directory.

## Acknowledgments

- [Mantine](https://mantine.dev/) and [Vite](https://vitejs.dev/) for the tools used to build this website
- [EMScripten](https://emscripten.org/) for the tools to compile Binutils to WebAssembly
- [GNU Binutils](https://www.gnu.org/software/binutils/) for the tools to assemble and disassemble binary files
- [PwnTools](https://github.com/Gallopsled/pwntools) for providing a reference to implement the assembler and disassembler

## License

This project is licensed under the GPLv3 License in accordance with the license of GNU Binutils. For more details, see the [LICENSE](./LICENSE) file.

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
