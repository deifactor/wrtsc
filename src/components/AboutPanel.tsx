import classNames from "classnames";

type Props = {
  className?: string;
};

export const AboutPanel = (props: Props) => {
  return (
    <div className={classNames(props.className, "space-y-2 indent-8")}>
      <h1>About</h1>
      <p>
        <a href="https://github.com/deifactor/wrtsc">
          The canonical git repo for this game
        </a>{" "}
        is where all the development happens. If you run into any issues, please
        file an issue there;{" "}
        <strong>this game is still in beta and under active development</strong>
        , so don't expect a smooth, polished experience (yet).
      </p>
      <p>
        If you want to talk about wrtsc, or if you want to file a bug report but
        don't have a github account, check out{" "}
        <a href=" https://discord.gg/kdw9z2VRX7">the wrtsc discord</a>.
      </p>
      <h1>Thanks</h1>
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
        </a>{" "}
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
AboutPanel.displayName = "AboutPanel";
