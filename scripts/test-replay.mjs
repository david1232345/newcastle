import { readFile, writeFile } from "node:fs/promises";
import { parseHbr2, focusPlayerReport } from "../lib/hbr2.js";

const replayPath = new URL("../samples/Vivet_Hostin_0-3_20260802023930.hbr2", import.meta.url);
const buffer = await readFile(replayPath);
const parsed = parseHbr2(buffer, "Vivet_Hostin_0-3_20260802023930.hbr2");
const output = {
  duration: parsed.durationLabel,
  room: parsed.roomName,
  players: parsed.players,
  goals: parsed.goals,
  focus: focusPlayerReport(parsed, "D1zks"),
  limitations: parsed.limitations
};
await writeFile(new URL("../samples/sample-analysis.json", import.meta.url), JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
