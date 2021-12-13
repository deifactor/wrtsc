import { makeAutoObservable } from "mobx";
import { Stats } from "./stats";

export class Player {
  readonly stats: Stats;

  constructor() {
    this.stats = new Stats();
    makeAutoObservable(this);
  }
}
