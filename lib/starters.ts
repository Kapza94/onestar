import { EXAMPLE_IDEA } from "./example-report";

export type StarterSearch = {
  idea: string;
  kind: "sample" | "prompt";
  note: string;
};

export const STARTER_SEARCHES: StarterSearch[] = [
  {
    idea: EXAMPLE_IDEA,
    kind: "sample",
    note: "sample report",
  },
  {
    idea: "A sleep coach app for night-shift nurses who keep missing their recovery window.",
    kind: "prompt",
    note: "starter",
  },
  {
    idea: "A shared roasting board for independent coffee shops with unused capacity.",
    kind: "prompt",
    note: "starter",
  },
];
