"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Heading1, Heading2, Heading3, Minus, Undo, Redo, Check, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  docId: string;
  initialTitle: string;
  initialContent: string;
  workspaceId: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const ToolbarButton = ({
  onClick, active, disabled, title: tip, children,
}: { onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode }) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    disabled={disabled}
    title={tip}
    className={cn(
      "rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900",
      active && "bg-indigo-50 text-indigo-700"
    )}
  >
    {children}
  </button>
);

export function RichEditor({ docId, initialTitle, initialContent, workspaceId }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing…" }),
      CharacterCount,
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none focus:outline-none min-h-[400px] text-slate-800",
      },
    },
    onUpdate: () => {
      scheduleSave();
    },
  });

  const save = useCallback(async (currentTitle: string, content: string) => {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: currentTitle, content, workspaceId }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
      if (res.ok) setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  }, [docId, workspaceId]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const content = editor?.getHTML() ?? "";
      void save(title, content);
    }, 1500);
  }, [editor, title, save]);

  // Save on title change
  useEffect(() => {
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  if (!editor) return null;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-6 py-2 sticky top-0 z-10">
        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-2">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-2">
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-2">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
            <Code className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-2">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <Minus className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Save status */}
        <div className="ml-auto flex items-center gap-1.5 text-xs">
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
              <span className="text-slate-400">Saving…</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-600">Saved</span>
            </>
          )}
          {saveStatus === "error" && (
            <span className="text-red-500">Save failed</span>
          )}
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto px-8 py-8 max-w-3xl w-full mx-auto">
        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Document"
          className="mb-8 w-full border-none bg-transparent text-4xl font-bold tracking-tight text-slate-900 placeholder:text-slate-300 focus:outline-none"
        />

        {/* Editor */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
