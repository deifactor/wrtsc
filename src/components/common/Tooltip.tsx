import React from "react";
import { ReactNode } from "react";

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
export const Tooltip = React.memo(
  (props: {
    children: ReactNode;
    title?: string;
    metadata?: Record<string, ReactNode>;
    lore?: ReactNode;
  }) => {
    const { children, title, metadata, lore } = props;
    return (
      <div className="w-96 p-2 text-sm">
        {title && <p className="font-bold">{title}</p>}
        <p className="my-2">{children}</p>
        {metadata && renderMetadata(metadata)}
        {lore && (
          <>
            <hr className="border-gray-700 my-3" />
            <p className="text-xs mb-2 text-gray-400">{lore}</p>
          </>
        )}
      </div>
    );
  }
);
Tooltip.displayName = "Tooltip";
