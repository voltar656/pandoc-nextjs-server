import { FC } from "react";

export const Header: FC = () => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Pandoc Server</h1>
      <p className="text-gray-600">Convert documents between formats</p>
    </div>
  );
};
