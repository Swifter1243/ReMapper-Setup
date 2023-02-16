import { Difficulty } from "https://deno.land/x/remapper@3.1.1/src/mod.ts" // MAKE SURE THIS IS ON THE LATEST REMAPPER VERSION!!!!!!!!!

const map = new Difficulty("ExpertPlusLawless.dat", "ExpertPlusStandard.dat");

// SCRIPT

map.save();
