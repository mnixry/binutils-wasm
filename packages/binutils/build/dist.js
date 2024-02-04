const { spawn } = require("child_process");

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
