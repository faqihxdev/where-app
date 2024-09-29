import React, { useState, useRef } from 'react';
import { useAtom } from 'jotai';
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
} from '@chakra-ui/react';

import { PlusIcon, TrashIcon, ClipboardDocumentIcon, PhotoIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { addListingAtom } from '../stores/listingStore';
import { showCustomToast } from '../components/CustomToast';
import { ListingCategory, Listing, ListingStatus, ListingLocation } from '../types';
import { userDataAtom } from '../stores/userStore';
import { compressImage } from '../utils/imageUtils';

const PostPage: React.FC = () => {
  
  interface PostFormError {
    [key: string]: string;
  }

  const [userData] = useAtom(userDataAtom);
  const [, addListing] = useAtom(addListingAtom);
  const navigate = useNavigate();

  const [type, setType] = useState<'lost' | 'found'>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ListingCategory>(ListingCategory.OTHER);
  const [locations, setLocations] = useState<ListingLocation[]>([{ name: '', latitude: 0, longitude: 0 }]);
  const [images, setImages] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);

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
      case 'latitude':
        return value ? (/^-?([1-8]?\d(\.\d{1,6})?|90(\.0{1,6})?)$/.test(value as string) ? '' : 'Invalid latitude (-90 to 90)') : '';
      case 'longitude':
        return value ? (/^-?((1[0-7]\d|[1-9]?\d)(\.\d{1,6})?|180(\.0{1,6})?)$/.test(value as string) ? '' : 'Invalid longitude (-180 to 180)') : '';
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
        bgColor: 'bg-red-500',
      });
      return;
    }

    try {
      const compressedFiles = await Promise.all(files.map(file => compressImage(file)));
      setImages(prev => [...prev, ...compressedFiles]);
      setErrors(prev => ({ ...prev, images: '' })); // Clear any previous image errors
      
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
        bgColor: 'bg-red-500',
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagesPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationChange = (index: number, field: keyof ListingLocation, value: string) => {
    const newLocations = [...locations];
    if (field === 'latitude' || field === 'longitude') {
      newLocations[index][field] = parseFloat(value);
    } else {
      newLocations[index][field] = value;
    }
    setLocations(newLocations);

    // Clear the error for this specific field
    setErrors(prev => ({
      ...prev,
      [`location${index}_${field}`]: ''
    }));
  };

  const handleLocationBlur = (index: number, field: keyof ListingLocation, value: string) => {
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [`location${index}_${field}`]: error
    }));
  };

  const addLocation = () => {
    setLocations(prev => [...prev, { name: '', latitude: 0, longitude: 0 }]);
  };

  const removeLocation = (index: number) => {
    setLocations(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: PostFormError = {
      title: validateField('title', title),
      description: validateField('description', description),
      images: validateField('images', images),
    };

    locations.forEach((loc, index) => {
      newErrors[`location${index}_name`] = validateField('locationName', loc.name);
      newErrors[`location${index}_latitude`] = validateField('latitude', loc.latitude.toString());
      newErrors[`location${index}_longitude`] = validateField('longitude', loc.longitude.toString());
    });

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {

      const listing: Omit<Listing, 'id' | 'images'> & { images: File[] } = {
        type: type,
        userId: userData!.uid,
        title: title,
        description: description,
        images: images,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        locations: locations,
        status: ListingStatus.ACTIVE,
        category: category,
      }

      await addListing(listing);

      showCustomToast({
        title: 'Listing Created',
        description: 'Your listing has been successfully created.',
        bgColor: 'bg-green-500',
      });
      navigate('/');
    } catch (error) {
      console.error('[PostPage/handleSubmit]: ', error);
      showCustomToast({
        title: 'Error',
        description: 'Failed to create listing. Please try again.',
        bgColor: 'bg-red-500',
      });
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
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-blue-600">
              <MapPinIcon className="w-5 h-5 mr-2 stroke-2" />
              <h1 className="font-semibold">Location</h1>
            </div>
            {locations.length < 3 && (
              <button
                type="button"
                className="bg-blue-600 text-white pl-2 pr-4 py-1 space-x-1 rounded flex items-center justify-center"
                onClick={addLocation}
              >
                <PlusIcon className="w-4 h-4 ml-1 stroke-[2.5]" />
                <span>Add</span>
              </button>
            )}
          </div>
          <VStack align="stretch" spacing={3}>
            {locations.map((location, index) => (
              <VStack key={index} spacing={2} align="stretch" mb={3}>
                <FormControl isInvalid={!!errors[`location${index}_name`]}>
                  <Input
                    rounded="md"
                    placeholder="Location name"
                    value={location.name}
                    onChange={(e) => handleLocationChange(index, 'name', e.target.value)}
                    onBlur={(e) => handleLocationBlur(index, 'name', e.target.value)}
                    variant="filled"
                    bg="gray.100"
                  />
                  <FormErrorMessage fontSize="xs">{errors[`location${index}_name`]}</FormErrorMessage>
                </FormControl>
                <HStack>
                  <FormControl isInvalid={!!errors[`location${index}_latitude`]}>
                    <Input
                      type="text"
                      rounded="md"
                      placeholder="Latitude"
                      value={location.latitude}
                      onChange={(e) => handleLocationChange(index, 'latitude', e.target.value)}
                      onBlur={(e) => handleLocationBlur(index, 'latitude', e.target.value)}
                      variant="filled"
                      bg="gray.100"
                    />
                    <FormErrorMessage fontSize="xs">{errors[`location${index}_latitude`]}</FormErrorMessage>
                  </FormControl>
                  <FormControl isInvalid={!!errors[`location${index}_longitude`]}>
                    <Input
                      type="text"
                      rounded="md"
                      placeholder="Longitude"
                      value={location.longitude}
                      onChange={(e) => handleLocationChange(index, 'longitude', e.target.value)}
                      onBlur={(e) => handleLocationBlur(index, 'longitude', e.target.value)}
                      variant="filled"
                      bg="gray.100"
                    />
                    <FormErrorMessage fontSize="xs">{errors[`location${index}_longitude`]}</FormErrorMessage>
                  </FormControl>
                  {index > 0 && (
                    <IconButton
                      aria-label="Remove location"
                      icon={<TrashIcon className="h-4 w-4" />}
                      onClick={() => removeLocation(index)}
                    />
                  )}
                </HStack>
              </VStack>
            ))}
          </VStack>
        </div>

        <button type="submit" className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-150 ease-in-out">
          Create Listing
        </button>
      </form>
    </div>
  );
};

export default PostPage;