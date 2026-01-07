import { NextApiRequest, NextApiResponse } from "next";
import { spawn } from "child_process";
import { createRequestLogger } from "../../lib/logger";

interface HealthResponse {
  status: "ok" | "degraded";
  pandoc: string;
}

async function getPandocVersion(): Promise<string> {
  return new Promise((resolve) => {
    let output = "";
    const proc = spawn("pandoc", ["--version"]);

    proc.stdout.on("data", (data: Buffer) => {
      output += data.toString();
    });

    proc.on("error", () => {
      resolve("unavailable");
    });

    proc.on("exit", () => {
      // First line is "pandoc X.Y.Z"
      const match = output.match(/^pandoc\s+([\d.]+)/i);
      resolve(match?.[1] ?? "unknown");
    });
  });
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
): Promise<void> => {
  const logger = createRequestLogger(req);
  logger.debug("Health check requested");

  const pandocVersion = await getPandocVersion();
  const isHealthy = pandocVersion !== "unavailable";

  const response: HealthResponse = {
    status: isHealthy ? "ok" : "degraded",
    pandoc: pandocVersion,
  };

  logger.info({ pandocVersion, status: response.status }, "Health check complete");
  res.status(isHealthy ? 200 : 503).json(response);
};

export default handler;
