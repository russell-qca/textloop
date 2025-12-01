'use client'

import { Calendar, dateFnsLocalizer, View, Event } from 'react-big-calendar'
import withDragAndDrop, { EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { useState, useMemo, useTransition } from 'react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import Link from 'next/link'
import { updateProjectDates } from './actions'

const locales = {
  'en-US': require('date-fns/locale/en-US')
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarEvent extends Event {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    projectId: string
    color: string
  }
}

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar)

// Helper function to split a date range into weekday-only segments
function splitIntoWeekdaySegments(start: Date, end: Date): Array<{ start: Date; end: Date }> {
  const segments: Array<{ start: Date; end: Date }> = []
  let currentStart = new Date(start)

  while (currentStart <= end) {
    const day = currentStart.getDay()

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (day === 0 || day === 6) {
      currentStart.setDate(currentStart.getDate() + 1)
      continue
    }

    // Start a new segment
    let segmentStart = new Date(currentStart)
    let segmentEnd = new Date(currentStart)

    // Extend segment through consecutive weekdays
    while (segmentEnd <= end) {
      const nextDay = new Date(segmentEnd)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDayOfWeek = nextDay.getDay()

      // Stop if next day is weekend or beyond end date
      if (nextDayOfWeek === 0 || nextDayOfWeek === 6 || nextDay > end) {
        break
      }

      segmentEnd = nextDay
    }

    // Don't let segment end go beyond the project end date
    if (segmentEnd > end) {
      segmentEnd = new Date(end)
    }

    segments.push({ start: segmentStart, end: segmentEnd })

    // Move to next day after this segment
    currentStart = new Date(segmentEnd)
    currentStart.setDate(currentStart.getDate() + 1)
  }

  return segments
}

interface CalendarProject {
  id: string
  project_type: string
  start_date: string | null
  end_date: string | null
  exclude_weekends: boolean
  group_id: string | null
  clients: {
    first_name: string
    last_name: string
  } | null
  project_groups: {
    color: string
  } | null
}

interface CalendarViewProps {
  projects: CalendarProject[]
}

export default function CalendarView({ projects }: CalendarViewProps) {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [isPending, startTransition] = useTransition()

  // Convert projects to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    const allEvents: CalendarEvent[] = []

    projects
      .filter(project => project.start_date && project.end_date) // Only show projects with dates
      .forEach(project => {
        const clientName = project.clients
          ? `${project.clients.first_name} ${project.clients.last_name}`
          : 'Unknown Client'

        // Get color from group, or use light gray if unassigned
        const color = project.project_groups?.color || '#d1d5db'

        const title = `${project.project_type} - ${project.clients?.last_name || 'Unknown'}`
        const startDate = new Date(project.start_date!)
        // Add 1 day to end date to make it inclusive (react-big-calendar treats end as exclusive)
        const endDate = new Date(project.end_date!)
        endDate.setDate(endDate.getDate() + 1)

        // If exclude_weekends is true, split into weekday segments
        if (project.exclude_weekends) {
          const segments = splitIntoWeekdaySegments(startDate, endDate)
          segments.forEach((segment, index) => {
            allEvents.push({
              id: `${project.id}-segment-${index}`,
              title,
              start: segment.start,
              end: segment.end,
              resource: {
                projectId: project.id,
                color: color,
              },
            })
          })
        } else {
          // Normal event spanning full date range
          allEvents.push({
            id: project.id,
            title,
            start: startDate,
            end: endDate,
            resource: {
              projectId: project.id,
              color: color,
            },
          })
        }
      })

    return allEvents
  }, [projects])

  // Custom event style getter
  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.resource.color,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '500',
      },
    }
  }

  // Handle event drop (drag and drop)
  const handleEventDrop = ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
    startTransition(async () => {
      const startDate = start instanceof Date ? start : new Date(start)
      const endDate = end instanceof Date ? end : new Date(end)
      await updateProjectDates(event.resource.projectId, startDate.toISOString(), endDate.toISOString())
    })
  }

  // Handle event resize
  const handleEventResize = ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
    startTransition(async () => {
      const startDate = start instanceof Date ? start : new Date(start)
      const endDate = end instanceof Date ? end : new Date(end)
      await updateProjectDates(event.resource.projectId, startDate.toISOString(), endDate.toISOString())
    })
  }

  return (
    <div className="h-[calc(100vh-200px)] bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setView('day')}
            className={`px-3 py-1 text-sm rounded ${
              view === 'day'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1 text-sm rounded ${
              view === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 text-sm rounded ${
              view === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Month
          </button>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          + New Project
        </Link>
      </div>

      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => {
          window.location.href = `/dashboard/projects/${event.resource.projectId}`
        }}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        resizable
        draggableAccessor={() => true}
        style={{ height: 'calc(100% - 60px)', opacity: isPending ? 0.6 : 1 }}
        views={['day', 'week', 'month']}
        popup
        tooltipAccessor={(event) => event.title}
      />
    </div>
  )
}
