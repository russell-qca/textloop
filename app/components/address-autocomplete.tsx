'use client'

import { useEffect, useRef } from 'react'

interface AddressComponents {
  street: string
  city: string
  state: string
  zip: string
  county?: string
}

interface AddressAutocompleteProps {
  onPlaceSelected: (address: AddressComponents) => void
  defaultValue?: string
  placeholder?: string
  className?: string
  includeCounty?: boolean
  id?: string
  name?: string
  required?: boolean
}

export default function AddressAutocomplete({
  onPlaceSelected,
  defaultValue = '',
  placeholder = 'Enter address',
  className = '',
  includeCounty = false,
  id = 'address-autocomplete',
  name = 'address',
  required = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
      console.error('Google Maps API not loaded')
      return
    }

    if (!inputRef.current) return

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
      fields: ['address_components'],
    })

    // Listen for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()

      if (!place || !place.address_components) {
        return
      }

      // Extract address components
      const components = place.address_components
      const address: AddressComponents = {
        street: '',
        city: '',
        state: '',
        zip: '',
      }

      if (includeCounty) {
        address.county = ''
      }

      let streetNumber = ''
      let route = ''

      components.forEach((component) => {
        const types = component.types

        if (types.includes('street_number')) {
          streetNumber = component.long_name
        }
        if (types.includes('route')) {
          route = component.long_name
        }
        if (types.includes('locality')) {
          address.city = component.long_name
        }
        if (types.includes('administrative_area_level_1')) {
          address.state = component.short_name
        }
        if (types.includes('postal_code')) {
          address.zip = component.long_name
        }
        if (includeCounty && types.includes('administrative_area_level_2')) {
          // Remove " County" suffix if present
          address.county = component.long_name.replace(/ County$/i, '')
        }
      })

      address.street = `${streetNumber} ${route}`.trim()

      onPlaceSelected(address)
    })

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [onPlaceSelected, includeCounty])

  return (
    <input
      ref={inputRef}
      type="text"
      id={id}
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={className}
      required={required}
      autoComplete="new-password"
    />
  )
}
