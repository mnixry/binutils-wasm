import { Button, type ButtonProps } from "@mantine/core";
import { useMemo, useRef } from "react";

function fnv1a(str: string) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export default function DownloadButton({
  data,
  filename = "download.bin",
  contentType = "application/octet-stream",
  ...props
}: ButtonProps & {
  data?: BlobPart;
  filename?: string;
  contentType?: string;
}) {
  const anchor = useRef<HTMLAnchorElement>(null);

  const downloadFilename = useMemo(() => {
    if (!data) return;
    return filename.includes("[hash]")
      ? filename.replace(/\[hash\]/g, fnv1a(data.toString()))
      : filename;
  }, [data, filename]);

  props.disabled ||= !data;
  if (typeof data === "object" && "length" in data)
    props.disabled ||= data.length === 0;

  return (
    <>
      <Button
        onClick={() => {
          if (!data) return;
          const blob = new Blob([data], { type: contentType });
          const url = URL.createObjectURL(blob);
          anchor.current!.href = url;
          anchor.current!.click();
          URL.revokeObjectURL(url);
        }}
        {...props}
      >
        {props.children}
      </Button>
      <a ref={anchor} download={downloadFilename} hidden />
    </>
  );
}
