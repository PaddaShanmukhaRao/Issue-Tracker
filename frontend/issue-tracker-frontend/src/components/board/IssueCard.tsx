// ─── components/board/IssueCard.tsx ──────────────────────────────────────────
// A single draggable issue card rendered inside a Kanban column.
//
// Uses @dnd-kit's useSortable hook to make the card draggable.
// The card shows:
//   - Issue title
//   - Description preview (truncated)
//   - Priority badge
//   - Creation date
//   - Delete button (appears on hover)
//
// The transform/transition from useSortable is applied as inline styles so
// @dnd-kit can move the card during a drag without layout shifts.
// ─────────────────────────────────────────────────────────────────────────────

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical } from "lucide-react";
import type { Issue } from "../../types";
import { PriorityBadge } from "../ui/PriorityBadge";
import { formatDate, cn } from "../../lib/utils";

interface IssueCardProps {
  issue: Issue;
  onDelete: (id: number) => void;
}

export function IssueCard({ issue, onDelete }: IssueCardProps) {
  // ── @dnd-kit draggable setup ─────────────────────────────────────────────
  // useDraggable gives us: isDragging, transform, transition, and the ref/listeners
  // we need to attach to the DOM element to make it draggable.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.issue_id,
  });

  // Convert @dnd-kit's transform object into a CSS string
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes} // aria-roledescription etc.
      className={cn(
        "issue-card group relative",
        isDragging && "issue-card-dragging opacity-40",
      )}
    >
      {/* ── Drag handle ───────────────────────────────────────────────────── */}
      {/* Separating the drag handle from the card body means clicking the card
          (e.g. to read the description) won't accidentally start a drag. */}
      <button
        {...listeners} // attach drag listeners to this handle only
        className="absolute top-3 right-3 text-slate-600 hover:text-slate-400
                   transition-colors cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"
        aria-label="Drag issue"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* ── Card content ──────────────────────────────────────────────────── */}
      <div className="pr-6">
        {" "}
        {/* Right padding avoids overlap with the drag handle */}
        {/* Title */}
        <p className="text-sm font-medium text-slate-200 leading-snug mb-1 line-clamp-2">
          {issue.title}
        </p>
        {/* Description preview */}
        {issue.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
            {issue.description}
          </p>
        )}
      </div>

      {/* ── Footer row ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={issue.priority} />
          <span className="text-xs text-slate-600 font-mono">
            #{issue.issue_id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Creation date */}
          <span className="text-xs text-slate-600">
            {formatDate(issue.created_at)}
          </span>

          {/* Delete button — visible only on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Don't trigger drag events
              if (confirm("Delete this issue?")) {
                onDelete(issue.issue_id);
              }
            }}
            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400
                       transition-all duration-150"
            aria-label="Delete issue"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
