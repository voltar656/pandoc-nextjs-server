import { FC, ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { PandocStep } from "./Steps";

interface LayoutProps {
  title?: string;
  step: PandocStep;
  children: ReactNode;
}

const steps = [
  { id: PandocStep.Upload, label: "Upload" },
  { id: PandocStep.Convert, label: "Convert" },
  { id: PandocStep.Download, label: "Download" },
];

export const Layout: FC<LayoutProps> = ({ title, step, children }) => {
  return (
    <>
      <Head>
        <title>{title ? `${title} | Pandoc Server` : "Pandoc Server"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              Pandoc Server
            </Link>
          </div>
        </header>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <nav className="flex items-center justify-center gap-4 mb-8">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    s.id === step
                      ? "bg-blue-600 text-white"
                      : s.id < step
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s.id < step ? "✓" : idx + 1}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    s.id === step ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {s.label}
                </span>
                {idx < steps.length - 1 && (
                  <div className="w-12 h-0.5 mx-4 bg-gray-200" />
                )}
              </div>
            ))}
          </nav>

          {/* Content */}
          <main className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
};
