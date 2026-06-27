// ─── pages/DashboardPage.tsx ──────────────────────────────────────────────────
// The main page after login. Composes the Navbar, a stats row, and the KanbanBoard.
//
// Data flow:
//   - useIssues hook owns all issue state and API calls
//   - DashboardPage receives that state and passes it down to KanbanBoard
//   - This "lift state up" pattern lets us show summary stats here without
//     duplicating the data
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo } from "react";
import { LayoutGrid, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { KanbanBoard } from "../components/board/KanbanBoard";
import { useIssues } from "../hooks/useIssues";
import { useAuth } from "../hooks/useAuth";

// A small stat card for the summary row at the top
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-xl p-4 flex items-center gap-4">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100 font-mono">{value}</p>
        <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const {
    issues,
    isLoading,
    fetchIssues,
    createIssue,
    updateIssueStatus,
    deleteIssue,
  } = useIssues();

  // Fetch issues on mount
  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Compute stats from local state — no extra API call needed
  const stats = useMemo(
    () => ({
      total: issues.length,
      todo: issues.filter((i) => i.status === "todo").length,
      inProgress: issues.filter((i) => i.status === "in_progress").length,
      done: issues.filter((i) => i.status === "done").length,
    }),
    [issues]
  );

  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ── Welcome header ─────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-slate-400 text-sm">
            Good to have you back,{" "}
            <span className="text-slate-200 font-medium">{user?.email}</span>
          </p>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total"
            value={stats.total}
            icon={LayoutGrid}
            color="bg-slate-600"
          />
          <StatCard
            label="Todo"
            value={stats.todo}
            icon={Clock}
            color="bg-slate-500"
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            icon={AlertCircle}
            color="bg-blue-600"
          />
          <StatCard
            label="Done"
            value={stats.done}
            icon={CheckCircle}
            color="bg-green-600"
          />
        </div>

        {/* ── Kanban board ───────────────────────────────────────────────── */}
        <KanbanBoard
          issues={issues}
          isLoading={isLoading}
          onRefresh={fetchIssues}
          onCreateIssue={createIssue}
          onUpdateStatus={updateIssueStatus}
          onDelete={deleteIssue}
        />
      </main>
    </div>
  );
}