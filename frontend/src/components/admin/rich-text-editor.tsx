"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold, Italic, Strikethrough, Heading2, Heading3,
  List, ListOrdered, Quote, Link as LinkIcon, Unlink, Undo2, Redo2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  id: string;
  label: string;
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

/** Tiptap empty documents serialize to "<p></p>"; treat that as empty. */
function normalize(html: string): string {
  return html === "<p></p>" ? "" : html;
}

/** Strip HTML tags to plain text — used for word counts and validation length. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function RichTextEditor({
  id, label, value, onChange, onBlur, error, required, placeholder,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // avoid SSR hydration mismatch in Next.js
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        id,
        class: "prose prose-sm max-w-none min-h-[260px] px-4 py-3 focus:outline-none dark:prose-invert",
        "aria-label": label,
        ...(error ? { "aria-invalid": "true", "aria-describedby": `${id}-error` } : {}),
      },
    },
    onUpdate: ({ editor }) => onChange(normalize(editor.getHTML())),
    onBlur: () => onBlur?.(),
  });

  // Sync external value into the editor (e.g. when an edit form loads data).
  useEffect(() => {
    if (!editor) return;
    const current = normalize(editor.getHTML());
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      <div className={cn("overflow-hidden rounded-md border bg-background", error ? "border-destructive" : "border-input")}>
        <Toolbar editor={editor} />
        {editor && editor.isEmpty && placeholder ? (
          <div className="pointer-events-none absolute px-4 py-3 text-sm text-muted-foreground/50">{placeholder}</div>
        ) : null}
        <EditorContent editor={editor} />
      </div>
      {error && <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return <div className="h-10 border-b border-border bg-muted/30" aria-hidden />;
  }

  function setLink() {
    const previous = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL tautan", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 p-1">
      <ToolButton label="Tebal" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} icon={Bold} />
      <ToolButton label="Miring" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} icon={Italic} />
      <ToolButton label="Coret" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} icon={Strikethrough} />
      <Divider />
      <ToolButton label="Judul H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={Heading2} />
      <ToolButton label="Judul H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={Heading3} />
      <Divider />
      <ToolButton label="Daftar poin" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={List} />
      <ToolButton label="Daftar nomor" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={ListOrdered} />
      <ToolButton label="Kutipan" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={Quote} />
      <Divider />
      <ToolButton label="Sisipkan tautan" active={editor.isActive("link")} onClick={setLink} icon={LinkIcon} />
      <ToolButton label="Hapus tautan" active={false} disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()} icon={Unlink} />
      <Divider />
      <ToolButton label="Urungkan" active={false} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} icon={Undo2} />
      <ToolButton label="Ulangi" active={false} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} icon={Redo2} />
    </div>
  );
}

function ToolButton({
  label, active, disabled, onClick, icon: Icon,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
        active && "bg-primary/10 text-primary",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />;
}
