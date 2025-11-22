'use client'

import { useRef, useState, useEffect } from 'react'

interface RichTextEditorProps {
  name: string
  value?: string
  placeholder?: string
  required?: boolean
}

export default function RichTextEditor({
  name,
  value = '',
  placeholder = 'Enter text...',
  required = false
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState(value)
  const isInitialized = useRef(false)

  // Set initial content when component mounts or value changes
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value || ''
      setContent(value || '')
      isInitialized.current = true
    }
  }, [value])

  const insertHtmlAtCursor = (html: string) => {
    if (!editorRef.current) return

    editorRef.current.focus()

    const selection = window.getSelection()
    if (!selection || !selection.rangeCount) {
      // If no selection, just append to the end
      editorRef.current.innerHTML += html
      updateContent()
      return
    }

    const range = selection.getRangeAt(0)

    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const frag = document.createDocumentFragment()
    let node
    let lastNode
    while ((node = tempDiv.firstChild)) {
      lastNode = frag.appendChild(node)
    }
    range.insertNode(frag)

    // Move cursor into the list item
    if (lastNode) {
      const li = (lastNode as Element).querySelector ? (lastNode as Element).querySelector('li') : lastNode.nodeName === 'LI' ? lastNode : null
      if (li) {
        // Clear the default "List item" text and place cursor there
        li.textContent = ''
        const newRange = document.createRange()
        newRange.setStart(li, 0)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)
      } else {
        range.setStartAfter(lastNode)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }

    updateContent()
  }

  const handleBold = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.toString().length === 0) {
      // Insert bold tags
      insertHtmlAtCursor('<strong></strong>')
      return
    }

    // Wrap selection in bold
    const range = selection.getRangeAt(0)
    const selectedText = range.extractContents()
    const bold = document.createElement('strong')
    bold.appendChild(selectedText)
    range.insertNode(bold)

    updateContent()
  }

  const handleBulletList = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    insertHtmlAtCursor('<ul style="list-style-type: disc; list-style-position: inside; padding-left: 40px; margin: 10px 0;"><li style="display: list-item; list-style-type: disc;"><br></li></ul>')
  }

  const updateContent = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle Enter key in list items
    if (e.key === 'Enter' && !e.shiftKey) {
      const selection = window.getSelection()
      if (!selection) return

      const range = selection.getRangeAt(0)
      const listItem = range.startContainer.parentElement?.closest('li')

      if (listItem) {
        e.preventDefault()
        const newLi = document.createElement('li')
        newLi.innerHTML = '<br>'
        listItem.parentNode?.insertBefore(newLi, listItem.nextSibling)

        // Move cursor to new list item
        const newRange = document.createRange()
        newRange.setStart(newLi, 0)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)

        updateContent()
      }
    }
  }

  return (
    <div className="border border-gray-300 rounded-md">
      {/* Toolbar */}
      <div className="flex gap-1 p-2 border-b border-gray-300 bg-gray-50">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleBold}
          className="px-3 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-100 bg-white"
          title="Bold (select text first)"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleBulletList}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 bg-white"
          title="Add Bullet List"
        >
          • List
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={updateContent}
        onBlur={updateContent}
        onKeyDown={handleKeyDown}
        className="min-h-[120px] p-3 focus:outline-none text-gray-900"
        data-placeholder={placeholder}
        suppressContentEditableWarning
        style={{ direction: 'ltr', textAlign: 'left' }}
      />

      {/* Hidden input to submit the HTML content */}
      <input type="hidden" name={name} value={content} required={required} />

      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block;
        }
        [contenteditable] {
          outline: none;
        }
        [contenteditable] ul {
          list-style-type: disc;
          list-style-position: inside;
          margin-left: 0;
          padding-left: 2.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        [contenteditable] li {
          margin-bottom: 0.25rem;
          display: list-item;
          list-style-type: disc;
          margin-left: 0;
        }
        [contenteditable] b,
        [contenteditable] strong {
          font-weight: bold;
        }
        [contenteditable] p {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  )
}
