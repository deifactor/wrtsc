import React from "react";
import { ReactNode } from "react";
import "react-popper-tooltip/dist/styles.css";
import { usePopperTooltip } from "react-popper-tooltip";

function renderMetadata(metadata: Record<string, ReactNode>): ReactNode {
  const entries = Object.entries(metadata);
  if (!entries.length) {
    return;
  }
  const renderedEntries = entries
    .filter(([_name, child]) => child)
    .map(([name, child]) => (
      <li>
        <strong>{name}</strong>: {child}
      </li>
    ));
  return <ul>{renderedEntries}</ul>;
}

/**
 * Generic tooltip with preapplied classes. The metadata and lore are appended
 * to the description. For full control, only pass children.
 *
 * Note that any metadata whose rendered value is falsy is not displayed. This
 * lets you map over a list.
 */
export const CardTooltip = React.memo(
  (props: {
    children: ReactNode;
    title?: string;
    metadata?: Record<string, ReactNode>;
    lore?: ReactNode;
  }) => {
    const { children, title, metadata, lore } = props;
    return (
      <>
        {title && <p className="font-bold">{title}</p>}
        <p className="my-2">{children}</p>
        {metadata && renderMetadata(metadata)}
        {lore && (
          <>
            <hr className="border-gray-700 my-3" />
            <p className="text-xs mb-2 text-gray-400">{lore}</p>
          </>
        )}
      </>
    );
  }
);
CardTooltip.displayName = "Tooltip";

/**
 * Renders the child and displays the given tooltip on mouseover. If you want
 * anything more complicated than plain text, you probably want to use
 * `CardTooltip` with this.
 *
 * The render prop is passed a ref as an argument; you must attach that ref to
 * your component so the tooltip actually triggers.
 */
export const WithTooltip = React.memo(
  (props: {
    tooltip: ReactNode;
    render: (
      ref: React.Dispatch<React.SetStateAction<HTMLElement | null>>
    ) => ReactNode;
  }) => {
    const { tooltip, render } = props;
    const {
      getArrowProps,
      getTooltipProps,
      setTooltipRef,
      setTriggerRef,
      visible,
    } = usePopperTooltip();
    return (
      <>
        {render(setTriggerRef)}
        {visible && (
          <div
            ref={setTooltipRef}
            {...getTooltipProps({
              className: "tooltip-container w-96 p-2 text-sm",
            })}
          >
            {tooltip}
            <div {...getArrowProps({ className: "tooltip-arrow" })} />
          </div>
        )}
      </>
    );
  }
);
