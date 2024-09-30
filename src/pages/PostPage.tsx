import React, { useState, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';

import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  IconButton,
  Button,
} from '@chakra-ui/react';

import { PlusIcon, TrashIcon, ClipboardDocumentIcon, PhotoIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { addListingAtom } from '../stores/listingStore';
import { showCustomToast } from '../components/CustomToast';
import { Listing, ListingCategory, ListingStatus, Marker } from '../types';
import { userDataAtom } from '../stores/userStore';
import { compressImage } from '../stores/imageStore';
import MapSelector from '../components/map/MapSelector';

const PostPage: React.FC = () => {
  
  interface PostFormError {
    [key: string]: string;
  }

  const userData = useAtomValue(userDataAtom);
  const addListing = useSetAtom(addListingAtom);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<'lost' | 'found'>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ListingCategory>(ListingCategory.OTHER);
  const [images, setImages] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  const [markers, setMarkers] = useState<Omit<Marker, 'id' | 'listingId'>[]>([]);

  const [errors, setErrors] = useState<PostFormError>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateField = (field: string, value: string | File[] | null): string => {
    switch (field) {
      case 'title':
        return value && (value as string).length >= 3 ? '' : 'Title must be at least 3 characters long';
      case 'description':
        return value && (value as string).length >= 10 ? '' : 'Description must be at least 10 characters long';
      case 'images':
        if (!value || (value as File[]).length === 0) return 'At least one image is required';
        if ((value as File[]).some(img => img.size > (1024 * 1024) * 3)) return 'Each image must be less than 3 MB';
        return '';
      case 'locationName':
        return value ? '' : 'Location name is required';
      case 'latitude': {
        console.log(value);
        const lat = parseFloat(value as string);
        return isNaN(lat) || lat < -90 || lat > 90 ? 'Invalid latitude (-90 to 90)' : '';
      }
      case 'longitude': {
        console.log(value);
        const lon = parseFloat(value as string);
        return isNaN(lon) || lon < -180 || lon > 180 ? 'Invalid longitude (-180 to 180)' : '';
      }     
      default:
        return '';
    }
  };

  const handleBlur = (field: string, value: string | File[] | null) => {
    if (field !== 'images') {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 3) {
      showCustomToast({
        title: 'Error',
        description: 'You can upload a maximum of 3 images.',
        color: 'danger',
      });
      return;
    }

    try {
      const compressedFiles = await Promise.all(files.map(file => compressImage(file)));
      setImages(prev => [...prev, ...compressedFiles]);
      setErrors(prev => ({ ...prev, images: '' }));
      
      compressedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagesPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('[PostPage/handleImageChange]: ', error);
      showCustomToast({
        title: 'Error',
        description: 'Failed to process images. Please try again.',
        color: 'danger',
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagesPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationsChange = (newMarkers: Omit<Marker, 'id' | 'listingId'>[]) => {
    setMarkers(newMarkers);
  };

  const validateForm = (): boolean => {
    const newErrors: PostFormError = {
      title: validateField('title', title),
      description: validateField('description', description),
      images: validateField('images', images),
    };

    markers.forEach((loc, index) => {
      newErrors[`location${index}_name`] = validateField('locationName', loc.name);
      newErrors[`location${index}_latitude`] = validateField('latitude', loc.latitude.toString());
      newErrors[`location${index}_longitude`] = validateField('longitude', loc.longitude.toString());
    });

    setErrors(newErrors);
    console.log(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);

      const newListing: Omit<Listing, 'id' | 'images' | 'markers'> = {
        type: type,
        userId: userData!.uid,
        title: title,
        description: description,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: ListingStatus.ACTIVE,
        category: category,
      };

      const newMarkers: Omit<Marker, 'id' | 'listingId'>[] = markers.map(marker => ({
        name: marker.name,
        latitude: marker.latitude,
        longitude: marker.longitude,
        radius: marker.radius,
      }));

      await addListing({ newListing, imageFiles: images, markers: newMarkers });

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
    <div className="min-h-full bg-white p-4">
      <h1 className="text-xl font-semibold mb-4">Create a New Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Item Details */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-4 text-blue-600">
            <ClipboardDocumentIcon className="w-5 h-5 mr-2 stroke-2" />
            <h1 className="font-semibold">Item Details</h1>
          </div>
          <VStack align="stretch" spacing={3}>
            <FormControl>
              <FormLabel>Listing Type</FormLabel>
              <div className="flex rounded-md bg-gray-100 p-1.5" role="group">
                <button
                  type="button"
                  className={`flex-1 py-1 font-medium rounded-md ${
                    type === 'lost'
                      ? "text-gray-950 bg-white"
                      : "text-gray-700 bg-transparent hover:bg-white/50 hover:text-gray-950"
                  }`}
                  onClick={() => setType('lost')}
                >
                  Lost
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1 font-medium rounded-md ${
                    type === 'found'
                      ? "text-gray-950 bg-white"
                      : "text-gray-700 bg-transparent hover:bg-white/50 hover:text-gray-950"
                  }`}
                  onClick={() => setType('found')}
                >
                  Found
                </button>
              </div>
            </FormControl>

            <FormControl isInvalid={!!errors.title}>
              <FormLabel>Title</FormLabel>
              <Input
                rounded="md"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={(e) => handleBlur('title', e.target.value)}
                placeholder="Enter a title for your listing"
                variant="filled"
                bg="gray.100"
              />
              <FormErrorMessage fontSize="xs">{errors.title}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel>Category</FormLabel>
              <Select
                rounded="md"
                value={category} 
                onChange={(e) => setCategory(e.target.value as ListingCategory)}
                variant="filled"
                bg="gray.100"
              >
                {Object.values(ListingCategory).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl isInvalid={!!errors.description}>
              <FormLabel>Description</FormLabel>
              <Textarea
                rounded="md"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={(e) => handleBlur('description', e.target.value)}
                placeholder="Describe the item"
                variant="filled"
                bg="gray.100"
              />
              <FormErrorMessage fontSize="xs">{errors.description}</FormErrorMessage>
            </FormControl>
          </VStack>
        </div>

        {/* Image Upload */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className={`flex justify-between items-center ${imagesPreviews.length > 0 ? 'mb-3' : ''}`}>
            <div className="flex items-center text-blue-600">
              <PhotoIcon className="w-5 h-5 mr-2 stroke-2" />
              <h1 className="font-semibold">Upload Image</h1>
            </div>
            <FormControl className="max-w-fit" isInvalid={!!errors.images}>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple
              />
              <button
                type="button"
                className="bg-blue-600 text-white pl-2 pr-4 py-1 space-x-1 rounded flex items-center justify-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <PlusIcon className="w-4 h-4 ml-1 stroke-[2.5]" />
                <span>Add</span>
              </button>
              <FormErrorMessage fontSize="xs">{errors.images}</FormErrorMessage>
            </FormControl>
          </div>
          <VStack align="stretch" spacing={3}>
            {imagesPreviews.length > 0 && (
              <HStack spacing={3} wrap="wrap">
                {imagesPreviews.map((preview, index) => (
                  <div key={index} className="relative border border-gray-200 rounded-lg overflow-clip">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-20 h-20 object-cover" />
                    <IconButton
                      aria-label="Remove image"
                      icon={<TrashIcon className="h-3 w-3 stroke-[2]" />}
                      size="xs"
                      position="absolute"
                      top={1}
                      right={1}
                      bg="white"
                      onClick={() => removeImage(index)}
                    />
                  </div>
                ))}
              </HStack>
            )}
          </VStack>
        </div>
        
        {/* Item Location */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-4 text-blue-600">
            <MapPinIcon className="w-5 h-5 mr-2 stroke-2" />
            <h1 className="font-semibold">Location</h1>
          </div>
          <MapSelector
            mode="create"
            onMarkersChange={handleLocationsChange}
            maxMarkers={3}
            initialMarkers={markers}
          />
        </div>
        
        <Button type="submit" isLoading={isLoading} loadingText="Creating Listing..." w="full" fontWeight="medium" bg="primary.600" color="white" _hover={{ bg: 'primary.700' }} _active={{ bg: 'primary.800' }}>
          Create Listing
        </Button>
      </form>
    </div>
  );
};

export default PostPage;