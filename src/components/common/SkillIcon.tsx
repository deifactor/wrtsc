import React from "react";
import { IconType } from "react-icons";
import {
  GiAbstract089,
  GiCharging,
  GiMeshNetwork,
  GiProcessor,
  GiRadarSweep,
  GiTargeting,
} from "react-icons/gi";
import { SkillId } from "../../engine/skills";

const ICONS: Record<SkillId, IconType> = {
  lethality: GiTargeting,
  datalink: GiMeshNetwork,
  metacognition: GiProcessor,
  spatial: GiRadarSweep,
  energyTransfer: GiCharging,
  ergodicity: GiAbstract089,
};

export const SkillIcon = (props: {
  id: SkillId;
  className?: string;
  size?: string;
}) => {
  const { id, className, size } = props;
  const Icon = ICONS[id];
  return (
    <Icon className={className} color="currentColor" size={size || "1.5em"} />
  );
};
SkillIcon.displayName = "SkillIcon";
