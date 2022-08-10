import classNames from "classnames";

type Props = {
  className?: string;
};

export const Credits = (props: Props) => {
  return (
    <div className={classNames(props.className, "space-y-2 indent-8")}>
      <p>
        This game wouldn't exist without{" "}
        <a href="https://twitter.com/VyrCossont">Vyr</a>, who helped motivate me
        and let me bounce ideas off of her.
      </p>
      <p>
        Thanks to <a href="https://game-icons.net/">game-icons.net</a> for the
        skill icons and to{" "}
        <a href="https://www.freepik.com/vectors/background">
          coolvector on freepik
        </a>
        for the backgrounds.
      </p>
      <p>
        wrtsc is <em>very</em> strongly inspired by one of my favorite
        incremental games of all time,{" "}
        <a href="https://omsi6.github.io/loops/">Idle Loops</a>, by Omsi6,
        StopSign, and all the other devs. Thanks to the Discord for the
        feedback.
      </p>
      <p>And, of course, thank you for playing. :)</p>
      <p>To all the robots out there. May you find your kind.</p>
    </div>
  );
};
Credits.displayName = "Credits";
