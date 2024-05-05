import * as _shlex from "shlex";

export * from "./constants";

export const shlex = {
  split: (s: string) => {
    try {
      return _shlex.split(s);
    } catch {
      return undefined;
    }
  },
  join: (s: string[]) => _shlex.join(s),
} as const;

export const bufferHexify = (buffer: Uint8Array, spaced?: boolean) =>
  [...buffer]
    .map(
      (byte, index) =>
        byte.toString(16).padStart(2, "0") +
        (spaced === true ? (index % 16 === 15 ? "\n" : " ") : ""),
    )
    .join("")
    .trim();
