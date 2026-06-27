// ─── components/board/KanbanBoard.tsx ────────────────────────────────────────
// The main board view. Renders three KanbanColumns and wires up drag-and-drop
// using @dnd-kit's DndContext.
//
// @dnd-kit DnD flow:
//   1. User grabs a card → onDragStart fires → we record which card is active
//   2. User moves the card over a column → isOver updates on that column
//   3. User drops the card:
//      a. If dropped on a different column → updateIssueStatus() is called
//      b. The DragOverlay (the "ghost" card visible while dragging) is hidden
//
// We use DragOverlay to render a preview of the card being dragged. Without it,
// @dnd-kit would just move the original card, which looks jerky.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { Plus, RefreshCw } from "lucide-react";
import type { Issue, TaskStatus } from "../../types";
import { KanbanColumn } from "./KanbanColumn";
import { IssueCard } from "./IssueCard";
import { IssueModal } from "./IssueModal";
import type { CreateIssueFormData } from "../../types";

// The three columns in order
const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "todo", title: "Todo", color: "bg-slate-400" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-400" },
  { id: "done", title: "Done", color: "bg-green-400" },
];

interface KanbanBoardProps {
  // Passed from the Dashboard — the hook is lifted up so stats can be shown
  issues: Issue[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateIssue: (data: CreateIssueFormData) => Promise<boolean>;
  onUpdateStatus: (id: number, status: TaskStatus) => Promise<void>;
  onDelete: (id: number) => void;
}

export function KanbanBoard({
  issues,
  isLoading,
  onRefresh,
  onCreateIssue,
  onUpdateStatus,
  onDelete,
}: KanbanBoardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Track which card is currently being dragged (to show the overlay)
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  // ── DnD sensors ─────────────────────────────────────────────────────────────
  // PointerSensor works for both mouse and touch.
  // activationConstraint.distance prevents accidental drags when clicking.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Must move 8px before drag starts
      },
    })
  );

  // ── Group issues by status ───────────────────────────────────────────────────
  // useMemo re-computes only when the issues array changes
  const issuesByStatus = useMemo(() => {
    return COLUMNS.reduce(
      (acc, col) => {
        acc[col.id] = issues.filter((i) => i.status === col.id);
        return acc;
      },
      {} as Record<TaskStatus, Issue[]>
    );
  }, [issues]);

  // ── DnD handlers ─────────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    // Find the issue being dragged by its ID and store it for the overlay
    const dragged = issues.find((i) => i.issue_id === event.active.id);
    setActiveIssue(dragged ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveIssue(null); // Hide the drag overlay

    // No valid drop target → do nothing
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id; // Could be a column ID (TaskStatus) or another issue_id

    // Determine the target status from the drop target.
    // If dropped on a column header → over.id is the column's TaskStatus string.
    // If dropped on another card   → over.id is that card's issue_id (number).
    let targetStatus: TaskStatus | null = null;

    if (typeof overId === "string" && ["todo", "in_progress", "done"].includes(overId)) {
      // Dropped directly on a column
      targetStatus = overId as TaskStatus;
    } else if (typeof overId === "number") {
      // Dropped on another card — use that card's status
      const targetIssue = issues.find((i) => i.issue_id === overId);
      targetStatus = targetIssue?.status ?? null;
    }

    if (!targetStatus) return;

    // Only update if the status actually changed
    const activeIssue = issues.find((i) => i.issue_id === activeId);
    if (activeIssue && activeIssue.status !== targetStatus) {
      onUpdateStatus(activeId, targetStatus);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Loading your board…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Board toolbar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">My Board</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {issues.length} issue{issues.length !== 1 ? "s" : ""} total
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            className="btn-ghost flex items-center gap-2"
            aria-label="Refresh board"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:block">Refresh</span>
          </button>

          {/* New issue button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Issue
          </button>
        </div>
      </div>

      {/* ── DnD context wraps all columns ─────────────────────────────────── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}  // Find the closest column/card to drop on
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* ── Columns ─────────────────────────────────────────────────────── */}
        <div className="flex gap-6 overflow-x-auto pb-6">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              accentColor={col.color}
              issues={issuesByStatus[col.id]}
              onDelete={onDelete}
              onNewIssue={col.id === "todo" ? () => setIsModalOpen(true) : undefined}
            />
          ))}
        </div>

        {/* ── Drag overlay ──────────────────────────────────────────────────
            Renders the card at the cursor position while dragging.
            Without this, the original card would move (which looks bad).
        ─────────────────────────────────────────────────────────────────── */}
        <DragOverlay>
          {activeIssue ? (
            <div className="rotate-2 scale-105 opacity-95 shadow-2xl shadow-accent/20">
              <IssueCard issue={activeIssue} onDelete={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Create issue modal ─────────────────────────────────────────────── */}
      <IssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onCreateIssue}
      />
    </>
  );
}