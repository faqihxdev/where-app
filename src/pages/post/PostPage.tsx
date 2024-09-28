import React, { useState, useRef } from 'react';
import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Select,
  Radio,
  RadioGroup,
  Stack,
  VStack,
  HStack,
  Box,
  IconButton,
} from '@chakra-ui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { addListingAtom } from '../../stores/listingStore';
import { showCustomToast } from '../../components/CustomToast';
import { ListingCategory, ListingStatus, ListingLocation } from '../../types';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

const PostPage: React.FC = () => {
  
  interface PostFormError {
    [key: string]: string;
  }

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

  const validateField = (field: string, value: string | File | null): string => {
    switch (field) {
      case 'title':
        return value && (value as string).length >= 3 ? '' : 'Title must be at least 3 characters long';
      case 'description':
        return value && (value as string).length >= 10 ? '' : 'Description must be at least 10 characters long';
      case 'locationName':
        return value ? '' : 'Location name is required';
      case 'latitude':
        return /^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}$/.test(value as string) ? '' : 'Invalid latitude';
      case 'longitude':
        return /^-?(([-+]?)([\d]{1,3})((\.)(\d+))?)$/.test(value as string) ? '' : 'Invalid longitude';
      case 'images':
        if (images.length === 0) return 'At least one image is required';
        if (images.some(img => img.size > 1024 * 1024)) return 'Each image must be less than 1 MB';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string, value: string | File | null) => {
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 3) {
      showCustomToast({
        title: 'Error',
        description: 'You can upload a maximum of 3 images.',
        bgColor: 'bg-red-500',
      });
      return;
    }
    setImages(prev => [...prev, ...files]);
    handleBlur('images', files[0]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagesPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
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
      images: validateField('images', images[0]),
    };
    locations.forEach((loc, index) => {
      newErrors[`location${index}`] = validateField('locationName', loc.name) ||
        validateField('latitude', loc.latitude.toString()) ||
        validateField('longitude', loc.longitude.toString());
    });
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      // In a real application, you would upload the images to a storage service
      // and get URLs back. For this example, we'll use placeholder URLs.
      const imageUrls = images.map(() => 'https://picsum.photos/720');

      await addListing({
        type,
        userId: 'currentUserId', // Replace with actual user ID
        title,
        description,
        images: imageUrls,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        locations,
        status: ListingStatus.ACTIVE,
        category,
      });

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
      <h1 className="text-xl font-bold mb-4">Create a New Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Box className="bg-gray-50/50 border border-gray-200 rounded-lg p-4">
          <h1 className="font-bold mb-3">Item Details</h1>
          <VStack align="stretch" spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm">Listing Type</FormLabel>
              <RadioGroup value={type} onChange={(value: "lost" | "found") => setType(value)}>
                <Stack direction="row">
                  <Radio value="lost" size="sm">Lost Item</Radio>
                  <Radio value="found" size="sm">Found Item</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>

            <FormControl isInvalid={!!errors.title}>
              <FormLabel fontSize="sm">Title</FormLabel>
              <Input
                size="sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={(e) => handleBlur('title', e.target.value)}
                placeholder="Enter a title for your listing"
                bg="white"
              />
              <FormErrorMessage fontSize="xs">{errors.title}</FormErrorMessage>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Category</FormLabel>
              <Select 
                size="sm" 
                value={category} 
                onChange={(e) => setCategory(e.target.value as ListingCategory)}
                bg="white"
              >
                {Object.values(ListingCategory).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl isInvalid={!!errors.description}>
              <FormLabel fontSize="sm">Description</FormLabel>
              <Textarea
                size="sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={(e) => handleBlur('description', e.target.value)}
                placeholder="Describe the item"
                bg="white"
              />
              <FormErrorMessage fontSize="xs">{errors.description}</FormErrorMessage>
            </FormControl>
          </VStack>
        </Box>

        <Box className="bg-gray-50/50 border border-gray-200 rounded-lg p-4">
          <h1 className="font-bold mb-3">Upload Image</h1>
          <VStack align="stretch" spacing={3}>
            <FormControl isInvalid={!!errors.images}>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple
              />
              <button
                className="bg-gray-200 text-sm px-2 py-2 space-x-1 rounded flex items-center font-semibold"
                onClick={() => fileInputRef.current?.click()}
              >
                <DocumentArrowUpIcon className="w-4 h-4 ml-1 stroke-[2.5]" />
                <span>Upload Images</span>
              </button>
              <FormErrorMessage fontSize="xs">{errors.images}</FormErrorMessage>
            </FormControl>

            {imagesPreviews.length > 0 && (
              <HStack spacing={3} wrap="wrap">
                {imagesPreviews.map((preview, index) => (
                  <Box key={index} position="relative">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-20 h-20 object-cover" />
                    <IconButton
                      aria-label="Remove image"
                      icon={<TrashIcon className="h-3 w-3" />}
                      size="xs"
                      position="absolute"
                      top={0}
                      right={0}
                      onClick={() => removeImage(index)}
                    />
                  </Box>
                ))}
              </HStack>
            )}
          </VStack>
        </Box>

        <Box className="bg-gray-50/50 border border-gray-200 rounded-lg p-4">
          <h1 className="font-bold mb-3">Item Location</h1>
          <VStack align="stretch" spacing={3}>
            {locations.map((location, index) => (
              <VStack key={index} spacing={2} align="stretch" mb={3}>
                <FormControl isInvalid={!!errors[`location${index}`]}>
                  <Input
                    size="sm"
                    placeholder="Location name"
                    value={location.name}
                    onChange={(e) => handleLocationChange(index, 'name', e.target.value)}
                    onBlur={(e) => handleBlur('locationName', e.target.value)}
                    bg="white"
                  />
                </FormControl>
                <HStack>
                  <FormControl isInvalid={!!errors[`location${index}`]}>
                    <Input
                      size="sm"
                      placeholder="Latitude"
                      value={location.latitude}
                      onChange={(e) => handleLocationChange(index, 'latitude', e.target.value)}
                      onBlur={(e) => handleBlur('latitude', e.target.value)}
                      bg="white"
                    />
                  </FormControl>
                  <FormControl isInvalid={!!errors[`location${index}`]}>
                    <Input
                      size="sm"
                      placeholder="Longitude"
                      value={location.longitude}
                      onChange={(e) => handleLocationChange(index, 'longitude', e.target.value)}
                      onBlur={(e) => handleBlur('longitude', e.target.value)}
                      bg="white"
                    />
                  </FormControl>
                  {index > 0 && (
                    <IconButton
                      aria-label="Remove location"
                      icon={<TrashIcon className="h-4 w-4" />}
                      size="sm"
                      onClick={() => removeLocation(index)}
                    />
                  )}
                </HStack>
                <FormErrorMessage fontSize="xs">{errors[`location${index}`]}</FormErrorMessage>
              </VStack>
            ))}
            {locations.length < 3 && (
              <button
                className="bg-gray-200 text-sm px-2 py-2 space-x-1 rounded flex items-center justify-center font-semibold"
                onClick={addLocation}
              >
                <PlusIcon className="w-4 h-4 ml-1 stroke-[2.5]" />
                <span>Add Location</span>
              </button>
            )}
          </VStack>
        </Box>

        <Button type="submit" colorScheme="blue" width="full" mt={4} size="sm">
          Create Listing
        </Button>
      </form>
    </div>
  );
};

export default PostPage;