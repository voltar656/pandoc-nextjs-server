import { useCallback, useState } from "react";

import { Layout } from "../components/Layout";
import { PandocStep } from "../components/Steps";
import { UploadStep } from "../components/UploadStep";
import { Button, HeadingSmall, Paragraph } from "../components/ui";

export default function Home() {
  const [completed, setCompleted] = useState(false);

  const handleConvertComplete = useCallback(() => {
    setCompleted(true);
  }, []);

  const handleReset = useCallback(() => {
    setCompleted(false);
  }, []);

  if (completed) {
    return (
      <Layout step={PandocStep.Download}>
        <div className="text-center py-8">
          <svg className="mx-auto h-16 w-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <HeadingSmall className="mb-2">Download Complete!</HeadingSmall>
          <Paragraph className="mb-6">Your file has been converted and downloaded.</Paragraph>
          <Button onClick={handleReset}>Convert Another File</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout step={PandocStep.Upload}>
      <UploadStep onConvertComplete={handleConvertComplete} />
    </Layout>
  );
}
