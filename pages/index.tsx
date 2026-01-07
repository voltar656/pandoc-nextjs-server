import { useCallback, useState } from "react";

import { Layout } from "../components/Layout";
import { PandocStep } from "../components/Steps";
import { UploadStep, ConversionResult } from "../components/UploadStep";
import { Button, HeadingSmall, Paragraph } from "../components/ui";

export default function Home() {
  const [result, setResult] = useState<ConversionResult | null>(null);

  const handleConvertComplete = useCallback((conversionResult: ConversionResult) => {
    setResult(conversionResult);
  }, []);

  const handleDownload = useCallback(() => {
    if (!result) return;

    const url = window.URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", result.filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, [result]);

  const handleReset = useCallback(() => {
    setResult(null);
  }, []);

  if (result) {
    return (
      <Layout step={PandocStep.Download}>
        <div className="text-center py-8">
          <svg
            className="mx-auto h-16 w-16 text-green-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <HeadingSmall className="mb-2">Conversion Complete!</HeadingSmall>
          <Paragraph className="mb-6">Your file is ready for download.</Paragraph>

          <div className="space-y-4">
            <Button onClick={handleDownload} className="w-full max-w-xs">
              Download {result.filename}
            </Button>

            <div>
              <button
                onClick={handleReset}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Convert another document
              </button>
            </div>
          </div>
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
