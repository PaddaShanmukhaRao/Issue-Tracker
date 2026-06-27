// ─── components/board/IssueModal.tsx ─────────────────────────────────────────
// A modal dialog for creating a new issue.
//
// Uses a native <dialog>-style overlay (div with backdrop) rather than a
// library component so we have full styling control. The form includes:
//   - Title (required)
//   - Description (optional textarea)
//   - Priority selector (Low / Medium / High)
//
// On submit, it calls the createIssue function from useIssues and closes if successful.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent, useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { TaskPriority, CreateIssueFormData } from "../../types";

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateIssueFormData) => Promise<boolean>;
}

export function IssueModal({ isOpen, onClose, onSubmit }: IssueModalProps) {
  // Form state — reset whenever the modal opens
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState("");

  // Focus the title input when the modal opens
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form to blank state
      setTitle("");
      setDescription("");
      setPriority("medium");
      setTitleError("");

      // Defer focus until after the animation renders
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate title
    if (!title.trim()) {
      setTitleError("Title is required.");
      titleRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit({ title: title.trim(), description, priority });
    setIsSubmitting(false);

    if (success) {
      onClose(); // Only close if the API call succeeded
    }
  };

  if (!isOpen) return null;

  return (
    // Backdrop — clicking it closes the modal
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        // Only close if the backdrop itself was clicked (not the modal card)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal card */}
      <div className="w-full max-w-lg bg-surface-800 border border-surface-600 rounded-xl shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-600">
          <h2 className="text-lg font-semibold text-slate-200">New Issue</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError("");
              }}
              className={`form-input ${titleError ? "border-red-500 focus:ring-red-500/50" : ""}`}
              placeholder="e.g. Fix database connection timeout"
              maxLength={255}
            />
            {titleError && (
              <p className="mt-1 text-xs text-red-400">{titleError}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description{" "}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input resize-none h-24"
              placeholder="Add more context about this issue…"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all duration-150 capitalize ${
                    priority === p
                      ? p === "low"
                        ? "bg-green-500/20 border-green-500/50 text-green-400"
                        : p === "medium"
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                        : "bg-red-500/20 border-red-500/50 text-red-400"
                      : "border-surface-600 text-slate-400 hover:border-surface-500"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </span>
              ) : (
                "Create issue"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}