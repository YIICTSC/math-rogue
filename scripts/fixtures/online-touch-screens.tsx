import RpgOnline from "../../src/rpg/RpgOnline";
import { updateRpgPreferences } from "../../src/rpg/preferences";
import React from "react";
import { createRoot } from "react-dom/client";
import GakuroKart from "../../src/mini-games/gakuro-kart/GakuroKart";
import OnlineGame from "../../src/mini-games/gakurogear/OnlineGame";
import {
  createWorld,
  addPlayer,
  startWorld,
} from "../../src/mini-games/gakurogear/onlineEngine";
import "../../src/styles.css";
import "../../src/mini-games/gakurogear/gakurogear.css";
const root = createRoot(document.getElementById("root")!);
(window as any).__onlineSends = [];
const kind = new URLSearchParams(location.search).get("kind");
if (kind === "rpg") {
  updateRpgPreferences({
    mapView: "3D",
    control: "stick",
    lookControl: "stick",
    mapQuality: "low",
  });
  const noop = () => {};
  const player = {
    id: "WARRIOR",
    maxHp: 80,
    currentHp: 80,
    maxEnergy: 3,
    currentEnergy: 3,
    gold: 99,
    deck: [],
    relics: [],
    hand: [],
    potions: [],
    powers: {},
    discardPile: [],
    drawPile: [],
    block: 0,
    strength: 0,
  };
  root.render(
    <RpgOnline
      player={player as any}
      active
      languageMode="ENGLISH"
      onRoom={noop}
      onSnapshot={noop}
      onSetup={noop}
      onClose={noop}
    />,
  );
} else if (kind === "kart")
  root.render(<GakuroKart languageMode="ENGLISH" onClose={() => {}} />);
else {
  const world = createWorld("coop", 1, { title: "Touch QA", questions: [] });
  addPlayer(world, "p0", "Touch player");
  addPlayer(world, "p1", "Partner");
  startWorld(world, 12345);
  const room = {
    selfId: "p0",
    host: true,
    input(value: any) {
      (window as any).__onlineSends.push({ ...value });
    },
    answer() {},
    completeQuiz() {},
    retry() {},
    supply() {},
    rematch() {},
    setSpectator() {},
  };
  root.render(
    <OnlineGame world={world} room={room as any} en onBack={() => {}} />,
  );
}
