import { FC, useCallback } from "react";
import { Button } from "./ui";
import { IStatus } from "../lib/writeMetaFile";

interface Props {
  status: IStatus;
  onDownload: (name: string) => void;
}

export const UploadStatus: FC<Props> = ({ status, onDownload }) => {
  const handleClick = useCallback(() => {
    onDownload(status.name);
  }, [onDownload, status.name]);

  return (
    <div className="space-y-4">
      <ul className="space-y-2 text-sm">
        <li className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">Original file:</span>
          <span className="font-medium">{status.originalName}</span>
        </li>
        <li className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">Target format:</span>
          <span className="font-medium">{status.format}</span>
        </li>
        <li className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">Status:</span>
          <span className={`font-medium ${status.success ? "text-green-600" : status.error ? "text-red-600" : "text-yellow-600"}`}>
            {status.success ? "Complete" : status.error ? "Error" : "Converting..."}
          </span>
        </li>
        {status.error && (
          <li className="py-2 text-red-600 text-sm">
            {status.error}
          </li>
        )}
      </ul>
      <Button onClick={handleClick} disabled={!status.success}>
        {status.success ? "Download" : "Waiting..."}
      </Button>
    </div>
  );
};
