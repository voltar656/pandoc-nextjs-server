import { FC, useCallback, useState } from "react";
import axios from "axios";
import { Button } from "./ui";
import appConfig from "../lib/config";
import { IStatus } from "../lib/writeMetaFile";

interface IProps {
  status: IStatus;
  onSubmit(): void;
}

export const ScrapboxForm: FC<IProps> = ({
  status: { name, format, date },
  onSubmit,
}) => {
  const [posting, setPosting] = useState(false);

  const handleClick = useCallback(async () => {
    setPosting(true);
    try {
      const res = await axios.post(
        "/api/scrapbox",
        { file: name },
        { responseType: "json" }
      );
      if (res.data?.success) {
        onSubmit();
      }
    } catch (e) {
      // something wrong happened
    }
    setPosting(false);
  }, [name, onSubmit]);

  const formatInfo = appConfig.formats.find((f) => f.value === format);

  return (
    <div className="space-y-4">
      <ul className="space-y-2 text-sm">
        <li className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">Date created:</span>
          <span className="font-medium">{new Date(date).toLocaleString()}</span>
        </li>
        <li className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">Destination format:</span>
          <span className="font-medium">{formatInfo?.label || format}</span>
        </li>
      </ul>
      <Button onClick={handleClick} disabled={posting}>
        {posting ? "Converting..." : "Convert"}
      </Button>
    </div>
  );
};
