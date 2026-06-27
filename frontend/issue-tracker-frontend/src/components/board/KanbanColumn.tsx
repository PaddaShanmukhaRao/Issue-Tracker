// ─── components/board/KanbanColumn.tsx ───────────────────────────────────────
// A single Kanban column (Todo / In Progress / Done).
//
// Uses @dnd-kit's useDroppable to make the column a drop zone.
// When a card is dragged over this column, isOver becomes true and we apply
// a subtle highlight to signal that a drop here will change the card's status.
//
// The column renders a list of IssueCard components inside a SortableContext
// so @dnd-kit can calculate sort order within the column.
// ─────────────────────────────────────────────────────────────────────────────

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { Issue, TaskStatus } from "../../types";
import { IssueCard } from "./IssueCard";
import { cn } from "../../lib/utils";

interface KanbanColumnProps {
  id: TaskStatus;          // The status value this column represents
  title: string;           // Display label: "Todo", "In Progress", "Done"
  accentColor: string;     // Tailwind colour class for the header dot
  issues: Issue[];         // Issues belonging to this column
  onDelete: (id: number) => void;
  onNewIssue?: () => void; // Only the Todo column shows the "+ New" button
}

// Column header accent colours
const columnAccentMap: Record<TaskStatus, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-400",
  done: "bg-green-400",
};

export function KanbanColumn({
  id,
  title,
  issues,
  onDelete,
  onNewIssue,
}: KanbanColumnProps) {
  // ── useDroppable ────────────────────────────────────────────────────────────
  // Makes this column a valid drop target. @dnd-kit calls our onDragEnd handler
  // when a card is released over this element.
  const { setNodeRef, isOver } = useDroppable({ id });

  // The list of IDs in this column. SortableContext uses this to determine
  // the sort order and animate placeholder positions.
  const issueIds = issues.map((i) => i.issue_id);

  return (
    <div className="flex flex-col min-w-[300px] max-w-[340px] w-full">
      {/* ── Column header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          {/* Coloured dot indicating status */}
          <span
            className={cn("w-2 h-2 rounded-full", columnAccentMap[id])}
          />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            {title}
          </h2>
          {/* Issue count badge */}
          <span className="text-xs bg-surface-700 text-slate-500 px-2 py-0.5 rounded-full font-mono">
            {issues.length}
          </span>
        </div>

        {/* Only the Todo column has a quick "+" button */}
        {onNewIssue && (
          <button
            onClick={onNewIssue}
            className="text-slate-500 hover:text-accent-light transition-colors"
            aria-label="Add new issue"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Drop zone ─────────────────────────────────────────────────────── */}
      {/* setNodeRef registers this div with @dnd-kit as the drop target */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[400px] rounded-xl p-3 space-y-3 transition-colors duration-200",
          "bg-surface-800/50 border border-surface-700",
          isOver && "bg-accent/5 border-accent/30" // Highlight when dragging over
        )}
      >
        {/* SortableContext tells @dnd-kit the order of items in this list */}
        <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <IssueCard
              key={issue.issue_id}
              issue={issue}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {issues.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-slate-600 text-sm">
            <p>No issues</p>
            {id === "todo" && onNewIssue && (
              <button
                onClick={onNewIssue}
                className="mt-1 text-xs text-accent/60 hover:text-accent-light transition-colors"
              >
                + Add one
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}