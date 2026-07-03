"use client";

import type { ReactNode } from "react";

type LoginCardProps = {
  title: string;
  subtitle: string;
  badge: string;
  footer: ReactNode;
  children: ReactNode;
};

export function LoginCard({ title, subtitle, badge, footer, children }: LoginCardProps) {
  return (
    <section className="login-card">
      <div className="login-card__awning" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <strong>{badge}</strong>
      </div>
      <div className="login-card__body">
        <header className="login-card__heading">
          <p className="login-card__eyebrow">STOCK MARKET</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        {children}
        <div className="login-card__footer">{footer}</div>
      </div>
    </section>
  );
}
