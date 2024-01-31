import type { Emscripten } from "./emscripten";
import type { SupportedTarget } from "../build/dist";

export default async function loader(
  target: SupportedTarget
): Promise<Emscripten.ModuleFactory> {
  return (await import(`../build/dist/esm/${target}.js`))
    .default as Emscripten.ModuleFactory;
}
