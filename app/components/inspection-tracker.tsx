'use client'

import { useState } from 'react'
import { Database } from '@/types/database'

type Inspection = Database['public']['Tables']['inspections']['Row']
type InspectionType = Inspection['inspection_type']

interface InspectionTrackerProps {
  projectId: string
  initialInspections: Inspection[]
  onAddInspection: (projectId: string, inspectionType: InspectionType) => Promise<void>
  onCompleteInspection: (inspectionId: string, completedDate: string) => Promise<void>
  onDeleteInspection: (inspectionId: string) => Promise<void>
}

const INSPECTION_TYPES: { value: InspectionType; label: string }[] = [
  { value: 'footer', label: 'Footer' },
  { value: 'framing', label: 'Framing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'insulation', label: 'Insulation' },
  { value: 'final', label: 'Final' },
]

export default function InspectionTracker({
  projectId,
  initialInspections,
  onAddInspection,
  onCompleteInspection,
  onDeleteInspection,
}: InspectionTrackerProps) {
  const [selectedType, setSelectedType] = useState<InspectionType | ''>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [completedDate, setCompletedDate] = useState('')

  // Get available inspection types (not already added)
  const addedTypes = initialInspections.map((i) => i.inspection_type)
  const availableTypes = INSPECTION_TYPES.filter(
    (type) => !addedTypes.includes(type.value)
  )

  async function handleAddInspection() {
    if (!selectedType) return

    await onAddInspection(projectId, selectedType)
    setSelectedType('')
  }

  async function handleComplete(inspectionId: string) {
    if (!completedDate) return

    await onCompleteInspection(inspectionId, completedDate)
    setEditingId(null)
    setCompletedDate('')
  }

  function getInspectionLabel(type: InspectionType): string {
    return INSPECTION_TYPES.find((t) => t.value === type)?.label || type
  }

  // Sort inspections by the order in INSPECTION_TYPES
  const sortedInspections = [...initialInspections].sort((a, b) => {
    const aIndex = INSPECTION_TYPES.findIndex((t) => t.value === a.inspection_type)
    const bIndex = INSPECTION_TYPES.findIndex((t) => t.value === b.inspection_type)
    return aIndex - bIndex
  })

  return (
    <div className="space-y-4">
      {/* Add Inspection */}
      {availableTypes.length > 0 && (
        <div className="flex gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as InspectionType | '')}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Select inspection type...</option>
            {availableTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddInspection}
            disabled={!selectedType}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      )}

      {/* Inspections List */}
      {sortedInspections.length > 0 ? (
        <div className="space-y-2">
          {sortedInspections.map((inspection) => (
            <div
              key={inspection.id}
              className={`border rounded-lg p-4 ${
                inspection.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {getInspectionLabel(inspection.inspection_type)}
                    </h4>
                    {inspection.completed && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        ✓ Completed
                      </span>
                    )}
                  </div>
                  {inspection.completed && inspection.completed_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Completed: {new Date(inspection.completed_date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!inspection.completed && (
                    <>
                      {editingId === inspection.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={completedDate}
                            onChange={(e) => setCompletedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="text-sm rounded-md border border-gray-300 px-2 py-1"
                          />
                          <button
                            onClick={() => handleComplete(inspection.id)}
                            disabled={!completedDate}
                            className="px-3 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null)
                              setCompletedDate('')
                            }}
                            className="px-3 py-1 text-xs font-medium rounded text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(inspection.id)
                            setCompletedDate(new Date().toISOString().split('T')[0])
                          }}
                          className="px-3 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                        >
                          Mark Complete
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => onDeleteInspection(inspection.id)}
                    className="px-3 py-1 text-xs font-medium rounded text-red-600 bg-white border border-red-300 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">
          No inspections added yet. Select an inspection type above to get started.
        </p>
      )}
    </div>
  )
}
