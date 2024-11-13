import React, { useState, useRef, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  Button,
} from '@chakra-ui/react';
import {
  PlusIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  PhotoIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { showCustomToast } from './CustomToast';
import { Listing, ListingCategory, ListingStatus, Marker, ImageType } from '../types';
import { compressImage } from '../stores/imageStore';
import MapSelector from './MapSelector';

interface ListingFormProps {
  initialData?: Partial<Listing>;
  onSubmit: (
    formData: Omit<Listing, 'id' | 'images' | 'markers'>,
    imageUpdates: { [key in ImageType]?: { action: 'add' | 'delete' | 'keep'; file?: File } },
    markers: Omit<Marker, 'id' | 'listingId'>[]
  ) => Promise<void>;
  isLoading: boolean;
}

interface ListingFormError {
  [key: string]: string;
}

interface MarkerError {
  name?: string;
  radius?: string;
}

interface MarkerErrors {
  [index: number]: MarkerError;
}

const ListingForm: React.FC<ListingFormProps> = ({ initialData, onSubmit, isLoading }) => {
  const [type, setType] = useState<'lost' | 'found'>(initialData?.type || 'lost');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<ListingCategory>(
    initialData?.category || ListingCategory.other
  );
  const [status, setStatus] = useState<ListingStatus>(initialData?.status || ListingStatus.active);
  const [images, setImages] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  const [markers, setMarkers] = useState<Omit<Marker, 'id' | 'listingId'>[]>(
    initialData?.markers?.map((m) => ({
      name: m.name,
      latitude: m.latitude,
      longitude: m.longitude,
      radius: m.radius,
    })) || []
  );

  const [errors, setErrors] = useState<ListingFormError>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUpdates, setImageUpdates] = useState<{
    [key in ImageType]?: { action: 'add' | 'delete' | 'keep'; file?: File };
  }>({});
  const [markerErrors, setMarkerErrors] = useState<MarkerErrors>({});

  useEffect(() => {
    if (initialData?.images) {
      const previews = [
        initialData.images.main.data,
        initialData.images.alt1?.data,
        initialData.images.alt2?.data,
      ].filter(Boolean) as string[];
      setImagesPreviews(previews);

      // Initialize imageUpdates
      const updates: { [key in ImageType]?: { action: 'keep'; file?: File } } = {};
      if (initialData.images.main.data) updates.main = { action: 'keep' };
      if (initialData.images.alt1?.data) updates.alt1 = { action: 'keep' };
      if (initialData.images.alt2?.data) updates.alt2 = { action: 'keep' };
      setImageUpdates(updates);
    }
  }, [initialData]);

  const validateField = (field: string, value: string | File[] | null): string => {
    switch (field) {
      case 'title':
        if (!value || (value as string).length < 3) {
          return 'Title must be at least 3 characters long';
        }
        if ((value as string).length > 30) {
          return 'Title cannot exceed 30 characters';
        }
        return '';
      case 'description':
        if (!value || (value as string).length < 10) {
          return 'Description must be at least 10 characters long';
        }
        if ((value as string).length > 512) {
          return 'Description cannot exceed 512 characters';
        }
        return '';
      case 'images':
        if ((!value || (value as File[]).length === 0) && imagesPreviews.length === 0) {
          return 'At least one image is required';
        }
        if ((value as File[]).some((img) => img.size > 1024 * 1024 * 3))
          return 'Each image must be less than 3 MB';
        return '';
      case 'locationName':
        return value ? '' : 'Location name is required';
      case 'latitude': {
        const lat = parseFloat(value as string);
        return isNaN(lat) || lat < -90 || lat > 90 ? 'Invalid latitude (-90 to 90)' : '';
      }
      case 'longitude': {
        const lon = parseFloat(value as string);
        return isNaN(lon) || lon < -180 || lon > 180 ? 'Invalid longitude (-180 to 180)' : '';
      }
      default:
        return '';
    }
  };

  const handleBlur = (field: string, value: string | File[] | null) => {
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imagesPreviews.length > 3) {
      showCustomToast({
        title: 'Error',
        description: 'You can upload a maximum of 3 images.',
        color: 'danger',
      });
      return;
    }

    try {
      const compressedFiles = await Promise.all(files.map((file) => compressImage(file)));
      setImages((prev) => [...prev, ...compressedFiles]);
      setErrors((prev) => ({ ...prev, images: '' }));

      compressedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagesPreviews((prev) => [...prev, reader.result as string]);
          const imageType: ImageType = ['main', 'alt1', 'alt2'][
            imagesPreviews.length + index
          ] as ImageType;
          setImageUpdates((prev) => ({
            ...prev,
            [imageType]: { action: 'add', file },
          }));
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('[ListingForm/handleImageChange]: ', error);
      showCustomToast({
        title: 'Error',
        description: 'Failed to process images. Please try again.',
        color: 'danger',
      });
    }
  };

  const removeImage = (index: number) => {
    setImagesPreviews((prev) => prev.filter((_, i) => i !== index));
    const imageType: ImageType = ['main', 'alt1', 'alt2'][index] as ImageType;
    setImageUpdates((prev) => ({
      ...prev,
      [imageType]: { action: 'delete' },
    }));
  };

  const handleMarkersChange = (
    newMarkers: Omit<Marker, 'id' | 'listingId'>[],
    errors?: MarkerErrors
  ) => {
    setMarkers(newMarkers);
    if (errors) {
      setMarkerErrors(errors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ListingFormError = {
      title: validateField('title', title),
      description: validateField('description', description),
      images: validateField('images', images),
    };

    // Check if at least one marker is provided
    if (markers.length === 0) {
      newErrors.location = 'At least one location must be provided';
    }

    // Check if there are any marker input errors
    const hasMarkerErrors = Object.values(markerErrors).some((error) => error.name || error.radius);

    if (hasMarkerErrors) {
      newErrors.location = 'Please fix the errors in location inputs';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      const currentDate = new Date();

      const formData: Omit<Listing, 'id' | 'images' | 'markers'> = {
        type,
        title,
        description,
        category,
        status,
        createdAt: initialData?.createdAt || currentDate,
        updatedAt: currentDate,
        expiresAt: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        userId: initialData?.userId || '',
      };

      await onSubmit(formData, imageUpdates, markers);
    } catch (error) {
      console.error('[ListingForm/handleSubmit]: ', error);
      showCustomToast({
        title: 'Error',
        description: 'Failed to submit listing. Please try again.',
        color: 'danger',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {/* Item Details */}
      <div className='border border-gray-200 rounded-lg p-4'>
        <div className='flex items-center mb-4 text-blue-600'>
          <ClipboardDocumentIcon className='w-5 h-5 mr-2 stroke-2' />
          <h1 className='font-semibold'>Item Details</h1>
        </div>
        <VStack align='stretch' spacing={3}>
          <FormControl>
            <FormLabel>Listing Type</FormLabel>
            <div className='flex rounded-md bg-gray-100 p-1.5' role='group'>
              <button
                type='button'
                className={`flex-1 py-1 font-medium rounded-md ${
                  type === 'lost'
                    ? 'text-gray-950 bg-white'
                    : 'text-gray-700 bg-transparent hover:bg-white/50 hover:text-gray-950'
                }`}
                onClick={() => setType('lost')}>
                Lost
              </button>
              <button
                type='button'
                className={`flex-1 py-1 font-medium rounded-md ${
                  type === 'found'
                    ? 'text-gray-950 bg-white'
                    : 'text-gray-700 bg-transparent hover:bg-white/50 hover:text-gray-950'
                }`}
                onClick={() => setType('found')}>
                Found
              </button>
            </div>
          </FormControl>

          <FormControl isInvalid={!!errors.title}>
            <FormLabel>Title</FormLabel>
            <Input
              rounded='md'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={(e) => handleBlur('title', e.target.value)}
              placeholder='Enter a title for your listing'
              variant='filled'
              bg='gray.100'
            />
            <FormErrorMessage fontSize='xs'>{errors.title}</FormErrorMessage>
          </FormControl>

          <FormControl>
            <FormLabel>Category</FormLabel>
            <Select
              rounded='md'
              value={category}
              onChange={(e) => setCategory(e.target.value as ListingCategory)}
              variant='filled'
              bg='gray.100'>
              {Object.values(ListingCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </FormControl>

          {initialData && (
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select
                rounded='md'
                value={status}
                onChange={(e) => setStatus(e.target.value as ListingStatus)}
                variant='filled'
                bg='gray.100'>
                {Object.values(ListingStatus).map((stat) => (
                  <option key={stat} value={stat}>
                    {stat}
                  </option>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl isInvalid={!!errors.description}>
            <FormLabel>Description</FormLabel>
            <Textarea
              rounded='md'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={(e) => handleBlur('description', e.target.value)}
              placeholder='Enter Details & Contact Info'
              variant='filled'
              bg='gray.100'
            />
            <FormErrorMessage fontSize='xs'>{errors.description}</FormErrorMessage>
          </FormControl>
        </VStack>
      </div>

      {/* Image Upload */}
      <div className='border border-gray-200 rounded-lg p-4'>
        <div
          className={`flex justify-between items-center ${imagesPreviews.length > 0 ? 'mb-3' : ''}`}>
          <div className='flex items-center text-blue-600'>
            <PhotoIcon className='w-5 h-5 mr-2 stroke-2' />
            <h1 className='font-semibold'>Upload Image</h1>
          </div>
          <FormControl className='max-w-fit' isInvalid={!!errors.images}>
            <Input
              type='file'
              accept='image/*'
              onChange={handleImageChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
              multiple
            />
            <Button
              leftIcon={<PlusIcon className='w-4 h-4 stroke-[2.5]' />}
              onClick={() => fileInputRef.current?.click()}
              bg='primary.600'
              color='white'
              fontWeight='medium'
              _hover={{ bg: 'primary.700' }}
              _active={{ bg: 'primary.800' }}
              isDisabled={imagesPreviews.length >= 3}
              aria-label='Add image'>
              Add
            </Button>
          </FormControl>
        </div>
        {errors.images && <div className='text-red-500 text-xs mt-1'>{errors.images}</div>}
        {imagesPreviews.length > 0 && (
          <HStack spacing={3} wrap='wrap'>
            {imagesPreviews.map((preview, index) => (
              <div key={index} className='relative border border-gray-200 rounded-lg'>
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className='w-20 h-20 object-cover rounded-lg'
                />
                <button
                  aria-label='Remove image'
                  className='absolute -top-2 -right-2 p-1 bg-red-600 rounded-full hover:bg-red-700 transition-colors'
                  onClick={() => removeImage(index)}>
                  <XMarkIcon className='h-3 w-3 stroke-[3] text-white' />
                </button>
              </div>
            ))}
          </HStack>
        )}
      </div>

      {/* Item Location */}
      <div className='border border-gray-200 rounded-lg p-4'>
        <div className='flex items-center mb-4 text-blue-600'>
          <MapPinIcon className='w-5 h-5 mr-2 stroke-2' />
          <h1 className='font-semibold'>Location</h1>
        </div>
        {(errors.location || Object.keys(markerErrors).length > 0) && (
          <div className='text-red-500 text-xs text-start mb-4 -mt-2'>
            {errors.location || 'Please fix the errors in location inputs'}
          </div>
        )}
        <MapSelector
          mode={initialData ? 'edit' : 'create'}
          onMarkersChange={handleMarkersChange}
          maxMarkers={3}
          initialMarkers={markers}
        />
      </div>

      <Button
        type='submit'
        isLoading={isLoading}
        loadingText={initialData ? 'Updating Listing...' : 'Creating Listing...'}
        w='full'
        fontWeight='medium'
        bg='primary.600'
        color='white'
        _hover={{ bg: 'primary.700' }}
        _active={{ bg: 'primary.800' }}>
        {initialData ? 'Update Listing' : 'Create Listing'}
      </Button>
    </form>
  );
};

export default ListingForm;
