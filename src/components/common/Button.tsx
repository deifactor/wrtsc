import classNames from "classnames";
import { ReactNode } from "react";
import { usePopperTooltip } from "react-popper-tooltip";
import "react-popper-tooltip/dist/styles.css";
import { IconType } from "react-icons";

interface Props {
  onClick: () => void;
  icon?: IconType;
  state?: "active" | "locked";
  kind?: "normal" | "danger";
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
  tooltip?: ReactNode;
}

export const Button = ({
  onClick,
  icon,
  state = "active",
  kind = "normal",
  size = "md",
  children,
  className,
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
    sm: "py-1 px-1 h-7",
    md: "py-2 px-2 h-10",
  };
  const stateClass = {
    locked: "text-red-600",
    active: "text-white",
  };
  const kindClass = {
    normal: "bg-gray-900 hover:bg-gray-500",
    danger: "bg-red-500 hover:bg-red-100",
  };
  const Icon = icon;
  const button = (
    <button
      ref={setTriggerRef}
      onClick={state !== "locked" ? onClick : () => {}}
      className={classNames(
        "font-bold rounded-sm",
        "inline-flex items-center",
        "outline outline-1 outline-offset-1 outline-gray-500",
        "m-1",
        className,
        sizeClass[size],
        stateClass[state],
        kindClass[kind]
      )}
    >
      {Icon && <Icon className="mr-2" size="1.5em" />}
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
