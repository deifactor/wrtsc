export const HelpPanel = () => {
  return (
    <div>
      <h1>How to Play</h1>
      <p className="my-2">
        wrtsc is a time-loop idle game. If you've played any variation of Idle
        Loops, the basic gameplay is basically the same.
      </p>
      <p className="my-2">
        The queue panel is the main interface for playing the game. On the left
        is the list of tasks that you want to execute; on the right is the tasks
        you're executing. You can't change tasks mid-loop; any changes will
        apply at the start of the next loop. You can add tasks to the queue
        using the buttons at the bottom and reorder them using the buttons next
        to each entry in the task queue.
      </p>
      <p className="my-2">
        If nothing is happening, try hitting the play/pause button and the
        'restart loop' button on the left hand panel. If things are behaving
        unexpectedly, please{" "}
        <a href="https://github.com/deifactor/wrtsc/issues/new">file a bug</a>{" "}
        or talk to me on Discord!
      </p>
      <h1>Skills</h1>
      <p className="my-2">
        Most actions will give you some amount of XP in a skill. Getting a skill
        from level N - 1 to level N takes <code>N * 1024</code> XP, so skills
        will level slower as you go. Hover over a skill name in the player panel
        to see what it does.
      </p>
      <h1>Simulant</h1>
      <p className="my-2">
        The simulant system allows you to effectively run some aspects of your
        teammates' personality. Once you've unlocked it, you get simulant XP at
        a rate of 1 per second. You can spend simulant XP to unlock subroutines,
        which are permanent buffs that persist across all loops. Hovering over a
        subroutine will tell you its effects. Note that subroutine XP is not
        refundable!
      </p>
      <h1>Combat</h1>
      <p className="my-2">
        Certain tasks are 'combat' tasks, which represent Aion fighting someone
        or something. You and your opponent simultaneously deal{" "}
        <code>offense * armorMultiplier</code> damage to each other per second,
        where <code>armorMultiplier = offense / (offense + defense)^2</code>{" "}
        damage to each other each second. If the task reaches 0 HP, you succeed;
        if you reach 0 HP, the loop restarts, even if the task reaches 0 HP on
        the same game update. Note that combat tasks still use energy as well!
      </p>
      <p className="my-2">
        The effect of the armor multiplier is that if your offense is near the
        target's defense (or vice versa), your damage is significantly cut. For
        example, against a target with 100 defense, if your offense is 100 then
        you'll only do 25 damage, but if your offense is 30 then you'll deal
        about 90 damage.
      </p>
      <h1>Matter</h1>
      <p className="my-2">
        Aion is meant to be a self-sustaining weapons platform. Matter
        represents its ability to break down its opponents and their gear.
        Certain tasks will give matter as a reward; <b>Matter: Repair</b> and{" "}
        <b>Matter: Weaponry</b> will control how Aion uses matter.
      </p>
    </div>
  );
};
HelpPanel.displayName = HelpPanel;
