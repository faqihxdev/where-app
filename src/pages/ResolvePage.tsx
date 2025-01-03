import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useSetAtom, useAtomValue, useAtom } from 'jotai';
import LoadingSpinner from '../components/LoadingSpinner';
import { userDataAtom } from '../stores/userStore';
import { updateListingAtom, listingsAtom } from '../stores/listingStore';
import { updateMatchAtom, matchesAtom, fetchMatchByIdAtom } from '../stores/matchStore';
import { addNotificationAtom } from '../stores/notificationStore';
import { Match, MatchStatus, Listing, ListingStatus, NotificationType } from '../types';
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { showCustomToast } from '../components/CustomToast';
import MatchCard from '../components/MatchCard';
import { compressImage, addImageAtom } from '../stores/imageStore';

const ResolvePage: React.FC = () => {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const updateListing = useSetAtom(updateListingAtom);
  const updateMatch = useSetAtom(updateMatchAtom);
  const fetchMatchById = useSetAtom(fetchMatchByIdAtom);
  const addNotification = useSetAtom(addNotificationAtom);
  const addImage = useSetAtom(addImageAtom);
  const matches = useAtomValue(matchesAtom);
  const userData = useAtomValue(userDataAtom);
  const [listings, setListings] = useAtom(listingsAtom);

  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isMatchCardOpen, setIsMatchCardOpen] = useState(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  const webcamContainerRef = useRef<HTMLDivElement>(null);
  const webcamRef = useRef<Webcam>(null);

  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const [isWebcamReady, setIsWebcamReady] = useState(false);

  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');
        setCameras(videoDevices);
      } catch (error) {
        console.error('[ResolvePage]: Error getting cameras:', error);
      }
    };

    getCameras();
  }, []);

  const startCamera = useCallback(() => {
    setIsCameraActive(true);
  }, []);

  const stopCamera = useCallback(() => {
    if (webcamRef.current && webcamRef.current.video) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const switchCamera = useCallback(() => {
    setCurrentCameraIndex((prevIndex) => (prevIndex + 1) % cameras.length);
  }, [cameras]);

  const fetchData = useCallback(async () => {
    if (!matchId) return;

    setIsLoading(true);
    setError(null);

    try {
      let fetchedMatch = matches[matchId];
      if (!fetchedMatch) {
        const result = await fetchMatchById(matchId);
        if (result === null) {
          throw new Error('Match not found');
        }
        fetchedMatch = result;
      }
      setMatch(fetchedMatch);
    } catch (err) {
      console.error('[ResolvePage]: Error fetching data:', err);
      setError('An error occurred while fetching the data');
    } finally {
      setIsLoading(false);
    }
  }, [matchId, matches, fetchMatchById]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      const blob = dataURIToBlob(imageSrc);
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
      setImgFile(file);
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const uploadImage = async () => {
    if (!imgFile || !match) {
      showCustomToast({
        title: 'Error',
        description: 'No image captured or match data missing',
        color: 'danger',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Compress the image
      const compressedFile = await compressImage(imgFile);

      // Convert the compressed file to base64
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedFile);
      });

      // Upload the image to Firestore
      const imageId = await addImage(base64Image, match.listingId1);

      // Update both listings
      const listingIds = [match.listingId1, match.listingId2];
      const updatedListings: Record<string, Listing> = {};

      for (const listingId of listingIds) {
        const listing = listings[listingId];
        if (!listing) {
          throw new Error(`Listing not found: ${listingId}`);
        }

        const updatedListing: Listing = {
          ...listing,
          status: ListingStatus.resolved,
          resolveImage: { id: imageId, listingId, data: base64Image },
        };

        await updateListing({
          updatedListing,
          imageUpdates: {},
        });

        updatedListings[listingId] = updatedListing;
      }

      // Update the match status
      await updateMatch(match.id, {
        status: MatchStatus.resolved,
        updatedAt: new Date(),
      });

      // Update local state
      setListings((prev: Record<string, Listing>) => ({
        ...prev,
        ...updatedListings,
      }));

      showCustomToast({
        title: 'Success',
        description: 'Listing resolved successfully',
        color: 'success',
      });

      // Send notification to both users
      const isCurrentUserFirst = match.userId1 === userData?.uid;
      const [otherUserId, otherListingId] = isCurrentUserFirst
        ? [match.userId2, match.listingId2]
        : [match.userId1, match.listingId1];

      const [currentUserId, currentListingId] = isCurrentUserFirst
        ? [match.userId1, match.listingId1]
        : [match.userId2, match.listingId2];

      // Send notification to the other user
      await addNotification({
        userId: otherUserId,
        title: 'Listing Resolved',
        message: `One of your listings titled ${listings[otherListingId].title} has been resolved by ${userData?.preferences?.name}`,
        type: NotificationType.resolve,
      });

      // Send notification to the current user
      await addNotification({
        userId: currentUserId,
        title: 'Listing Resolved',
        message: `Your listing titled ${listings[currentListingId].title} has been resolved`,
        type: NotificationType.resolve,
      });

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      showCustomToast({
        title: 'Error',
        description: 'Failed to resolve listing',
        color: 'danger',
      });
      console.error('[ResolvePage]: Error resolving listing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsWebcamReady(true);
    const currentWebcam = webcamRef.current;

    return () => {
      // Cleanup function to stop all media tracks when component unmounts
      if (currentWebcam && currentWebcam.video) {
        const stream = currentWebcam.video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      }
      setIsWebcamReady(false);
    };
  }, []);

  // Function to reinitialize the Webcam component
  const reinitializeWebcam = useCallback(() => {
    setIsWebcamReady(false);
    setTimeout(() => setIsWebcamReady(true), 0);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        reinitializeWebcam();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [reinitializeWebcam]);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className='flex flex-col items-center justify-center h-screen'>
        <p className='text-xl font-semibold mb-4'>{error || 'An error occurred'}</p>
        <button
          onClick={() => navigate('/')}
          className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
          data-testid='back-button'>
          <ArrowLeftIcon className='h-5 w-5 mr-2 stroke-2' />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className='bg-white p-4'>
      <div>
        <div className='mb-4'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center'>
              <button
                onClick={() => navigate('/inbox')}
                className='p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors'
                data-testid='back-button'>
                <ArrowLeftIcon className='h-6 w-6 text-gray-600 stroke-2' />
              </button>
              <h1 className='text-xl font-semibold ml-4'>Resolve Listing</h1>
            </div>
          </div>
        </div>

        {/* Info About Resolving */}
        <div className='bg-gray-100 rounded-lg p-4 mb-4'>
          <h2 className='font-semibold mb-2'>Why Take a Photo?</h2>
          <p className='text-sm text-gray-700 mb-2'>
            Taking a photo helps verify the identity of the person claiming the item and provides a
            record of the item being returned.
          </p>
        </div>

        {/* Match Card Toggle View */}
        <div>
          <button
            onClick={() => setIsMatchCardOpen(!isMatchCardOpen)}
            className='w-full flex justify-between items-center py-3 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors'>
            <span className='font-semibold'>View Match</span>
            {isMatchCardOpen ? (
              <ChevronUpIcon className='h-5 w-5 stroke-2' />
            ) : (
              <ChevronDownIcon className='h-5 w-5 stroke-2' />
            )}
          </button>
          <div
            className={`transition-all duration-300 ease-in-out ${
              isMatchCardOpen
                ? 'mt-2 max-h-[1000px] opacity-100'
                : 'mt-0 max-h-0 opacity-0 overflow-hidden'
            }`}>
            {match && <MatchCard match={match} showActions={false} />}
          </div>
        </div>

        <div className='mt-4'>
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className='w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'>
              <CameraIcon className='h-5 w-5 mr-2 stroke-2' />
              Start Camera
            </button>
          ) : (
            <div
              ref={webcamContainerRef}
              className='rounded-md overflow-hidden mb-4 border border-gray-200 relative'
              style={{ aspectRatio: '1 / 1' }}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat='image/jpeg'
                width='100%'
                height='100%'
                videoConstraints={{
                  deviceId: cameras[currentCameraIndex]?.deviceId,
                  aspectRatio: 1,
                }}
                style={{ objectFit: 'cover' }}
              />
              {cameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  className='absolute bottom-2 right-2 p-2 bg-white/20 text-white rounded-full'>
                  <ArrowPathIcon className='h-6 w-6 stroke-2' />
                </button>
              )}
            </div>
          )}
          {isCameraActive && (
            <button
              onClick={capture}
              disabled={!isWebcamReady}
              className='w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'>
              <CameraIcon className='h-5 w-5 mr-2 stroke-2' />
              Capture Photo
            </button>
          )}
        </div>

        {imgSrc && (
          <div className='mt-4'>
            <h2 className='text-lg font-semibold mb-4'>Preview</h2>
            <img src={imgSrc} alt='captured' className='rounded-md mb-4 border border-gray-200' />
            <button
              onClick={uploadImage}
              className='w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-blue-700 transition-colors'>
              <CheckIcon className='h-5 w-5 mr-2 stroke-[2.5]' />
              Resolve Listing
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResolvePage;

// Helper function to convert data URI to Blob
function dataURIToBlob(dataURI: string): Blob {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}
