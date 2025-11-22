'use client'

import { LoadScript } from '@react-google-maps/api'
import { ReactNode } from 'react'

const libraries: ("places")[] = ['places']

interface GoogleMapsProviderProps {
  children: ReactNode
}

export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error('Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file')
    return <>{children}</>
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
      {children}
    </LoadScript>
  )
}
