import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Spinner } from '@chakra-ui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { fetchAllMarkersAtom, markersAtom } from '../stores/markerStore'; // Import the fetchAllMarkers function

// Create custom icon for the user's location marker
const userLocationIcon = new L.Icon({
  iconUrl: '/logo.png', // Update with your marker icon URL
  iconSize: [30, 37],
  iconAnchor: [15, 37],
});

const itemLocationIcon = new L.Icon({
  iconUrl: '/marker.png', // Update with your marker icon URL
  iconSize: [15, 18],
  iconAnchor: [7, 18],
});

const MapPage: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const fetchAllMarkers = useSetAtom(fetchAllMarkersAtom);
  const [loading, setLoading] = useState(true);
  const markers = useAtomValue(markersAtom); // Add state for markers

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching user location:', error);
          setLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setLoading(false);
    }

    // Fetch markers from Firestore
    const fetchMarkers = async () => {
      try {
        await fetchAllMarkers();
      } catch (error) {
        console.error('Error fetching markers:', error);
      }
    };

    fetchMarkers();
  }, [fetchAllMarkers]);

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Spinner size='xl' />
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center justify-center bg-gray-100'>
      <header className='w-full max-w-4xl bg-white shadow-md rounded-lg p-4 mb-4'>
        <h1 className='text-2xl font-semibold text-center'>Map</h1>
      </header>

      {/* Map */}
      <div className='w-full max-w-4xl h-[70vh] bg-white shadow-md rounded-lg'>
        {userLocation ? (
          <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
            <Marker position={userLocation} icon={userLocationIcon} />

            {Object.values(markers).map((marker) => (
              <React.Fragment key={marker.id}>
                {/* Marker */}
                <Marker position={[marker.latitude, marker.longitude]} icon={itemLocationIcon} />
                {/* Circle for radius */}
                <Circle
                  center={[marker.latitude, marker.longitude]}
                  radius={marker.radius}
                  pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }} // Customize circle styles
                />
              </React.Fragment>
            ))}
          </MapContainer>
        ) : (
          <p className='text-center'>Unable to fetch your location.</p>
        )}
      </div>
    </div>
  );
};

export default MapPage;
