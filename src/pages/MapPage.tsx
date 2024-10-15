import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Spinner, Button, Avatar } from '@chakra-ui/react';
import { fetchListingsWithMarkers } from '../stores/listingStore';
import { useNavigate } from 'react-router-dom';
import { Listing, ListingStatus } from '../types';
import { useAtomValue } from 'jotai';
import { listingUsersAtom, getAvatarUrl } from '../stores/userStore';
import { ExclamationCircleIcon, MagnifyingGlassCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { truncateWithEllipsis } from '../utils/utils';

// Icons for user location and police stations
// Create custom icon for the user's location marker
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

  const [listingsWithMarkers, setListingsWithMarkers] = useState<Listing[]>([]);
  const [policeStations, setPoliceStations] = useState<any[]>([]); // Store police stations GeoJSON data
  const navigate = useNavigate();
  const listingUsers = useAtomValue(listingUsersAtom);

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

  const getDisplayName = (userId: string) => {
    const user = listingUsers[userId];
    return user ? user.preferences?.name || user.email : '';
  };

  const getStatusBadgeColor = (status: ListingStatus) => {
    switch (status) {
      case ListingStatus.resolved:
        return 'bg-green-200/95 text-green-800';
      case ListingStatus.expired:
        return 'bg-red-200/95 text-red-800';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Spinner size='xl' />
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full bg-white'>
      {/* Updated header style */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-semibold'>Map</h1>
        </div>
      </div>

      {/* Map container taking up the rest of the screen */}
      <div className='flex-grow'>
        {userLocation ? (
          <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
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

            {/* Render Listings Markers */}
            {listingsWithMarkers.map((listing) =>
              listing.markers.map((marker) => (
                <React.Fragment key={marker.id}>
                  <Marker
                    position={[marker.latitude, marker.longitude]}
                    icon={getMarkerForType(listing.type)}>
                    <Popup closeButton={false}>
                      <div className='w-56 bg-white rounded-lg overflow-hidden'>
                        <div className='relative'>
                          {listing.images.main.data && (
                            <img
                              src={listing.images.main.data}
                              alt={listing.title}
                              className='w-full h-24 object-cover'
                            />
                          )}
                          <div
                            className={`absolute top-1 right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                              listing.type === 'found'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                            {listing.type === 'lost' ? (
                              <ExclamationCircleIcon className='w-3 h-3 stroke-2' />
                            ) : (
                              <MagnifyingGlassCircleIcon className='w-3 h-3 stroke-2' />
                            )}
                            {listing.type === 'lost' ? 'Lost' : 'Found'}
                          </div>
                          {listing.status !== ListingStatus.active && (
                            <div
                              className={`absolute top-1 left-1 flex rounded-lg items-center gap-1 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${getStatusBadgeColor(listing.status)}`}>
                              <span>{listing.status}</span>
                            </div>
                          )}
                        </div>
                        <div className='p-2'>
                          <div className='flex items-center gap-1 mb-1'>
                            <Avatar
                              size='2xs'
                              name={getDisplayName(listing.userId)}
                              src={getAvatarUrl(getDisplayName(listing.userId))}
                            />
                            <span className='text-xs font-medium'>
                              {truncateWithEllipsis(getDisplayName(listing.userId), 15)}
                            </span>
                          </div>
                          <h4 className='font-semibold text-sm mb-1 truncate'>{listing.title}</h4>
                          <div className='text-gray-600 font-medium text-xs'>
                            <p>{format(listing.createdAt, 'yyyy-MM-dd hh:mm a')}</p>
                            <p>{truncateWithEllipsis(marker.name, 25)}</p>
                          </div>
                          <div className='flex gap-2 mt-2'>
                            <Button
                              onClick={() => navigate(`/view/${listing.id}?from=map`)}
                              size='xs'
                              flex={1}
                              fontWeight='medium'
                              bg='primary.600'
                              color='white'
                              _hover={{ bg: 'primary.700' }}
                              _active={{ bg: 'primary.800' }}>
                              View Details
                            </Button>
                            <Button
                              onClick={() => {
                                const popupElement = document.querySelector(
                                  '.leaflet-popup-close-button'
                                ) as HTMLElement;
                                if (popupElement) popupElement.click();
                              }}
                              size='xs'
                              fontWeight='medium'
                              variant='outline'>
                              Close
                            </Button>
                          </div>
                        </div>
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

            {policeStations?.map((station, index) => (
              <Marker
                key={index}
                position={[station.geometry.coordinates[1], station.geometry.coordinates[0]]}
                icon={policeStationIcon}>
                <Popup>
                  <div>
                    <h4>{station.properties.Description}</h4>
                  </div>
                </Popup>
              </Marker>
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
