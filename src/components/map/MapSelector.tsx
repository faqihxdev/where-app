import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Spinner,
} from '@chakra-ui/react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Marker as MarkerType } from '../../types';

// Create custom icon
const customIcon = new L.Icon({
  iconUrl: 'marker.png',
  iconSize: [30, 37],
  iconAnchor: [15, 37],
});

interface MapSelectorProps {
  mode: 'filter' | 'create' | 'edit';
  initialMarkers?: Omit<MarkerType, 'id' | 'listingId'>[];
  maxMarkers?: number;
  onMarkersChange: (markers: Omit<MarkerType, 'id' | 'listingId'>[]) => void;
}

const MapSelector: React.FC<MapSelectorProps> = ({
  mode,
  initialMarkers = [],
  maxMarkers = 3,
  onMarkersChange,
}) => {
  const [markers, setMarkers] = useState<Omit<MarkerType, 'id' | 'listingId'>[]>(initialMarkers);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  
  useEffect(() => {
    const defaultCenter: [number, number] = [1.346196448771191, 103.6820510237857];
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.error('[MapSelector/useEffect]: Error fetching geolocation', error);
          setMapCenter(defaultCenter);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setMapCenter(defaultCenter);
    }
  }, []);

  useEffect(() => {
    if (markers.length > 0) {
      setMapCenter([markers[0].latitude, markers[0].longitude]);
    }
  }, [markers]);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (mode === 'filter' || (mode === 'create' && markers.length < maxMarkers)) {
      const { lat, lng } = e.latlng;
      const newMarker: Omit<MarkerType, 'id' | 'listingId'> = {
        name: `Location ${markers.length + 1}`,
        latitude: lat,
        longitude: lng,
        radius: 100,
      };
      const updatedMarkers = mode === 'filter' ? [newMarker] : [...markers, newMarker];
      setMarkers(updatedMarkers);
      onMarkersChange(updatedMarkers);
    }
  };

  const updateMarker = (index: number, updates: Partial<Omit<MarkerType, 'id' | 'listingId'>>) => {
    const updatedMarkers = markers.map((marker, i) =>
      i === index ? { ...marker, ...updates } : marker
    );
    setMarkers(updatedMarkers);
    onMarkersChange(updatedMarkers);
  };

  const removeMarker = (index: number) => {
    const updatedMarkers = markers.filter((_, i) => i !== index);
    setMarkers(updatedMarkers);
    onMarkersChange(updatedMarkers);
  };

  const MapEvents = () => {
    const map = useMap();
    useEffect(() => {
      map.on('click', handleMapClick);
      return () => {
        map.off('click', handleMapClick);
      };
    }, [map]);
    return null;
  };

  if (!mapCenter) {
    return (
      <div className="h-64 md:h-96 flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="h-64 md:h-96 relative rounded-lg overflow-clip">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((marker, index) => (
            <React.Fragment key={index}>
              <Marker position={[marker.latitude, marker.longitude]} icon={customIcon} />
              <Circle center={[marker.latitude, marker.longitude]} radius={marker.radius} />
            </React.Fragment>
          ))}
          <MapEvents />
        </MapContainer>
      </div>
      <VStack spacing={4} align="stretch">
        {markers.map((marker, index) => (
          <VStack key={index} spacing={2} align="stretch" className="p-4 border border-gray-200 rounded-lg">
            <FormControl>
              <FormLabel>Location Name</FormLabel>
              <Input
                variant="filled"
                bg="gray.100"
                value={marker.name}
                onChange={(e) => updateMarker(index, { name: e.target.value })}
              />
            </FormControl>
            <HStack>
              <FormControl>
                <FormLabel>Latitude</FormLabel>
                <Input
                  variant="filled"
                  bg="gray.100"
                  value={marker.latitude}
                  onChange={(e) => updateMarker(index, { latitude: parseFloat(e.target.value) })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Longitude</FormLabel>
                <Input
                  variant="filled"
                  bg="gray.100"
                  value={marker.longitude}
                  onChange={(e) => updateMarker(index, { longitude: parseFloat(e.target.value) })}
                />
              </FormControl>
            </HStack>
            <FormControl>
              <FormLabel>Radius (meters)</FormLabel>
              <NumberInput
                variant="filled"
                bg="gray.100"
                rounded="md"
                min={5}
                value={marker.radius}
                onChange={(_, value) => updateMarker(index, { radius: value })}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            {mode !== 'filter' && (
              <Button
                fontWeight="normal"
                leftIcon={<XMarkIcon className="h-4 w-4 stroke-[3]" />}
                onClick={() => removeMarker(index)}
                colorScheme="red"
              >
                Remove Location
              </Button>
            )}
          </VStack>
        ))}
      </VStack>
      {mode !== 'filter' && markers.length < maxMarkers && (
        <Button
          w="full"
          leftIcon={<PlusIcon className="h-4 w-4" />}
          onClick={() => handleMapClick({ latlng: { lat: mapCenter[0], lng: mapCenter[1] } } as L.LeafletMouseEvent)}
        >
          Add Location
        </Button>
      )}
    </div>
  );
};

export default MapSelector;