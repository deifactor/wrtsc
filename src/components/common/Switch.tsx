import classNames from "classnames";
import { ReactNode } from "react";
import RSSwitch from "react-switch";

type Props = {
  checked: boolean;
  children: ReactNode;
  onChange: (checked: boolean) => void;
};

export const Switch = ({ children, checked, onChange }: Props) => {
  return (
    <label>
      {children}
      <RSSwitch checked={checked} onChange={onChange} />
    </label>
  );
};
