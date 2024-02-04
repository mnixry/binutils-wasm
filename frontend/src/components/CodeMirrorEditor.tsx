import { useComputedColorScheme } from "@mantine/core";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import ReactCodeMirror, { keymap } from "@uiw/react-codemirror";
import { type LanguageName, langs } from "@uiw/codemirror-extensions-langs";
import { vscodeKeymap } from "@replit/codemirror-vscode-keymap";

type PropsType = Parameters<typeof ReactCodeMirror>[0];

export default function CodeMirrorEditor({
  lang,
  ...props
}: PropsType & { lang?: LanguageName }) {
  const colorScheme = useComputedColorScheme("dark");

  props.theme ??= colorScheme === "dark" ? githubDark : githubLight;
  props.extensions ??= [];

  props.extensions.push(keymap.of(vscodeKeymap));
  if (lang && lang in langs) props.extensions.push(langs[lang]());

  return <ReactCodeMirror {...props} />;
}
