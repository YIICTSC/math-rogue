import React from "react";
import { createRoot } from "react-dom/client";
import { useSchoolAdventure } from "../../src/components/school-dungeon/useSchoolAdventure";
import { StudentPicker } from "../../src/components/school-dungeon/student/StudentPanels";
import { newBase } from "../../src/components/school-dungeon/adventure";
import SurvivorLobby from "../../src/mini-games/schoolyard-survivor/SurvivorLobby";
import "../../src/styles.css";
function Harness() {
  const noop = () => {};
  const a = useSchoolAdventure({
    game: 1,
    language: "JAPANESE",
    known: () => true,
    stairs: noop,
    map: [],
    player: { x: 0, y: 0, hp: 80, maxHp: 80 },
    inventory: [],
    enemies: [],
    traps: [],
    floorItems: [],
    floor: 1,
    belly: 100,
    gameOver: false,
    gameClear: false,
    setPlayer: noop,
    setInventory: noop,
    setEnemies: noop,
    setTraps: noop,
    setFloorItems: noop,
    setMap: noop,
    setGameOver: noop,
    setGameClear: noop,
    setMenuOpen: noop,
    setBelly: noop,
    setIdentifiedTypes: noop,
    log: noop,
    restart: noop,
    descend: noop,
    turn: noop,
    clearSave: noop,
    itemName: () => "",
    catalog: {},
  });
  (window as any).__unlock = { adventure: a, newBase };
  return new URLSearchParams(location.search).get("kind") === "survivor" ? (
    <SurvivorLobby
      languageMode="JAPANESE"
      weaponName={(s) => s}
      onBack={noop}
      onStart={() => {
        (window as any).__started = true;
      }}
    />
  ) : (
    <StudentPicker adventure={a} />
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
