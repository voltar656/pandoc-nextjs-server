import { useCallback } from "react";
import { GetServerSideProps } from "next";
import axios from "axios";

import { Layout } from "../../components/Layout";
import { PandocStep } from "../../components/Steps";
import { Button, HeadingSmall, Paragraph } from "../../components/ui";
import appConfig from "../../lib/config";
import { IStatus } from "../../lib/writeMetaFile";

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
      const res = await axios.get("http://127.0.0.1:3000/api/status", {
        params: { file },
        responseType: "json",
      });
      if (res.data?.success) {
        return { props: { status: res.data.status } };
      }
    } catch (err) {
      // ignore
    }
  }
  return { props: { status: null } };
};
