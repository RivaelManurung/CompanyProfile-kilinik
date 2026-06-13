"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold, Italic, Strikethrough, Heading2, Heading3,
  List, ListOrdered, Quote, Link as LinkIcon, Unlink, Undo2, Redo2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
        class:
          "tiptap prose prose-base max-w-2xl mx-auto min-h-[460px] px-6 py-8 focus:outline-none dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed",
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

  const plain = htmlToPlainText(value || "");
  const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.round(words / 200));

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>

      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-card shadow-sm transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/15",
          error ? "border-destructive" : "border-input",
        )}
      >
        {/* scroll region keeps the toolbar pinned while writing long articles */}
        <div className="max-h-[72vh] overflow-y-auto">
          <Toolbar editor={editor} />
          <div
            className="relative cursor-text"
            onClick={() => editor?.chain().focus().run()}
          >
            {editor && editor.isEmpty && placeholder ? (
              <p className="pointer-events-none absolute left-1/2 top-8 w-full max-w-2xl -translate-x-1/2 px-6 text-base text-muted-foreground/50">
                {placeholder}
              </p>
            ) : null}
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">{words.toLocaleString("id-ID")}</span> kata
          </span>
          <span>≈ {minutes} menit baca</span>
        </div>
      </div>

      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return <div className="h-12 border-b border-border bg-muted/40" aria-hidden />;
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
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-border bg-card/95 p-1.5 backdrop-blur supports-[backdrop-filter]:bg-card/80">
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
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className="h-8 w-8"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />;
}
