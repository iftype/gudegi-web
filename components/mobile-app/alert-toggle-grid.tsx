"use client";

import { Bell, LayoutGrid, Type } from "lucide-react";
import type { PushPreference } from "@/lib/types";
import styles from "./mobile-app.module.css";

export function AlertToggleGrid({
  preference,
  onChange
}: {
  preference: PushPreference;
  onChange: (
    key: "enabled" | "categoryChanged" | "titleChanged",
    checked: boolean
  ) => void;
}) {
  const options = [
    {
      key: "enabled" as const,
      label: "알림",
      icon: Bell,
      checked: preference.enabled
    },
    {
      key: "categoryChanged" as const,
      label: "카테고리",
      icon: LayoutGrid,
      checked: preference.enabled && preference.categoryChanged
    },
    {
      key: "titleChanged" as const,
      label: "방제",
      icon: Type,
      checked: preference.enabled && preference.titleChanged
    }
  ];

  return (
    <div className={styles.alertToggleGrid}>
      {options.map((option) => (
        <button
          key={option.key}
          className={option.checked ? styles.toggleSelected : ""}
          aria-pressed={option.checked}
          onClick={() => onChange(option.key, !option.checked)}
        >
          <option.icon />
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
