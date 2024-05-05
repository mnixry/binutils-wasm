import gasLoader from "@binutils-wasm/gas";

import { Endianness } from "../components/EndiannessSegmentedControl";
import { ProcessorBits } from "../components/ProcessorBitsSegmentedControl";

type SupportedTargets = Parameters<typeof gasLoader>[0];

export const ASSEMBLE_PUBLIC_PREFIX = [
  '.section .shellcode,"awx"',
  ".global _start",
  ".global __start",
  "",
  "_start:",
  "__start:",
] as const;

export const ASSEMBLERS_MAP: Record<
  string,
  {
    target: SupportedTargets;
    acceptBits?: ProcessorBits;
    acceptEndianness?: Endianness;
    paramsFactory: (arg: { e: Endianness; b: ProcessorBits }) => string[];
    asmPrefix?: string[];
  }
> = {
  i386: {
    target: "i386-linux-gnu",
    acceptBits: 32,
    paramsFactory: ({ b }) => [`-${b}`],
    asmPrefix: [".intel_syntax noprefix", ".p2align 0"],
  },
  x86_64: {
    target: "x86_64-linux-gnu",
    acceptBits: 64,
    paramsFactory: ({ b }) => [`-${b}`],
    asmPrefix: [".intel_syntax noprefix", ".p2align 0"],
  },
  ARMv7: {
    target: "armv7-linux-gnueabihf",
    acceptEndianness: "little",
    paramsFactory: ({ e }) => [e === "big" ? "-EB" : "-EL"],
    asmPrefix: [".syntax unified", ".arch armv7-a", ".arm", ".p2align 2"],
  },
  ARM64: {
    target: "aarch64-linux-gnu",
    acceptEndianness: "little",
    paramsFactory: ({ e }) => [e === "big" ? "-EB" : "-EL"],
  },
  MIPS: {
    target: "mips-linux-gnu",
    acceptEndianness: "big",
    acceptBits: 32,
    paramsFactory: ({ e, b }) => [e === "big" ? "-EB" : "-EL", `-${b}`],
    asmPrefix: [".set mips2", ".set noreorder", ".p2align 2"],
  },
  MIPS64: {
    target: "mips64-linux-gnuabi64",
    acceptEndianness: "big",
    acceptBits: 64,
    paramsFactory: ({ e, b }) => [e === "big" ? "-EB" : "-EL", `-${b}`],
  },
  SPARC: {
    target: "sparc-linux-gnu",
    acceptEndianness: "big",
    acceptBits: 32,
    paramsFactory: ({ e, b }) => [e === "big" ? "-EB" : "-EL", `-${b}`],
  },
  SPARC64: {
    target: "sparc64-linux-gnu",
    acceptEndianness: "big",
    acceptBits: 64,
    paramsFactory: ({ e, b }) => [e === "big" ? "-EB" : "-EL", `-${b}`],
  },
  PowerPC: {
    target: "powerpc-linux-gnu",
    acceptEndianness: "big",
    acceptBits: 32,
    paramsFactory: ({ e, b }) => [
      e === "big" ? "-mbig" : "-mlittle",
      `-mppc${b}`,
    ],
  },
  PowerPC64: {
    target: "powerpc64-linux-gnu",
    acceptEndianness: "big",
    acceptBits: 64,
    paramsFactory: ({ e, b }) => [
      e === "big" ? "-mbig" : "-mlittle",
      `-mppc${b}`,
    ],
  },
  IA64: {
    target: "ia64-linux-gnu",
    acceptEndianness: "big",
    paramsFactory: ({ e }) => [e === "big" ? "-mbe" : "-mle"],
  },
  RISC_V32: {
    target: "riscv32-linux-gnu",
    paramsFactory: () => ["-march=rv32gc", "-mabi=ilp32"],
  },
  RISC_V64: {
    target: "riscv64-linux-gnu",
    paramsFactory: () => ["-march=rv64gc", "-mabi=lp64"],
  },
  LoongArch32: {
    target: "loongarch32-linux-gnu",
    paramsFactory: () => [],
  },
  LoongArch64: {
    target: "loongarch64-linux-gnu",
    paramsFactory: () => [],
  },
};

export const DISASSEMBLERS_MAP: Record<
  string,
  {
    bfdArch: string;
    acceptEndianness?: Endianness;
    acceptBits?: ProcessorBits;
    bfdNameFactory: (props: { e: Endianness; b: ProcessorBits }) => string;
  }
> = {
  i386: {
    bfdArch: "i386",
    bfdNameFactory: () => "elf32-i386",
  },
  x86_64: {
    bfdArch: "i386:x86-64",
    bfdNameFactory: () => "elf64-x86-64",
  },
  ARMv7: {
    bfdArch: "arm",
    acceptEndianness: "little",
    bfdNameFactory: ({ e }) => `elf32-${e}arm`,
  },
  ARM64: {
    bfdArch: "aarch64",
    acceptEndianness: "little",
    bfdNameFactory: ({ e }) => `elf64-${e}aarch64`,
  },
  AVR: {
    bfdArch: "avr",
    bfdNameFactory: () => "elf32-avr",
  },
  MIPS: {
    bfdArch: "mips",
    acceptEndianness: "big",
    bfdNameFactory: ({ e }) => `elf32-trad${e}mips`,
  },
  MIPS64: {
    bfdArch: "mips",
    acceptEndianness: "big",
    bfdNameFactory: ({ e }) => `elf64-trad${e}mips`,
  },
  Alpha: {
    bfdArch: "alpha",
    bfdNameFactory: () => "elf64-alpha",
  },
  CRIS: {
    bfdArch: "cris",
    bfdNameFactory: () => "elf32-cris",
  },
  IA64: {
    bfdArch: "ia64",
    acceptEndianness: "big",
    bfdNameFactory: ({ e }) => `elf64-ia64-${e}`,
  },
  M68k: {
    bfdArch: "m68k",
    bfdNameFactory: () => "elf32-m68k",
  },
  MSP430: {
    bfdArch: "msp430",
    bfdNameFactory: () => "elf32-msp430",
  },
  PowerPC: {
    bfdArch: "powerpc",
    acceptEndianness: "big",
    bfdNameFactory: ({ e }) => `elf32-${e}powerpc`,
  },
  PowerPC64: {
    bfdArch: "powerpc",
    acceptEndianness: "big",
    bfdNameFactory: ({ e }) => `elf64-${e}powerpc`,
  },
  RISC_V: {
    bfdArch: "riscv",
    acceptEndianness: "little",
    acceptBits: 32,
    bfdNameFactory: ({ e, b }) => `elf${b}-${e}riscv`,
  },
  RISC_V64: {
    bfdArch: "riscv",
    acceptEndianness: "little",
    acceptBits: 64,
    bfdNameFactory: ({ e, b }) => `elf${b}-${e}riscv`,
  },
  VAX: {
    bfdArch: "vax",
    bfdNameFactory: () => "elf32-vax",
  },
  S390: {
    bfdArch: "s390",
    acceptBits: 32,
    bfdNameFactory: ({ b }) => `elf${b}-s390`,
  },
  SPARC: {
    bfdArch: "sparc",
    bfdNameFactory: () => "elf32-sparc",
  },
  SPARC64: {
    bfdArch: "sparc",
    bfdNameFactory: () => "elf64-sparc",
  },
  LoongArch32: {
    bfdArch: "LoongArch32",
    bfdNameFactory: () => "elf32-loongarch",
  },
  LoongArch64: {
    bfdArch: "LoongArch64",
    bfdNameFactory: () => "elf64-loongarch",
  },
};
