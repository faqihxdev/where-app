import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Spinner,
} from '@chakra-ui/react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Marker as MarkerType } from '../../types';
import { reverseGeocode } from '../../utils/utils';

// Create custom icon
const customIcon = new L.Icon({
  iconUrl: '/marker.png', // Update this line
  iconSize: [30, 37],
  iconAnchor: [15, 37],
});

interface MapSelectorProps {
  mode: 'filter' | 'create' | 'edit';
  initialMarkers?: Omit<MarkerType, 'id' | 'listingId'>[];
  maxMarkers?: number;
  onMarkersChange: (markers: Omit<MarkerType, 'id' | 'listingId'>[]) => void;
  showRemoveButton?: boolean;
}

const MapSelector: React.FC<MapSelectorProps> = ({
  mode,
  initialMarkers = [],
  maxMarkers = 3,
  onMarkersChange,
  showRemoveButton = false,
}) => {
  const [markers, setMarkers] = useState<Omit<MarkerType, 'id' | 'listingId'>[]>(initialMarkers);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isAddingMarker, setIsAddingMarker] = useState(false);

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
    if (initialMarkers.length > 0 && markers.length === 0) {
      setMarkers(initialMarkers);
      if (initialMarkers[0]) {
        setMapCenter([initialMarkers[0].latitude, initialMarkers[0].longitude]);
      }
    }
  }, [initialMarkers, markers]);

  const addMarker = useCallback(
    async (lat: number, lng: number) => {
      setIsAddingMarker(true);
      const tempMarker: Omit<MarkerType, 'id' | 'listingId'> = {
        name: 'Loading...',
        latitude: lat,
        longitude: lng,
        radius: 100,
      };
      const updatedMarkers = mode === 'filter' ? [tempMarker] : [...markers, tempMarker];
      setMarkers(updatedMarkers);
      onMarkersChange(updatedMarkers);

      try {
        const address = await reverseGeocode(lat, lng);
        const finalMarkers = updatedMarkers.map((marker) =>
          marker.latitude === lat && marker.longitude === lng
            ? { ...marker, name: address }
            : marker
        );
        setMarkers(finalMarkers);
        onMarkersChange(finalMarkers);
      } catch (error) {
        console.error('Error fetching address:', error);
      } finally {
        setIsAddingMarker(false);
      }
    },
    [markers, mode, onMarkersChange]
  );

  const handleMapClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (
        !isAddingMarker &&
        (mode === 'filter' ||
          ((mode === 'create' || mode === 'edit') && markers.length < maxMarkers))
      ) {
        const { lat, lng } = e.latlng;
        addMarker(lat, lng);
      }
    },
    [isAddingMarker, mode, markers.length, maxMarkers, addMarker]
  );

  const updateMarker = (index: number, updates: Partial<Omit<MarkerType, 'id' | 'listingId'>>) => {
    const updatedMarkers = markers.map((marker, i) => {
      if (i === index) {
        const updatedMarker = { ...marker, ...updates };
        if (updates.radius !== undefined) {
          updatedMarker.radius =
            isNaN(updates.radius) || updates.radius === null ? 5 : Math.max(5, updates.radius);
        }
        return updatedMarker;
      }
      return marker;
    });
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
      <div className='h-64 md:h-96 flex items-center justify-center'>
        <Spinner size='xl' />
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <div className='h-64 md:h-96 relative rounded-lg overflow-clip'>
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />
          {markers.map((marker, index) => (
            <React.Fragment key={index}>
              <Marker position={[marker.latitude, marker.longitude]} icon={customIcon} />
              <Circle center={[marker.latitude, marker.longitude]} radius={marker.radius} />
            </React.Fragment>
          ))}
          <MapEvents />
        </MapContainer>
        {isAddingMarker && (
          <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
            <Spinner size='xl' color='white' />
          </div>
        )}
      </div>
      <VStack spacing={4} align='stretch'>
        {markers.map((marker, index) => (
          <VStack
            key={index}
            spacing={4}
            align='stretch'
            className='p-4 border border-gray-200 rounded-lg'>
            <FormControl>
              <div className='flex flex-row justify-between relative'>
                <FormLabel>Location Name</FormLabel>
                <div className='w-full absolute text-[9px] text-right text-gray-500 bottom-[13px] right-1'>
                  {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
                </div>
              </div>
              <Input
                variant='filled'
                bg='gray.100'
                value={marker.name}
                onChange={(e) => updateMarker(index, { name: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Radius (meters)</FormLabel>
              <NumberInput
                variant='filled'
                bg='gray.100'
                rounded='md'
                min={5}
                value={marker.radius}
                onChange={(valueString, valueNumber) => {
                  const radius = valueString === '' ? null : valueNumber;
                  updateMarker(index, { radius: radius as number | undefined });
                }}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            {(mode !== 'filter' || showRemoveButton) && (
              <Button
                fontWeight='normal'
                leftIcon={<XMarkIcon className='h-4 w-4 stroke-[3]' />}
                onClick={() => removeMarker(index)}
                colorScheme='red'>
                Remove Location
              </Button>
            )}
          </VStack>
        ))}
      </VStack>
      {mode !== 'filter' && markers.length < maxMarkers && (
        <Button
          w='full'
          leftIcon={<PlusIcon className='h-4 w-4' />}
          onClick={() => addMarker(mapCenter[0], mapCenter[1])}
          isDisabled={isAddingMarker}>
          Add Location
        </Button>
      )}
    </div>
  );
};

export default MapSelector;
