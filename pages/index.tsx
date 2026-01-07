import { useCallback } from "react";
import { useRouter } from "next/router";

import { Layout } from "../components/Layout";
import { PandocStep } from "../components/Steps";
import { UploadStep } from "../components/UploadStep";

export default function Home() {
  const router = useRouter();

  const handleUpload = useCallback(
    ({ name }: { name: string }) => {
      router.push(`/convert/${name}`);
    },
    [router]
  );

  return (
    <Layout step={PandocStep.Upload}>
      <UploadStep onUpload={handleUpload} />
    </Layout>
  );
}
