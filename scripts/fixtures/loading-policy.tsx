import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { deferredScreen } from "../../src/utils/deferredScreen";
const api = {
  calls: { a: 0, b: 0, startup: 0 },
  release: null as null | (() => void),
  failB: true,
  failStartup: true,
  waiting: 0,
};
(window as any).__loadingPolicy = api;
window.addEventListener("learning-rogue-startup-waiting", () => api.waiting++);
const A = deferredScreen<{ languageMode: "ENGLISH" }>(() => {
  api.calls.a++;
  return new Promise((resolve) => {
    api.release = () =>
      resolve({
        default: () => {
          const [count, setCount] = useState(0);
          return (
            <section>
              <h1>Screen A</h1>
              <button onClick={() => setCount((n) => n + 1)}>
                Count {count}
              </button>
            </section>
          );
        },
      });
  });
});
const B = deferredScreen<{ languageMode: "ENGLISH" }>(async () => {
  api.calls.b++;
  if (api.failB) throw Error("Failed to fetch dynamically imported module");
  return { default: () => <h1>Screen B</h1> };
});
const Startup = deferredScreen<{ languageMode: "ENGLISH" }>(
  async () => {
    api.calls.startup++;
    if (api.failStartup) throw Error("Startup initialization failed");
    return { default: () => <h1>Startup ready</h1> };
  },
  { startup: true },
);
function Fixture() {
  const [screen, setScreen] = useState("home");
  return (
    <main>
      <header>Game shell</header>
      <nav>
        {["home", "a", "b", "startup"].map((id) => (
          <button key={id} onClick={() => setScreen(id)}>
            {id}
          </button>
        ))}
      </nav>
      <article>
        {screen === "home" ? (
          <h1>Home</h1>
        ) : screen === "a" ? (
          <A languageMode="ENGLISH" />
        ) : screen === "b" ? (
          <B languageMode="ENGLISH" />
        ) : (
          <Startup languageMode="ENGLISH" />
        )}
      </article>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
