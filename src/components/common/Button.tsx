import classNames from "classnames";
import { ReactNode } from "react";
interface Props {
  onClick: () => void;
  size?: "sm" | "md";
  children: ReactNode;
}

export const Button = (props: Props) => {
  const size = props.size || "md";
  return (
    <button
      onClick={props.onClick}
      className={classNames(
        "bg-slate-900 hover:bg-gray-500 text-white font-bold rounded-sm",
        "outline outline-1 outline-offset-1 outline-gray-500",
        "m-1",
        { "py-2 px-4": size == "md", "py-1 px-2": size == "sm" }
      )}
    >
      {props.children}
    </button>
  );
};
