import classNames from "classnames";
import { ReactNode } from "react";
import Tooltip from "rc-tooltip";
import "rc-tooltip/assets/bootstrap.css";

interface Props {
  onClick: () => void;
  state?: "active" | "locked";
  size?: "sm" | "md";
  children: ReactNode;
  tooltip?: ReactNode | (() => ReactNode);
}

export const Button = (props: Props) => {
  const size = props.size || "md";
  const state = props.state || "active";
  const button = (
    <button
      onClick={state !== "locked" ? props.onClick : () => {}}
      className={classNames(
        "bg-gray-900  hover:bg-gray-500 font-bold rounded-sm",
        "outline outline-1 outline-offset-1 outline-gray-500",
        "m-1",
        { "py-2 px-4": size === "md", "py-1 px-2": size === "sm" },
        {
          "text-red-600": state === "locked",
          "text-white": state === "active",
        }
      )}
    >
      {props.children}
    </button>
  );
  if (props.tooltip) {
    return (
      <Tooltip overlay={props.tooltip} placement="bottom">
        {button}
      </Tooltip>
    );
  } else {
    return button;
  }
};
