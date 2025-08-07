"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote,
  Undo,
  Redo,
  Type,
  ImageIcon
} from 'lucide-react'
import { useRef } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Escreva aqui...",
  className,
  disabled = false
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-sm h-auto rounded-lg cursor-pointer',
        },
        inline: false,
        allowBase64: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editable: !disabled,
    immediatelyRender: false,
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.')
      return
    }

    // Convert to base64 and insert
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      if (src && editor) {
        editor.chain().focus().setImage({ src }).run()
      }
    }
    reader.readAsDataURL(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addImage = () => {
    fileInputRef.current?.click()
  }

  if (!editor) {
    return null
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-2 flex items-center gap-1 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run() || disabled}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bold') && "bg-primary/10 text-primary"
          )}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run() || disabled}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('italic') && "bg-primary/10 text-primary"
          )}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bulletList') && "bg-primary/10 text-primary"
          )}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('orderedList') && "bg-primary/10 text-primary"
          )}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('blockquote') && "bg-primary/10 text-primary"
          )}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
          disabled={disabled}
          className="h-8 w-8 p-0"
          title="Adicionar imagem"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run() || disabled}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run() || disabled}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus-within:outline-none [&_img]:max-w-xs [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2 [&_img]:cursor-pointer [&_img.ProseMirror-selectednode]:ring-2 [&_img.ProseMirror-selectednode]:ring-blue-500"
      />
      
      {/* Help text */}
      <div className="px-4 pb-2 text-xs text-muted-foreground">
        Dica: Clique em uma imagem e pressione Delete ou Backspace para removê-la
      </div>
    </div>
  )
}