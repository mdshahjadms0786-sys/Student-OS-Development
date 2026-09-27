import * as React from "react";
import { Card, CardContent, Button, Badge } from "@student-os/ui";
import { Spinner } from "../components/ui/Spinner.jsx";
import { apiClient } from "../lib/api-client.js";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Search,
  BookOpen,
  Trash2,
  Edit2,
  Paperclip,
  ExternalLink,
  Calendar,
  Layers,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { useRouter } from "../lib/router.jsx";
import { useAuth } from "../lib/auth-context.jsx";
import { format } from "date-fns";

export function NotesPage() {
  const { user } = useAuth();
  const { currentPath, navigate } = useRouter();

  const [notes, setNotes] = React.useState([]);
  const [subjects, setSubjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Search & filter
  const [search, setSearch] = React.useState("");
  const [selectedSubjectId, setSelectedSubjectId] = React.useState("ALL");

  // Modal & form states
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState(null);
  const [title, setTitle] = React.useState("");
  const [subjectId, setSubjectId] = React.useState("");
  const [content, setContent] = React.useState("");
  const [attachmentUrl, setAttachmentUrl] = React.useState("");
  const [attachmentName, setAttachmentName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const fetchNotes = React.useCallback(async () => {
    try {
      let query = "/api/notes";
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (selectedSubjectId !== "ALL")
        params.append("subjectId", selectedSubjectId);
      if (params.toString()) query += `?${params.toString()}`;

      const [notesRes, subsRes] = await Promise.all([
        apiClient(query),
        apiClient("/api/subjects"),
      ]);

      if (notesRes.success && notesRes.data) {
        setNotes(notesRes.data);
      }
      if (subsRes.success && subsRes.data) {
        setSubjects(subsRes.data);
      }
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [search, selectedSubjectId]);

  React.useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const openCreateModal = () => {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setSubjectId(subjects.length > 0 ? subjects[0].id : "");
    setAttachmentName("");
    setAttachmentUrl("");
    setIsModalOpen(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSubjectId(note.subjectId || "");
    if (note.attachments && note.attachments.length > 0) {
      setAttachmentName(note.attachments[0].filename || "");
      setAttachmentUrl(note.attachments[0].storageKey || "");
    } else {
      setAttachmentName("");
      setAttachmentUrl("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Note title is required");
      return;
    }
    if (!content.trim()) {
      toast.error("Note content cannot be empty");
      return;
    }

    const attachments = [];
    if (attachmentName.trim()) {
      attachments.push({
        filename: attachmentName.trim(),
        url: attachmentUrl.trim() || undefined,
        storageKey: attachmentUrl.trim() || "embedded",
      });
    }

    setSaving(true);
    try {
      if (editingNote) {
        const res = await apiClient(`/api/notes/${editingNote.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            subjectId: subjectId || null,
            attachments,
          }),
        });
        if (res.success) {
          toast.success("Note updated");
          setIsModalOpen(false);
          fetchNotes();
        }
      } else {
        const res = await apiClient("/api/notes", {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            subjectId: subjectId || null,
            attachments,
          }),
        });
        if (res.success) {
          toast.success("Note created");
          setIsModalOpen(false);
          fetchNotes();
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      const res = await apiClient(`/api/notes/${id}`, { method: "DELETE" });
      if (res.success) {
        toast.success("Note deleted");
        fetchNotes();
      }
    } catch {
      toast.error("Failed to delete note");
    }
  };

  return (
    <AppShell user={user} currentPath={currentPath} onNavigate={navigate}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Subject Notes
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create, organize, and search study notes and reference material by
              course.
            </p>
          </div>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>New Note</span>
          </Button>
        </div>

        {/* Search & Subject Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes by title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedSubjectId("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedSubjectId === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              All Subjects
            </button>
            {subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedSubjectId === sub.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {sub.code}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="h-8 w-8 text-blue-600" />
          </div>
        ) : notes.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-slate-300 dark:border-slate-800">
            <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
              No notes found
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {search || selectedSubjectId !== "ALL"
                ? "No notes match your active search or subject filter."
                : "Capture key lecture concepts and revision summaries by creating your first note."}
            </p>
            <Button
              size="sm"
              onClick={openCreateModal}
              className="mt-4 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Create Note</span>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {notes.map((note) => {
              const updatedAt = new Date(note.updatedAt);
              return (
                <Card
                  key={note.id}
                  className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      {note.subject ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: note.subject.color || "#3b82f6",
                            }}
                          />
                          <Badge variant="outline" className="text-[10px]">
                            {note.subject.code}
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          General
                        </Badge>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {format(updatedAt, "MMM d, yyyy")}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                      {note.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-4 whitespace-pre-line leading-relaxed">
                      {note.content}
                    </p>

                    {/* Attachments / Links */}
                    {note.attachments && note.attachments.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                        {note.attachments.map((att) => (
                          <div
                            key={att.id || att.filename}
                            className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-medium"
                          >
                            <Paperclip className="h-3 w-3 shrink-0" />
                            {att.storageKey?.startsWith("http") ? (
                              <a
                                href={att.storageKey}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline flex items-center gap-1 line-clamp-1"
                              >
                                {att.filename}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            ) : (
                              <span className="line-clamp-1">
                                {att.filename}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        onClick={() => openEditModal(note)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Note Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingNote ? "Edit Note" : "Create Note"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Draft your lecture summary or revision notes with subject tagging.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Note Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Memory Management & Paging"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subject
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">General (No Subject)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Content *
                </label>
                <textarea
                  rows={8}
                  placeholder="Write your study notes, formulas, lecture key points here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white font-sans leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Attachment / Resource Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lecture Slides PDF"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    URL / Resource Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {saving
                    ? "Saving..."
                    : editingNote
                      ? "Update Note"
                      : "Create Note"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
