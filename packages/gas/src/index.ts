import type { Emscripten } from "./emscripten";
import type { SupportedTarget } from "../build/dist";

declare const __IS_ESM__: boolean;
declare const __IS_CJS__: boolean;

export type PackageType = "esm" | "cjs";

export default async function loader(
  target: SupportedTarget,
  packageType?: PackageType
): Promise<Emscripten.ModuleFactory> {
  packageType =
    packageType ?? __IS_ESM__ ? "esm" : __IS_CJS__ ? "cjs" : undefined;

  const importString = `./${packageType}/${target}.js` as const;
  switch (packageType) {
    case "esm":
      return (await import(importString)).default as Emscripten.ModuleFactory;
    case "cjs":
      return require(importString) as Emscripten.ModuleFactory;
    default:
      throw new Error(`Unknown package type: ${packageType}`);
  }
}
