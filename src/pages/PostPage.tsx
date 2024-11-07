import React, { useState } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { useNavigate } from 'react-router-dom';

import { addListingAtom } from '../stores/listingStore';
import { showCustomToast } from '../components/CustomToast';
import { Listing, Marker, ImageType } from '../types';
import ListingForm from '../components/ListingForm';
import { userDataAtom } from '../stores/userStore';

const PostPage: React.FC = () => {
  const addListing = useSetAtom(addListingAtom);
  const userData = useAtomValue(userDataAtom);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    formData: Omit<Listing, 'id' | 'images' | 'markers'>,
    imageUpdates: { [key in ImageType]?: { action: 'add' | 'delete' | 'keep'; file?: File } },
    markers: Omit<Marker, 'id' | 'listingId'>[]
  ) => {
    if (!userData) {
      showCustomToast({
        title: 'Error',
        description: 'You must be logged in to create a listing.',
        color: 'danger',
      });
      return;
    }

    try {
      setIsLoading(true);
      const newListing: Omit<Listing, 'id' | 'images' | 'markers'> = {
        ...formData,
        userId: userData.uid,
      };

      const imageFiles: File[] = Object.values(imageUpdates)
        .filter(
          (update): update is { action: 'add'; file: File } =>
            update.action === 'add' && !!update.file
        )
        .map((update) => update.file);

      // If there are no image files and no markers, throw an error
      if (imageFiles.length === 0 || markers.length === 0) {
        throw new Error('No image files or markers provided');
      }

      await addListing({ newListing, imageFiles, markers });
      showCustomToast({
        title: 'Listing Created',
        description: 'Your listing has been successfully created.',
        color: 'success',
      });
      navigate('/');
    } catch (error) {
      console.error('[PostPage/handleSubmit]: ', error);
      showCustomToast({
        title: 'Error',
        description: 'Failed to create listing. Please try again.',
        color: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-full bg-white p-4'>
      <h1 className='text-xl font-semibold mb-4'>Create a New Listing</h1>
      <ListingForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
};

export default PostPage;
