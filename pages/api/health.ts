import { NextApiRequest, NextApiResponse } from "next";
import { spawn } from "child_process";

async function getPandocVersion(): Promise<string> {
  return new Promise((resolve) => {
    let output = "";
    const proc = spawn("pandoc", ["--version"]);
    
    proc.stdout.on("data", (data: Buffer) => {
      output += data.toString();
    });

    proc.on("error", () => {
      resolve("unknown");
    });

    proc.on("exit", () => {
      // First line is "pandoc X.Y.Z"
      const match = output.match(/^pandoc\s+([\d.]+)/i);
      resolve(match ? match[1] : "unknown");
    });
  });
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const pandocVersion = await getPandocVersion();

  res.status(200).json({
    status: "ok",
    pandoc: pandocVersion,
  });
};

export default handler;
