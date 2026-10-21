import React from "react";
import { createRoot } from "react-dom/client";
import {
  multiTouchAction,
  multiTouchHold,
} from "../../src/utils/multiTouchAction";
import SteeringPad from "../../src/mini-games/gakuro-kart/SteeringPad";
import BombStick from "../../src/mini-games/gakurogear/BombStick";
import EquipmentBar from "../../src/mini-games/gakurogear/EquipmentBar";
import { createRun, MISSIONS } from "../../src/mini-games/gakurogear/engine";
import TouchPad from "../../src/rpg/TouchPad";
import CameraControls from "../../src/rpg/CameraControls";
import ShotMeter from "../../src/mini-games/gakuro-golf/ShotMeter";
import { updateRpgPreferences } from "../../src/rpg/preferences";
const q = new URLSearchParams(location.search),
  kind = q.get("kind");
const input = ((window as any).__touch = {
  x: 0,
  y: 0,
  brake: false,
  drift: false,
  item: 0,
  shots: 0,
  moves: 0,
  look: 0,
  useItem: false,
  shoot: false,
  active: false,
  power: 0,
  result: 0,
});
const panel = {
  display: "flex",
  gap: 20,
  padding: 20,
  alignItems: "center",
  touchAction: "none" as const,
};
function Harness() {
  const run = createRun(MISSIONS[0]);
  if (kind === "kart")
    return (
      <main style={panel}>
        <div className="stick">
          <SteeringPad disabled={false} onChange={(v) => (input.x = v)} />
        </div>
        <button {...multiTouchHold((v) => (input.brake = v))}>BRAKE</button>
        <button {...multiTouchHold((v) => (input.drift = v))}>DRIFT</button>
        <button {...multiTouchAction(() => input.item++)}>ITEM</button>
      </main>
    );
  if (kind === "vr")
    return (
      <main style={panel}>
        <BombStick
          disabled={false}
          en
          onChange={(x, y) => {
            input.x = x;
            input.y = y;
          }}
        />
        <EquipmentBar
          en
          run={run}
          stageId={1}
          onInput={(v) => Object.assign(input, v)}
        />
      </main>
    );
  if (kind === "rpg")
    return (
      <main style={panel}>
        <TouchPad
          disabled={false}
          languageMode="ENGLISH"
          onMove={(x, y) => {
            input.x = x;
            input.y = y;
            input.moves++;
          }}
        />
        <CameraControls
          languageMode="ENGLISH"
          onLook={() => input.look++}
          onReset={() => input.item++}
        />
      </main>
    );
  return (
    <main style={panel}>
      <button
        id="aim"
        style={{ width: 80, height: 80, touchAction: "none" }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
      >
        AIM
      </button>
      <ShotMeter
        disabled={false}
        t={(s) => s}
        onActive={(v) => (input.active = v)}
        onPower={(v) => (input.power = v)}
        onShot={() => input.result++}
      />
    </main>
  );
}
if (kind === "rpg")
  updateRpgPreferences({
    control: "stick",
    mapView: "3D",
    lookControl: "stick",
  });
createRoot(document.getElementById("root")!).render(<Harness />);
