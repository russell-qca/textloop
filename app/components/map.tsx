'use client'

import { useEffect, useRef, useState } from 'react'

interface MapProps {
  address: string
  className?: string
}

export default function Map({ address, className = '' }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps) {
      setError('Google Maps API not loaded')
      return
    }

    if (!mapRef.current || !address) return

    // Initialize geocoder
    const geocoder = new google.maps.Geocoder()

    // Geocode the address
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location

        // Create or update map
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new google.maps.Map(mapRef.current!, {
            center: location,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          })
        } else {
          mapInstanceRef.current.setCenter(location)
        }

        // Remove old marker if exists
        if (markerRef.current) {
          markerRef.current.setMap(null)
        }

        // Add marker
        markerRef.current = new google.maps.Marker({
          position: location,
          map: mapInstanceRef.current,
          title: address,
        })

        setError(null)
      } else {
        setError('Unable to find location on map')
        console.error('Geocode error:', status)
      }
    })

    return () => {
      // Cleanup marker on unmount
      if (markerRef.current) {
        markerRef.current.setMap(null)
      }
    }
  }, [address])

  if (error) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-md p-4 ${className}`}>
        <p className="text-sm text-gray-500 text-center">{error}</p>
      </div>
    )
  }

  if (!address) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-md p-4 ${className}`}>
        <p className="text-sm text-gray-500 text-center">No address provided</p>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className={className}
      style={{ minHeight: '300px' }}
    />
  )
}
