import { ReactNode } from "react";
import RSSwitch from "react-switch";

type Props = {
  checked: boolean;
  children: ReactNode;
  onChange: (checked: boolean) => void;
};

export const Switch = ({ children, checked, onChange }: Props) => {
  return (
    <label className="inline-flex items-center">
      {children}
      <RSSwitch
        className="ml-3"
        checked={checked}
        onChange={onChange}
        height={25}
        width={50}
        handleDiameter={25}
      />
    </label>
  );
};
