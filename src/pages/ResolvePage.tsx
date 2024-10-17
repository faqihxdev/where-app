import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useSetAtom, useAtomValue } from 'jotai';
import { updateListingAtom, listingsAtom } from '../stores/listingStore';
import { updateMatchAtom, matchesAtom, fetchMatchByIdAtom } from '../stores/matchStore';
import { Match, MatchStatus, Listing, ListingStatus } from '../types';
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { showCustomToast } from '../components/CustomToast';
import MatchCard from '../components/MatchCard';

const ResolvePage: React.FC = () => {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const updateListing = useSetAtom(updateListingAtom);
  const updateMatch = useSetAtom(updateMatchAtom);
  const fetchMatchById = useSetAtom(fetchMatchByIdAtom);
  const matches = useAtomValue(matchesAtom);
  const listings = useAtomValue(listingsAtom);

  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const [isMatchCardOpen, setIsMatchCardOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!matchId) return;

    setIsLoading(true);
    setError(null);

    try {
      let fetchedMatch = matches[matchId];
      if (!fetchedMatch) {
        fetchedMatch = await fetchMatchById(matchId);
      }
      if (!fetchedMatch) {
        throw new Error('Match not found');
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
      await updateMatch(match.id, {
        status: MatchStatus.resolved,
        updatedAt: new Date(),
      });

      const imageUpdates = {
        alt1: {
          action: 'add' as const,
          file: imgFile,
        },
      };

      const listing = listings[match.listingId1] || listings[match.listingId2];
      if (!listing) {
        throw new Error('Listing not found');
      }

      const updatedListing: Listing = {
        ...listing,
        status: ListingStatus.resolved,
      };

      await updateListing({
        updatedListing: updatedListing,
        imageUpdates: imageUpdates,
      });

      showCustomToast({
        title: 'Success',
        description: 'Listing resolved successfully',
        color: 'success',
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
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className='flex flex-col items-center justify-center h-screen'>
        <p className='text-xl font-bold mb-4'>{error || 'An error occurred'}</p>
        <button
          onClick={() => navigate('/')}
          className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'>
          <ArrowLeftIcon className='h-5 w-5 mr-2' />
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
                className='p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors'>
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
          <div className='rounded-md overflow-hidden mb-4 border border-gray-200'>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat='image/jpeg'
              width='100%'
              height='auto'
            />
          </div>
          <button
            onClick={capture}
            className='w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'>
            <CameraIcon className='h-5 w-5 mr-2 stroke-2' />
            Capture Photo
          </button>
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
