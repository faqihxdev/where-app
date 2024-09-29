import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FormControl,
  FormLabel,
  Box,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react';

// Create custom icon
const customIcon = new L.Icon({
  iconUrl: 'marker.png',
  iconSize: [30, 37],
  iconAnchor: [15, 37],
});

interface LocationSearchProps {
  location: { lat: number; lng: number; radius: number } | null;
  setLocation: (location: { lat: number; lng: number; radius: number } | null) => void;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ location, setLocation }) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]);
  const [radius, setRadius] = useState(location?.radius || 5);

  useEffect(() => {
    if (location) {
      setMapCenter([location.lat, location.lng]);
    }
  }, [location]);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    setLocation({ lat, lng, radius });
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

  return (
    <FormControl>
      <FormLabel>Location</FormLabel>
      <Box height="300px" marginBottom="1rem">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {location && (
            <Marker position={[location.lat, location.lng]} icon={customIcon} />
          )}
          <MapEvents />
        </MapContainer>
      </Box>
      <FormLabel>Search Radius (km)</FormLabel>
      <Slider
        min={1}
        max={50}
        step={1}
        value={radius}
        onChange={(value) => {
          setRadius(value);
          if (location) {
            setLocation({ ...location, radius: value });
          }
        }}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </FormControl>
  );
};

export default LocationSearch;