import classNames from "classnames";
import { ReactNode } from "react";
import { IconType } from "react-icons";
import React from "react";

interface Props {
  onClick: () => void;
  icon?: IconType;
  // "Unlocked" is for things like simulant subroutines that are effectively
  // permanently active. XXX: This really needs to be better.
  state?: "active" | "locked" | "unlocked";
  kind?: "normal" | "danger";
  size?: "xs" | "sm" | "md";
  children: ReactNode;
  className?: string;
}

export const Button = React.memo(
  React.forwardRef(
    (
      {
        onClick,
        icon,
        state = "active",
        kind = "normal",
        size = "md",
        children,
        className,
      }: Props,
      ref: React.ForwardedRef<HTMLButtonElement | null>
    ) => {
      const sizeClass = {
        xs: "h-5 outline-0 bg-inherit",
        sm: "py-1 px-1 h-7",
        md: "py-2 px-2 h-10",
      };
      const stateClass = {
        locked: "text-red-600",
        active: "text-white",
        unlocked: "text-green-300",
      };
      const kindClass = {
        normal: "bg-gray-900 hover:bg-gray-500",
        danger: "bg-red-500 hover:bg-red-100",
      };
      const Icon = icon;
      return (
        <button
          ref={ref}
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
    }
  )
);
