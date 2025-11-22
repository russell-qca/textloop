'use client'

import { useState, useRef } from 'react'

export interface QuoteItem {
  id?: string
  name: string
  description: string
  quantity: number
  unit_price: number
  sort_order: number
}

interface QuoteItemEditorProps {
  items: QuoteItem[]
  onChange: (items: QuoteItem[]) => void
}

export default function QuoteItemEditor({ items, onChange }: QuoteItemEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showFormatting, setShowFormatting] = useState<number | null>(null)
  const editorRefs = useRef<(HTMLDivElement | null)[]>([])
  const initializedRefs = useRef<Set<number>>(new Set())

  // Calculate total for a single item
  const calculateItemTotal = (item: QuoteItem) => {
    return item.quantity * item.unit_price
  }

  // Calculate grand total
  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  }

  // Add new item
  const addItem = () => {
    const newItem: QuoteItem = {
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      sort_order: items.length,
    }
    onChange([...items, newItem])
    setEditingIndex(items.length)
    setShowFormatting(items.length)
  }

  // Remove item
  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    // Update sort_order
    newItems.forEach((item, i) => {
      item.sort_order = i
    })
    // Clear initialized refs for items at or after this index
    initializedRefs.current.clear()
    onChange(newItems)
    if (editingIndex === index) {
      setEditingIndex(null)
    }
  }

  // Update item field
  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange(newItems)
  }

  // Move item up
  const moveItemUp = (index: number) => {
    if (index === 0) return
    const newItems = [...items]
    ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
    newItems.forEach((item, i) => {
      item.sort_order = i
    })
    initializedRefs.current.clear()
    onChange(newItems)
  }

  // Move item down
  const moveItemDown = (index: number) => {
    if (index === items.length - 1) return
    const newItems = [...items]
    ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
    newItems.forEach((item, i) => {
      item.sort_order = i
    })
    initializedRefs.current.clear()
    onChange(newItems)
  }

  // Apply formatting to selected text
  const applyFormatting = (index: number, command: string) => {
    const editor = editorRefs.current[index]
    if (!editor) return

    editor.focus()

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)

    // Check if selection is within the editor
    if (!editor.contains(range.commonAncestorContainer)) return

    // Execute the command
    document.execCommand(command, false, undefined)

    // Update the item description
    setTimeout(() => {
      updateItem(index, 'description', editor.innerHTML)
    }, 0)
  }

  // Insert list
  const insertList = (index: number, ordered: boolean) => {
    const editor = editorRefs.current[index]
    if (!editor) return

    editor.focus()

    const listHtml = ordered
      ? '<ol style="padding-left: 40px; margin: 10px 0;"><li><br></li></ol>'
      : '<ul style="list-style-type: disc; padding-left: 40px; margin: 10px 0;"><li><br></li></ul>'

    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = listHtml
      const frag = document.createDocumentFragment()
      let node
      let lastNode
      while ((node = tempDiv.firstChild)) {
        lastNode = frag.appendChild(node)
      }
      range.insertNode(frag)

      if (lastNode) {
        const li = (lastNode as Element).querySelector ? (lastNode as Element).querySelector('li') : null
        if (li) {
          const newRange = document.createRange()
          newRange.setStart(li, 0)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      }
    } else {
      editor.innerHTML += listHtml
    }

    setTimeout(() => {
      updateItem(index, 'description', editor.innerHTML)
    }, 0)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .quote-item-editor [contenteditable] ul {
          list-style-type: disc;
          padding-left: 40px;
          margin: 10px 0;
        }
        .quote-item-editor [contenteditable] ol {
          list-style-type: decimal;
          padding-left: 40px;
          margin: 10px 0;
        }
        .quote-item-editor [contenteditable] li {
          display: list-item;
          margin-bottom: 4px;
        }
        .quote-item-editor [contenteditable] strong,
        .quote-item-editor [contenteditable] b {
          font-weight: bold;
        }
        .quote-item-editor [contenteditable] em,
        .quote-item-editor [contenteditable] i {
          font-style: italic;
        }
        .quote-item-editor [contenteditable] u {
          text-decoration: underline;
        }
      `}} />
      <div className="space-y-4 quote-item-editor">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Quote Items</h3>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          + Add Item
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">No items yet. Click "Add Item" to get started.</p>
        </div>
      )}

      {items.map((item, index) => (
        <div key={index} className="border border-gray-300 rounded-lg p-4 bg-white">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">
                {item.name || `Item ${index + 1}`}
              </span>
              {editingIndex === index && (
                <span className="text-xs text-blue-600">(Editing)</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => moveItemUp(index)}
                disabled={index === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveItemDown(index)}
                disabled={index === items.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-1 text-red-600 hover:text-red-700"
                title="Remove item"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Item Name */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateItem(index, 'name', e.target.value)}
              placeholder="e.g., Labor, Materials, Installation, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description with formatting toolbar */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>

            {/* Formatting toolbar */}
            <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 rounded border border-gray-200">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormatting(index, 'bold')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormatting(index, 'italic')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyFormatting(index, 'underline')}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                title="Underline"
              >
                <u>U</u>
              </button>
              <div className="border-l border-gray-300 mx-1"></div>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertList(index, false)}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                title="Bullet list"
              >
                • List
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertList(index, true)}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                title="Numbered list"
              >
                1. List
              </button>
            </div>

            <div
              ref={(el) => {
                editorRefs.current[index] = el
                if (el && !initializedRefs.current.has(index)) {
                  el.innerHTML = item.description || ''
                  initializedRefs.current.add(index)
                }
              }}
              contentEditable
              suppressContentEditableWarning
              onFocus={() => {
                setEditingIndex(index)
                setShowFormatting(index)
              }}
              onBlur={(e) => {
                updateItem(index, 'description', e.currentTarget.innerHTML)
              }}
              onInput={(e) => {
                updateItem(index, 'description', e.currentTarget.innerHTML)
              }}
              className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ whiteSpace: 'pre-wrap', direction: 'ltr', textAlign: 'left' }}
            />
            <p className="mt-1 text-xs text-gray-500">
              Select text and use the toolbar above to format
            </p>
          </div>

          {/* Quantity and pricing */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={item.quantity === 0 && editingIndex === index ? '' : item.quantity}
                onChange={(e) => {
                  const value = e.target.value
                  // Allow empty, partial numbers, and decimals while typing
                  if (value === '' || value === '.' || value === '-' || value === '-.') {
                    updateItem(index, 'quantity', 0)
                    return
                  }
                  const numValue = parseFloat(value)
                  if (!isNaN(numValue) && numValue >= 0) {
                    updateItem(index, 'quantity', numValue)
                  }
                }}
                onFocus={() => setEditingIndex(index)}
                onBlur={(e) => {
                  const value = e.target.value
                  if (value === '' || value === '.' || value === '-' || value === '-.') {
                    updateItem(index, 'quantity', 1)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={item.unit_price === 0 && editingIndex === index ? '' : item.unit_price}
                  onChange={(e) => {
                    const value = e.target.value
                    // Allow empty, partial numbers, and decimals while typing
                    if (value === '' || value === '.' || value === '-' || value === '-.') {
                      updateItem(index, 'unit_price', 0)
                      return
                    }
                    const numValue = parseFloat(value)
                    if (!isNaN(numValue) && numValue >= 0) {
                      updateItem(index, 'unit_price', numValue)
                    }
                  }}
                  onFocus={() => setEditingIndex(index)}
                  onBlur={(e) => {
                    const value = e.target.value
                    if (value === '' || value === '.' || value === '-' || value === '-.') {
                      updateItem(index, 'unit_price', 0)
                    }
                  }}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-medium">
                ${calculateItemTotal(item).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      ))}

      {items.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Quote Total</span>
            <span className="text-2xl font-bold text-blue-600">
              ${calculateGrandTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
