import type { Emscripten } from "./emscripten";

declare const __IS_ESM__: boolean;
declare const __IS_CJS__: boolean;

export type PackageType = "esm" | "cjs";

export type ExecutableFilename =
  | "addr2line"
  | "ar"
  | "cxxfilt"
  | "elfedit"
  | "nm"
  | "objcopy"
  | "objdump"
  | "ranlib"
  | "readelf"
  | "size"
  | "strings"
  | "strip";

export default async function loader(
  executable: ExecutableFilename,
  packageType?: PackageType
): Promise<Emscripten.ModuleFactory> {
  packageType =
    packageType ?? __IS_ESM__ ? "esm" : __IS_CJS__ ? "cjs" : undefined;
  if (!packageType) {
    throw new Error("Unknown package type");
  }

  const importString = `./${packageType}/${executable}.js` as const;
  switch (packageType) {
    case "esm":
      return (await import(/* @vite-ignore */ importString))
        .default as Emscripten.ModuleFactory;
    case "cjs":
      return require(importString) as Emscripten.ModuleFactory;
    default:
      throw new Error(`Unknown package type: ${packageType}`);
  }
}
