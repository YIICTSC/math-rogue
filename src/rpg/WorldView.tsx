import React, { lazy, Suspense, useState } from "react";
import WorldCanvas from "./WorldCanvas";
import { useRpgPreferences, updateRpgPreferences } from "./preferences";
import "./world3d.css";
const Scene = lazy(() => import("./WorldScene3D"));
type BoundaryProps = { children: React.ReactNode; onFailure: () => void };
class Boundary extends React.Component<BoundaryProps, { failed: boolean }> {
  declare readonly props: Readonly<BoundaryProps>;
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export default function WorldView(
  props: React.ComponentProps<typeof WorldCanvas> & {
    onEnergyRequest?:()=>void;
    onVoxelAction?: (a:import("./voxel").VoxelAction)=>void;
    paused?: boolean;
    facing: number;
    onFacing: (n: number) => void;
  },
) {
  const prefs = useRpgPreferences(),
    [failed, setFailed] = useState(false);
  const unavailable = () => {
    setFailed(true);
    updateRpgPreferences({ mapView: "2D" });
  };
  if (props.paused) return null;
  return (
    <>
      {prefs.mapView === "3D" && !props.overview ? (
        <Boundary onFailure={unavailable}>
          <Suspense fallback={<WorldCanvas {...props} />}>
            <Scene {...props} onUnavailable={unavailable} />
          </Suspense>
        </Boundary>
      ) : (
        <WorldCanvas {...props} />
      )}{" "}
      {failed && (
        <button className="rpg-3d-fallback" onClick={() => setFailed(false)}>
          WebGL · 2D ✓
        </button>
      )}
    </>
  );
}
