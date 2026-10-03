import React, { useEffect, useState } from "react";
import { heroFrame, type CustomHero, type HeroAction } from "./customHero";
export default function CustomHeroSprite({
  hero,
  action,
  className,
}: {
  hero: CustomHero;
  action: HeroAction;
  className?: string;
}) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    setTime(0);
    const timer = setInterval(() => setTime((t) => t + 155), 155);
    return () => clearInterval(timer);
  }, [hero.frames[action].join("|"), action]);
  return (
    <img
      alt={hero.name}
      data-hero-action={action}
      src={heroFrame(hero, action, time)}
      className={className}
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}
