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
        "bg-gray-800 hover:bg-gray-500 text-white font-bold rounded-md",
        { "py-2 px-4": size == "md", "py-1 px-2": size == "sm" }
      )}
    >
      {props.children}
    </button>
  );
};
