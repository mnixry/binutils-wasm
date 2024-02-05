import { useEffect, useMemo } from "react";

import { Button, type ButtonProps } from "@mantine/core";
import { usePrevious } from "@mantine/hooks";

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
  const downloadFilename = useMemo(() => {
    if (!data) return;
    return filename.includes("[hash]")
      ? filename.replace(/\[hash\]/g, fnv1a(data.toString()))
      : filename;
  }, [data, filename]);

  const url = useMemo(() => {
    if (!data) return;
    const blob = new Blob([data], { type: contentType });
    return URL.createObjectURL(blob);
  }, [data, contentType]);
  const previousUrl = usePrevious(url);
  useEffect(() => {
    if (previousUrl) URL.revokeObjectURL(previousUrl);
  }, [previousUrl]);

  props.disabled ||= !data;
  if (typeof data === "object" && "length" in data)
    props.disabled ||= data.length === 0;

  return (
    <>
      <Button component="a" href={url} download={downloadFilename} {...props}>
        {props.children}
      </Button>
    </>
  );
}
