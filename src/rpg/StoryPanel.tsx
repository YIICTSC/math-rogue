import "./town/encounter.css";
import React, { useEffect, useRef } from "react";
import TranslatedUiTree from "../components/TranslatedUiTree";
import type { LanguageMode } from "../types";
import { trans } from "../utils/textUtils";
import {
  STORIES,
  storyForSite,
  storyDialogue,
  type StoryAction,
} from "./stories";
import type { World, Adventurer, Site } from "./engine";
import { biomeAt } from "./biomes";
import { assetUrl } from "../utils/assetPaths";
export function StoryJournal({
  world,
  player,
  onTrack,
  languageMode,
}: {
  world?: World;
  languageMode: LanguageMode;
  player: Adventurer;
  onTrack: (x: number, y: number) => void;
}) {
  return (
    <TranslatedUiTree mode={languageMode}>
      <details className="rpg-journal">
        <summary>
          冒険手帳 ·{" "}
          {
            Object.values(player.stories || {}).filter(
              (p) => p.stage === "complete",
            ).length
          }{" "}
          / {STORIES.length}
        </summary>
        <p>依頼は好きな順番で進められます。</p>
        {STORIES.map((base) => {
          const site = world?.sites.find(
            (v) => v.storyId === base.id && v.storyRole === "npc",
          );
          const s = site ? storyForSite(site, player)! : base;
          const progress = player.stories?.[s.id];
          const goal = progress?.stage === "accepted";
          return (
            <button
              key={s.id}
              onClick={() =>
                onTrack(
                  goal ? s.goalX : (site?.x ?? s.x),
                  goal ? s.goalY : (site?.y ?? s.y),
                )
              }
            >
              <img
                className="rpg-journal-story-portrait"
                src={assetUrl(s.portrait)}
                alt=""
              />
              <span className="rpg-journal-story-copy">
                <strong>{s.title}</strong>
                <small>
                  {progress?.stage === "complete"
                    ? "完了"
                    : goal
                      ? s.goal
                      : progress?.stage === "found"
                        ? `${trans(s.npc, languageMode)} · ${trans("報告", languageMode)}`
                        : s.npc}{" "}
                  · {biomeAt(s.x, s.y).name}
                </small>
              </span>
            </button>
          );
        })}
      </details>
    </TranslatedUiTree>
  );
}
export function StoryDialog({
  site,
  player,
  send,
  onClose,
  languageMode,
}: {
  languageMode: LanguageMode;
  site: Site;
  player: Adventurer;
  send: (a: StoryAction) => void;
  onClose: () => void;
}) {
  const { story, text, choices } = storyDialogue(site, player);
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    return () => previous?.focus();
  }, []);
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
    if (e.key === "Tab") {
      const buttons =
        dialog.current?.querySelectorAll<HTMLButtonElement>("button");
      if (!buttons?.length) return;
      const first = buttons[0],
        last = buttons[buttons.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialog.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  return (
    <TranslatedUiTree mode={languageMode}>
      <div className="rpg-npc-screen rpg-story-screen">
        <img
          className="rpg-event-background"
          src={assetUrl(story.background)}
          alt=""
        />
        <section
          ref={dialog}
          tabIndex={-1}
          onKeyDown={key}
          className="rpg-story-dialog rpg-roaming-npc-dialog"
          role="region"
          aria-labelledby="rpg-story-title"
          onClick={(e) => e.stopPropagation()}
        >
          <small>
            {biomeAt(site.x, site.y).name} · {story.title}
          </small>
          <div className="rpg-story-dialog-layout">
            {site.storyRole === "npc" ? (
              <img
                className="rpg-story-dialog-portrait"
                src={assetUrl(story.portrait)}
                alt=""
              />
            ) : (
              <img
                className="rpg-story-dialog-portrait rpg-story-clue"
                src={assetUrl(story.illustration)}
                alt=""
              />
            )}
            <div className="rpg-story-dialog-copy">
              <h2 id="rpg-story-title">
                {site.storyRole === "npc" ? story.npc : story.goal}
              </h2>
              <img
                className="rpg-event-illustration"
                src={assetUrl(story.illustration)}
                alt=""
              />
              <p>{text}</p>
              <div>
                {choices.map((c) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      send({
                        type: "story-choice",
                        siteId: site.id,
                        choice: c.id,
                      })
                    }
                  >
                    {c.label}
                  </button>
                ))}

              </div>
            </div>
          </div>
          <button className="rpg-npc-event-close" onClick={onClose}>会話を終える</button>
        </section>
      </div>
    </TranslatedUiTree>
  );
}
