// ─── hooks/useIssues.ts ───────────────────────────────────────────────────────
// Central data hook for issue management.
//
// Implements the full CRUD lifecycle with optimistic updates for drag-and-drop:
//   - fetchIssues()        — load all issues from the API
//   - createIssue()        — POST a new issue and prepend it to local state
//   - updateIssueStatus()  — PATCH status (called by DnD), optimistic update
//   - deleteIssue()        — DELETE an issue and remove it from local state
//
// Optimistic update pattern for drag-and-drop:
//   1. Immediately update the local state (UI feels instant)
//   2. Send the PATCH request to the backend in the background
//   3. If the request fails, roll back the local state and show an error
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";
import type { Issue, TaskStatus, CreateIssueFormData } from "../types";

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Fetch all issues ────────────────────────────────────────────────────────
  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<Issue[]>("/issues");
      setIssues(data);
    } catch {
      toast.error("Failed to load issues.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Create a new issue ──────────────────────────────────────────────────────
  const createIssue = async (formData: CreateIssueFormData): Promise<boolean> => {
    try {
      const { data } = await api.post<Issue>("/issues", formData);

      // Prepend the new issue so it appears at the top of its column
      setIssues((prev) => [data, ...prev]);

      toast.success("Issue created!");
      return true; // Signal success to the modal so it can close
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to create issue.";
      toast.error(message);
      return false;
    }
  };

  // ── Update status (drag-and-drop) ───────────────────────────────────────────
  // This is the most important function for the Kanban UX.
  // We use an optimistic update so the drag feels instant.
  const updateIssueStatus = async (
    issueId: number,
    newStatus: TaskStatus
  ): Promise<void> => {
    // ── Step 1: Snapshot current state for rollback ──────────────────────────
    const previousIssues = issues;

    // ── Step 2: Optimistically update local state ────────────────────────────
    setIssues((prev) =>
      prev.map((issue) =>
        issue.issue_id === issueId ? { ...issue, status: newStatus } : issue
      )
    );

    // ── Step 3: Send the real API request ────────────────────────────────────
    try {
      await api.patch(`/issues/${issueId}`, { status: newStatus });
    } catch {
      // ── Step 4: Rollback on failure ──────────────────────────────────────
      setIssues(previousIssues);
      toast.error("Failed to update status. Change reverted.");
    }
  };

  // ── Update an issue (title, desc, priority) ─────────────────────────────────
  const updateIssue = async (
    issueId: number,
    updates: Partial<Issue>
  ): Promise<boolean> => {
    try {
      const { data } = await api.patch<Issue>(`/issues/${issueId}`, updates);

      setIssues((prev) =>
        prev.map((issue) => (issue.issue_id === issueId ? data : issue))
      );

      toast.success("Issue updated!");
      return true;
    } catch {
      toast.error("Failed to update issue.");
      return false;
    }
  };

  // ── Delete an issue ─────────────────────────────────────────────────────────
  const deleteIssue = async (issueId: number): Promise<void> => {
    // Optimistic delete — remove immediately, no rollback needed for deletes
    setIssues((prev) => prev.filter((issue) => issue.issue_id !== issueId));

    try {
      await api.delete(`/issues/${issueId}`);
      toast.success("Issue deleted.");
    } catch {
      toast.error("Failed to delete issue.");
      // Re-fetch to restore the deleted item if the request failed
      fetchIssues();
    }
  };

  return {
    issues,
    isLoading,
    fetchIssues,
    createIssue,
    updateIssueStatus,
    updateIssue,
    deleteIssue,
  };
}