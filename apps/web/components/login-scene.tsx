"use client";

import type { ReactNode } from "react";

type LoginSceneProps = {
  art: ReactNode;
  card: ReactNode;
};

export function LoginScene({ art, card }: LoginSceneProps) {
  return (
    <main className="login-scene">
      <div className="login-scene__shell">
        <section className="login-scene__art" aria-hidden="true">
          <div className="login-scene__artFrame">{art}</div>
        </section>
        <section className="login-scene__cardColumn">{card}</section>
      </div>
    </main>
  );
}
