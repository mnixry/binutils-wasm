import type { Emscripten } from "./emscripten";
import type { ExecutableFilename } from "./executable";

export default async function loader(
  executable: ExecutableFilename
): Promise<Emscripten.ModuleFactory> {
  return (await import(`../build/dist/cjs/${executable}.js`))
    .default as Emscripten.ModuleFactory;
}
