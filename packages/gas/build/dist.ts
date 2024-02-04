import { spawn } from "node:child_process";

const supportedTargets = [
  "armv7-linux-gnueabihf",
  "aarch64-linux-gnu",
  "mips-linux-gnu",
  "mips64-linux-gnuabi64",
  "powerpc-linux-gnu",
  "powerpc64-linux-gnu",
  "sparc-linux-gnu",
  "sparc64-linux-gnu",
  "i386-linux-gnu",
  "x86_64-linux-gnu",
  "ia64-linux-gnu",
  "riscv32-linux-gnu",
  "riscv64-linux-gnu",
  "loongarch32-linux-gnu",
  "loongarch64-linux-gnu",
] as const;

export type SupportedTarget = (typeof supportedTargets)[number];

if (typeof require !== "undefined" && require.main === module) {
  const extraArgs = process.argv.slice(2);
  if (extraArgs.length > 0) {
    console.log("Extra arguments:", extraArgs);
  }
  if (process.env["ACTIONS_RUNTIME_TOKEN"]) {
    console.log("Using GitHub Actions cache for Docker buildx");
    extraArgs.push("--cache-to=type=gha,mode=max", "--cache-from=type=gha");
  }
  const ret = spawn("docker", [
    "buildx",
    "build",
    "--progress=plain",
    "--build-arg=BRANCH=binutils-2_42-branch",
    `--build-arg=TARGET=${supportedTargets.join(",")}`,
    `--output=${process.cwd()}/build`,
    ...extraArgs,
    `${process.cwd()}/build`,
  ]);
  ret.stdout.pipe(process.stdout);
  ret.stderr.pipe(process.stderr);
  ret.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}
