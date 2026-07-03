"use client";

import type { ReactNode } from "react";
import { FormField } from "@/components/page-kit";

type LoginFieldProps = {
  label: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function LoginField({ label, error, children, className }: LoginFieldProps) {
  return (
    <FormField className={className} label={label} error={error}>
      {children}
    </FormField>
  );
}
