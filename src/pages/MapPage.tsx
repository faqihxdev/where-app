import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Spinner, Button } from '@chakra-ui/react';
import { fetchListingsWithMarkers } from '../stores/listingStore';
import { useNavigate } from 'react-router-dom';

// Icons for user location and police stations
const userLocationIcon = new L.Icon({
  iconUrl: '/logo_transparent.png',
  iconSize: [30, 37],
  iconAnchor: [15, 37],
});

const policeStationIcon = new L.Icon({
  iconUrl: '/police_picture.png', // Path to your police station marker icon
  iconSize: [15, 18],
  iconAnchor: [7, 8],
});

const MapPage: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [listingsWithMarkers, setListingsWithMarkers] = useState([]);
  const [policeStations, setPoliceStations] = useState<any[]>([]); // Store police stations GeoJSON data
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user location
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

    // Fetch listings
    const fetchListings = async () => {
      try {
        const fetchedListingsWithMarkers = await fetchListingsWithMarkers();
        setListingsWithMarkers(fetchedListingsWithMarkers);
      } catch (error) {
        console.error('Error fetching listings and markers:', error);
      }
    };

    // Fetch GeoJSON data from local file
    const fetchPoliceStations = async () => {
      try {
        const response = await fetch('/cleaned_police_stations.geojson'); // Assuming it's in public folder
        const data = await response.json();
        setPoliceStations(data.features); // Assuming 'features' holds the relevant GeoJSON data
      } catch (error) {
        console.error('Error fetching police station data:', error);
      }
    };

    fetchListings();
    fetchPoliceStations();
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
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100">
      <header className="w-full max-w-4xl bg-white shadow-md rounded-lg p-4 mb-4">
        <h1 className="text-2xl font-semibold text-center">Map</h1>
      </header>

      <div className="w-full max-w-4xl h-[70vh] bg-white shadow-md rounded-lg">
        {userLocation ? (
          <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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

            {/* Render Listings Markers */}
            {listingsWithMarkers.map((listing) =>
              listing.markers.map((marker) => (
                <React.Fragment key={marker.id}>
                  <Marker
                    position={[marker.latitude, marker.longitude]}
                    icon={getMarkerForType(listing.type)}
                  >
                    <Popup className="custom-popup">
                      <div
                        className=" text-xs"
                        style={{
                          minWidth: '100px',
                          maxWidth: '250px',
                          fontSize: '10px',
                          textAlign: 'center',
                        }}
                      >
                        <h4 className="font-bold text-base mb-1">{listing.title}</h4>
                        <p className="text-gray-600 mb-2">{listing.description}</p>
                        <Button
                          colorScheme={listing.type === 'found' ? 'green' : 'red'}
                          size="sm"
                          width="100px"
                          onClick={() => navigate(`/view/${listing.id}?from=map`)}
                          mb={2}
                        >
                          Open
                        </Button>
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

            {policeStations.map((station, index) => (
              <Marker
                key={index}
                position={[station.geometry.coordinates[1], station.geometry.coordinates[0]]}
                icon={policeStationIcon}
              >
                <Popup>
                  <div>
                    <h4>{station.properties.Description}</h4>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <p className="text-center">Unable to fetch your location.</p>
        )}
      </div>
    </div>
  );
};

export default MapPage;
