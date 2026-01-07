import { useCallback } from "react";
import { GetServerSideProps } from "next";

import { Layout } from "../../components/Layout";
import { PandocStep } from "../../components/Steps";
import { Button, HeadingSmall, Paragraph } from "../../components/ui";
import appConfig from "../../lib/config";
import { IStatus } from "../../lib/writeMetaFile";
import { readMetaFile } from "../../lib/readMetaFile";

interface Props {
  status: IStatus | null;
}

export default function DownloadPage({ status }: Props) {
  const handleClick = useCallback(() => {
    if (!status) return;
    const format = appConfig.formats.find((f) => f.value === status.format);
    window.location.href = `/api/download?file=${status.name}&ext=${format?.ext || format?.value || status.format}`;
  }, [status]);

  return (
    <Layout title="Download" step={PandocStep.Download}>
      <HeadingSmall className="mb-4">File download</HeadingSmall>
      {status ? (
        <Button onClick={handleClick}>Download the file</Button>
      ) : (
        <Paragraph>File not found.</Paragraph>
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { file } = ctx.query;
  if (typeof file === "string") {
    try {
      // Read status directly from file system instead of HTTP call
      const status = await readMetaFile(file);
      return { props: { status } };
    } catch (err) {
      // File not found or invalid
    }
  }
  return { props: { status: null } };
};
