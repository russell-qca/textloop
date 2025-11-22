'use client'

import { useState } from 'react'

interface EditableNotesProps {
  initialNotes: string | null
  onSave: (notes: string) => Promise<void>
}

export default function EditableNotes({ initialNotes, onSave }: EditableNotesProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes || '')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    await onSave(notes)
    setIsSaving(false)
    setIsEditing(false)
  }

  function handleCancel() {
    setNotes(initialNotes || '')
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
          placeholder="Add notes about this project..."
        />
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Notes</h2>
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {notes ? 'Edit' : 'Add Notes'}
        </button>
      </div>
      {notes ? (
        <p className="text-sm text-gray-900 whitespace-pre-wrap">{notes}</p>
      ) : (
        <p className="text-sm text-gray-500 italic">No notes yet</p>
      )}
    </div>
  )
}
