import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";

import { Layout } from "../../components/Layout";
import { PandocStep } from "../../components/Steps";
import { UploadStatus } from "../../components/UploadStatus";
import { ScrapboxForm } from "../../components/ScrapboxForm";
import { Spinner, HeadingSmall, Paragraph } from "../../components/ui";
import { IStatus } from "../../lib/writeMetaFile";

export default function ConvertPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [status, setStatus] = useState<IStatus | null>(null);

  const file = router.query.file as string | undefined;

  const fetchStatus = useCallback(async () => {
    if (!file) return null;
    try {
      const res = await axios.get("/api/status", {
        params: { file },
        responseType: "json",
      });
      if (res.data?.success) {
        return res.data.status as IStatus;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }, [file]);

  useEffect(() => {
    if (!file || !polling) return;

    let active = true;
    const poll = async () => {
      const status = await fetchStatus();
      if (!active) return;
      setLoading(false);
      setStatus(status);
      if (status?.scrapbox || status?.success !== undefined) {
        setPolling(false);
      } else {
        setTimeout(poll, 1000);
      }
    };
    poll();

    return () => {
      active = false;
    };
  }, [file, polling, fetchStatus]);

  const handleDownload = useCallback(
    (name: string) => {
      router.push(`/download/${name}`);
    },
    [router]
  );

  const handleSubmit = useCallback(() => {
    setPolling(true);
  }, []);

  return (
    <Layout title="Convert" step={PandocStep.Convert}>
      {loading || !status ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : status.scrapbox ? (
        <>
          <HeadingSmall className="mb-4">Scrapbox options</HeadingSmall>
          <ScrapboxForm status={status} onSubmit={handleSubmit} />
          <Paragraph className="mt-4">
            Specify options for converting Scrapbox pages and click the convert button.
          </Paragraph>
        </>
      ) : (
        <>
          <HeadingSmall className="mb-4">File conversion status</HeadingSmall>
          <UploadStatus status={status} onDownload={handleDownload} />
          <Paragraph className="mt-4">
            Once the file is ready, the button above gets enabled.
          </Paragraph>
        </>
      )}
    </Layout>
  );
}
