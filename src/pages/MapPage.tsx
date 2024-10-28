import React, { useCallback, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Spinner, Button, Avatar } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { listingsAtom, listingsFetchedAtom, fetchAllListingsAtom } from '../stores/listingStore';
import { listingUsersAtom, getAvatarUrl } from '../stores/userStore';
import { fetchPoliceStations } from '../utils/utils';
import { ExclamationCircleIcon, MagnifyingGlassCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import policeStationsData from '../assets/police-stations.json';
import { renderToStaticMarkup } from 'react-dom/server';
import { PoliceStationFeature } from '../types';
import { createTestId } from '../utils/utils';

const policeStationIcon = new L.Icon({
  iconUrl: '/police-station.svg',
  iconSize: [15, 15],
  iconAnchor: [7, 8],
});

// Custom component to handle popup class removal
const PopupClassHandler: React.FC = () => {
  useMapEvents({
    popupopen: (e) => {
      if (e.popup.options.className === 'listing-popup') {
        const popupContent = e.popup.getElement()?.querySelector('.leaflet-popup-content');
        if (popupContent) {
          popupContent.classList.remove('leaflet-popup-content');
        }
      }
    },
    popupclose: async (e) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (e.popup.options.className === 'listing-popup') {
        const popupContent = e.popup
          .getElement()
          ?.querySelector('.leaflet-popup-content-wrapper > div');
        if (popupContent) {
          popupContent.classList.add('leaflet-popup-content');
        }
      }
    },
  });

  return null;
};

const MapPage: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  const listings = useAtomValue(listingsAtom);
  const [listingsFetched, setListingsFetched] = useAtom(listingsFetchedAtom);
  const fetchAllListings = useSetAtom(fetchAllListingsAtom);
  const [policeStations, setPoliceStations] = useState<PoliceStationFeature[]>([]);
  const navigate = useNavigate();
  const listingUsers = useAtomValue(listingUsersAtom);

  // Check if policeStationsData exists, if not fetch it
  const fetchPoliceStationsData = useCallback(async () => {
    if (!policeStationsData) {
      await fetchPoliceStations().then((data) => {
        setPoliceStations(data);
      });
    }
  }, []);

  useEffect(() => {
    fetchPoliceStationsData();
  }, [fetchPoliceStationsData]);

  useEffect(() => {
    const fallbackCenter: [number, number] = [1.34616, 103.68209]; // NTU CCDS Coordinates

    // Fetch user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching user location:', error);
          setMapCenter(fallbackCenter);
          setLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setMapCenter(fallbackCenter);
      setLoading(false);
    }

    // Set police stations data directly
    setPoliceStations(policeStationsData.features as PoliceStationFeature[]);

    // Fetch listings if not already fetched
    if (!listingsFetched) {
      fetchAllListings().then(() => {
        setListingsFetched(true);
      });
    }
  }, [listingsFetched, fetchAllListings, setListingsFetched]);

  const getColorForType = (type: string) => {
    switch (type) {
      case 'found':
        return '#16a34a';
      case 'lost':
        return '#dc2626';
      default:
        return '#525252';
    }
  };

  const getMarkerForType = (type: string) => {
    const markerIconUrl =
      type === 'found' ? '/marker-green.svg' : type === 'lost' ? '/marker.svg' : '/marker.svg';
    return new L.Icon({
      iconUrl: markerIconUrl,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });
  };

  const getDisplayName = (userId: string) => {
    const user = listingUsers[userId];
    return user ? user.preferences?.name || user.email : '';
  };

  if (loading || !listingsFetched) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Spinner size='xl' />
      </div>
    );
  }

  const UserLocationMarker: React.FC<{ position: [number, number] }> = ({ position }) => {
    const icon = L.divIcon({
      className: 'custom-icon',
      html: renderToStaticMarkup(
        <div className='relative'>
          <img src='/marker-user.svg' alt='User location' className='w-7 h-7' />
          <span className='animate-ping absolute -bottom-3 left-0 h-7 w-7 rounded-full bg-blue-600 -z-10'></span>
        </div>
      ),
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    return (
      <Marker position={position} icon={icon}>
        <Popup>Your location</Popup>
      </Marker>
    );
  };

  return (
    <div className='flex flex-col h-full bg-white'>
      {/* Updated header style */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-semibold'>Map View</h1>
        </div>
      </div>

      {/* Map container taking up the rest of the screen */}
      <div className='flex-grow rounded-none sm:rounded-lg sm:mb-4 overflow-hidden'>
        {mapCenter ? (
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />

            <PopupClassHandler />

            {/* User Location Marker */}
            {userLocation && <UserLocationMarker position={userLocation} />}

            {/* Render Listings Markers */}
            {Object.values(listings).map((listing) =>
              listing.markers.map((marker) => (
                <React.Fragment key={marker.id}>
                  {/* Listing Marker */}
                  <Marker
                    position={[marker.latitude, marker.longitude]}
                    icon={getMarkerForType(listing.type)}
                    eventHandlers={{
                      add: (e) => {
                        // Add data-testid to the marker element
                        const el = e.target.getElement();
                        if (el) {
                          el.setAttribute(
                            'data-testid',
                            `listing-marker-${createTestId(listing.title)}`
                          );
                        }
                      },
                    }}>
                    {/* Listing Popup */}
                    <Popup closeButton={false} closeOnClick={true} className='listing-popup'>
                      <div className='w-56 bg-white rounded-lg overflow-hidden listing-popup'>
                        {/* Listing Image */}
                        <div className='relative p-2'>
                          {listing.images.main.data && (
                            <div className='w-full h-24 rounded-lg overflow-hidden border border-gray-200'>
                              <img
                                src={listing.images.main.data}
                                alt={listing.title}
                                className='w-full h-full object-cover'
                              />
                            </div>
                          )}
                        </div>

                        {/* Listing Details */}
                        <div className='relative p-2 pt-0'>
                          <div className='flex items-center justify-between mb-1'>
                            <div className='flex items-center gap-1 flex-grow'>
                              <Avatar
                                size='xs'
                                name={getDisplayName(listing.userId)}
                                src={getAvatarUrl(getDisplayName(listing.userId))}
                              />
                              <span className='text-xs font-medium truncate max-w-[100px]'>
                                {getDisplayName(listing.userId)}
                              </span>
                            </div>
                            <div
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
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
                          </div>
                          <h4 className='font-semibold text-sm mb-1 truncate'>{listing.title}</h4>
                          <div className='text-gray-600 font-medium text-xs'>
                            <p>{format(listing.createdAt, 'yyyy-MM-dd hh:mm a')}</p>
                            <p className='truncate'>{marker.name}</p>
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
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Circle for the radius of the listing */}
                  <Circle
                    center={[marker.latitude, marker.longitude]}
                    radius={marker.radius}
                    pathOptions={{
                      color: getColorForType(listing.type),
                      fillColor: getColorForType(listing.type),
                      fillOpacity: 0.1,
                      weight: 2,
                    }}
                  />
                </React.Fragment>
              ))
            )}

            {/* Police Station Markers */}
            {policeStations?.map((station, index) => (
              <Marker
                key={index}
                position={[station.geometry.coordinates[1], station.geometry.coordinates[0]]}
                icon={policeStationIcon}
                eventHandlers={{
                  add: (e) => {
                    const el = e.target.getElement();
                    if (el) {
                      el.setAttribute('data-testid', 'police-station-marker');
                    }
                  },
                }}>
                <Popup>
                  <div>
                    <h4>{station.properties.Description}</h4>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <p className='text-center'>Unable to load the map.</p>
        )}
      </div>
    </div>
  );
};

export default MapPage;
