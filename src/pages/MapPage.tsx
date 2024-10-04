import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Spinner } from '@chakra-ui/react';
import { fetchListingsWithMarkers } from '../stores/listingStore';

const userLocationIcon = new L.Icon({
  iconUrl: '/logo_transparent.png',
  iconSize: [30, 37],
  iconAnchor: [15, 37],
});

const MapPage: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [listingsWithMarkers, setListingsWithMarkers] = useState([]);

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

    const fetchListings = async () => {
      try {
        const fetchedListingsWithMarkers = await fetchListingsWithMarkers();
        setListingsWithMarkers(fetchedListingsWithMarkers);
      } catch (error) {
        console.error('Error fetching listings and markers:', error);
      }
    };

    fetchListings();
  }, []);

  const getColorForType = (type: string) => {
    switch (type) {
      case 'found':
        return 'green';
      case 'lost':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getMarkerForType = (type: string) => {
    const markerIconUrl =
      type === 'found' ? '/marker_green.png' : type === 'lost' ? '/marker.png' : '/marker.png';
    return new L.Icon({
      iconUrl: markerIconUrl,
      iconSize: [15, 18],
      iconAnchor: [7, 18],
    });
  };

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

      <div className='w-full max-w-4xl h-[70vh] bg-white shadow-md rounded-lg'>
        {userLocation ? (
          <MapContainer
            center={userLocation}
            zoom={13}
            style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
            <Marker position={userLocation} icon={userLocationIcon} />
            <Circle
              center={userLocation}
              radius={500}
              pathOptions={{
                color: 'blue',
                fillColor: 'blue',
                fillOpacity: 0.1,
              }}
            />
            {listingsWithMarkers.map((listing) =>
              listing.markers.map((marker) => (
                <React.Fragment key={marker.id}>
                  <Marker
                    position={[marker.latitude, marker.longitude]}
                    icon={getMarkerForType(listing.type)}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-bold">{listing.title}</h4>
                        <p><strong>Type:</strong> {listing.type}</p>
                        <p><strong>Marker Name:</strong> {marker.name}</p>
                        <p><strong>Radius:</strong> {marker.radius} meters</p>
                        <p><strong>Description:</strong> {listing.description}</p>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={[marker.latitude, marker.longitude]}
                    radius={marker.radius}
                    pathOptions={{
                      color: getColorForType(listing.type),
                      fillColor: getColorForType(listing.type),
                      fillOpacity: 0.2,
                    }}
                  />
                </React.Fragment>
              ))
            )}
          </MapContainer>
        ) : (
          <p className='text-center'>Unable to fetch your location.</p>
        )}
      </div>
    </div>
  );
};

export default MapPage;
