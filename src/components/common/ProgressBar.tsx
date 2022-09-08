import classNames from "classnames";
import Squares from "jsx:./squares.svg";
import circuits from "./progress_circuit.svg";

/**
 * A progress bar with custom themeing. To set the color, set the `color`
 * property (either in the element itself or a parent).
 *
 * In particular, this makes the boundary of the progress bar a little
 * "square-y" for aesthetics.
 *
 * The classNames can be whatever you like *aside* from overriding the `display` property.
 */
export const ProgressBar = (props: {
  max: number;
  text?: string;
  current: number;
  backgroundPosition?: string;
  className?: string;
}) => {
  const { max, current, className, backgroundPosition, text } = props;
  // We need to know the width of the SVG so we can calculate the width of the
  // 'bar'. We lerp the bar width so that the 'square-y' bits are invisible both
  // at 0% (because they're off to the left of the container) and 100% (because
  // they're off to the right).
  const svgWidth = "0.6em";

  const middleLabel = text && (
    <div
      className="absolute text-white z-10 w-full text-center text-gray-200"
      style={{
        left: svgWidth,
        textShadow:
          // Emulate stroke using text-shadow.
          "-1px -1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, 1px 1px 0 #000",
      }}
    >
      {text}
    </div>
  );

  return (
    <div className={classNames(className, "truncate")}>
      <div
        className="relative w-full h-full flex items-center"
        style={{ left: `-${svgWidth}` }}
      >
        {middleLabel}
        <div
          className="bg-current h-full flex-none"
          style={{
            width: `calc((100% + ${svgWidth}) * ${current / max})`,
          }}
        ></div>
        <Squares width={svgWidth} className="h-full" />
        <div
          className="h-full w-full absolute opacity-30"
          style={{
            backgroundImage: `url(${circuits})`,
            backgroundPosition: backgroundPosition,
          }}
        ></div>
      </div>
    </div>
  );
};
ProgressBar.displayName = "ProgressBar";
