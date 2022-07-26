import { Difficulty } from "https://deno.land/x/remapper/src/mod.ts"

const map = new Difficulty("ExpertPlusLawless.dat", "ExpertPlusStandard.dat");

// SCRIPT

map.save();