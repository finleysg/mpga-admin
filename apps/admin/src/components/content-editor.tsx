"use client";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
  toast,
} from "@mpga/ui";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Heading4,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  TextQuote,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Markdown } from "tiptap-markdown";

import {
  getContentAction,
  saveContentAction,
} from "@/app/(dashboard)/tournaments/policies/actions";

interface ContentEditorProps {
  contentType: string;
  backHref: string;
}

export function ContentEditor({ contentType, backHref }: ContentEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [contentId, setContentId] = useState<number | undefined>();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose min-h-[400px] p-4 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    async function loadContent() {
      const result = await getContentAction(contentType);
      if (!result.success) {
        toast.error(result.error ?? "Failed to load content");
      } else if (result.data) {
        setTitle(result.data.title);
        setContentId(result.data.id);
        if (editor) {
          editor.commands.setContent(result.data.contentText);
        }
      }
      setLoading(false);
    }
    if (editor) {
      loadContent();
    }
  }, [contentType, editor]);

  const handleSave = useCallback(async () => {
    if (!editor) return;

    setSaving(true);
    try {
      const markdownContent = editor.storage.markdown.getMarkdown();
      const result = await saveContentAction({
        id: contentId,
        contentType,
        title: title.trim(),
        contentText: markdownContent,
      });

      if (result.success) {
        toast.success("Content saved");
        if (result.data) {
          setContentId(result.data.id);
        }
        router.push(backHref);
      } else {
        toast.error(result.error ?? "Failed to save content");
      }
    } catch {
      toast.error("Failed to save content");
    } finally {
      setSaving(false);
    }
  }, [editor, contentId, contentType, title, backHref, router]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href as string;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="text-lg font-semibold"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editor && (
          <div className="flex flex-wrap gap-1 rounded-md border bg-muted/50 p-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              active={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              active={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 4 }).run()
              }
              active={editor.isActive("heading", { level: 4 })}
              title="Heading 4"
            >
              <Heading4 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              title="Bullet list"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              title="Ordered list"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive("blockquote")}
              title="Block quote"
            >
              <TextQuote className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton
              onClick={setLink}
              active={editor.isActive("link")}
              title="Link"
            >
              <LinkIcon className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal rule"
            >
              <Minus className="h-4 w-4" />
            </ToolbarButton>
          </div>
        )}
        <div className="rounded-md border">
          <EditorContent editor={editor} />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(backHref)}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded p-2 hover:bg-muted ${
        active ? "bg-muted text-primary" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="mx-1 w-px self-stretch bg-border" />;
}
