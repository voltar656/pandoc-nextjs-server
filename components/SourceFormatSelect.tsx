import { FC, useCallback, useState } from "react";
import { Select, Value, OnChangeParams } from "baseui/select";

import appConfig from "../lib/config";

interface IProps {
  onSelect(value: ISourceFormat): void;
}

export interface ISourceFormat {
  id: string;
  value: string;
}

export const sourceFormats: ISourceFormat[] = appConfig.sourceFormats;

export const SourceFormatSelect: FC<IProps> = ({ onSelect }) => {
  const [value, setValue] = useState<Value>([sourceFormats[0]]);
  const handleChange = useCallback(
    ({ value: selected }: OnChangeParams) => {
      setValue(selected);
      onSelect((selected[0] as unknown) as ISourceFormat);
    },
    [onSelect]
  );
  return (
    <Select
      options={sourceFormats}
      labelKey="id"
      valueKey="value"
      onChange={handleChange}
      value={value}
    />
  );
};
