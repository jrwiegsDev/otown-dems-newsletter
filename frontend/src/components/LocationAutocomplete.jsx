import { useRef, useState, useEffect } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { Input } from '@chakra-ui/react';

const libraries = ['places'];

const LocationAutocomplete = ({ value, onChange, isRequired = false }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [autocomplete, setAutocomplete] = useState(null);
  const inputRef = useRef(null);

  // Update input value when prop changes (important for edit modal)
  useEffect(() => {
    if (inputRef.current && value !== inputRef.current.value) {
      inputRef.current.value = value || '';
    }
  }, [value]);

  const onLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const locationData = {
          address: place.formatted_address || '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        
        onChange(locationData);
      } else {
        // If user types without selecting from dropdown, just pass the text
        onChange({ address: inputRef.current.value, lat: null, lng: null });
      }
    }
  };

  const handleInputChange = (e) => {
    // Allow manual typing and pass it up
    onChange({ address: e.target.value, lat: null, lng: null });
  };

  if (!isLoaded) {
    return (
      <Input
        placeholder="Loading..."
        isDisabled
      />
    );
  }

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'geometry', 'name'],
      }}
    >
      <Input
        ref={inputRef}
        type="text"
        placeholder="Start typing an address..."
        defaultValue={value}
        onChange={handleInputChange}
      />
    </Autocomplete>
  );
};

export default LocationAutocomplete;
