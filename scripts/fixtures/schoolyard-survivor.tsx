import React from "react";
import { createRoot } from "react-dom/client";
import SchoolyardSurvivorScreen from "../../src/components/SchoolyardSurvivorScreen";
import "../../src/styles.css";
import { useXboxControllerNavigation } from "../../src/hooks/useXboxControllerNavigation";
const languageMode =
  new URLSearchParams(location.search).get("lang") === "en"
    ? "ENGLISH"
    : "JAPANESE";
function Harness() {
  useXboxControllerNavigation();
  return (
    <SchoolyardSurvivorScreen
      languageMode={languageMode}
      onBack={() => {
        document.getElementById("root")!.dataset.exited = "true";
      }}
    />
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
