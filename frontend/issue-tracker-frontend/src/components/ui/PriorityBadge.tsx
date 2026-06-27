// ─── components/ui/PriorityBadge.tsx ─────────────────────────────────────────
// A coloured pill that displays the priority of an issue.
// Colour is driven by the Tailwind priority tokens defined in tailwind.config.js.
// ─────────────────────────────────────────────────────────────────────────────

import { type TaskPriority } from "../../types";
import { cn } from "../../lib/utils";

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

// Map each priority level to a Tailwind class set
const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: {
    label: "Low",
    className: "bg-green-500/15 text-green-400 border-green-500/30",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  high: {
    label: "High",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}