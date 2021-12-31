import classNames from "classnames";
import { ReactNode } from "react";
import { usePopperTooltip } from "react-popper-tooltip";
import "react-popper-tooltip/dist/styles.css";

interface Props {
  onClick: () => void;
  state?: "active" | "locked";
  kind?: "normal" | "danger";
  size?: "sm" | "md";
  children: ReactNode;
  tooltip?: ReactNode;
}

export const Button = ({
  onClick,
  state = "active",
  kind = "normal",
  size = "md",
  children,
  tooltip,
}: Props) => {
  const {
    getArrowProps,
    getTooltipProps,
    setTooltipRef,
    setTriggerRef,
    visible,
  } = usePopperTooltip();

  const sizeClass = {
    sm: "py-1 px-2",
    md: "py-2 px-4",
  };
  const stateClass = {
    locked: "text-red-600",
    active: "text-white",
  };
  const kindClass = {
    normal: "bg-gray-900 hover:bg-gray-500",
    danger: "bg-red-500 hover:bg-red-100",
  };
  const button = (
    <button
      ref={setTriggerRef}
      onClick={state !== "locked" ? onClick : () => {}}
      className={classNames(
        "font-bold rounded-sm",
        "outline outline-1 outline-offset-1 outline-gray-500",
        "m-1",
        sizeClass[size],
        stateClass[state],
        kindClass[kind]
      )}
    >
      {children}
    </button>
  );

  if (tooltip) {
    return (
      <>
        {button}
        {visible && (
          <div
            ref={setTooltipRef}
            {...getTooltipProps({ className: "tooltip-container" })}
          >
            {tooltip}
            <div {...getArrowProps({ className: "tooltip-arrow" })} />
          </div>
        )}
      </>
    );
  } else {
    return button;
  }
};
