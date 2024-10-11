import React, { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { useSetAtom } from 'jotai';
import { Box, Button, VStack, Image, useToast, Center, Heading } from '@chakra-ui/react';
import { addImageAtom } from '../../src/stores/imageStore';
import { updateListingAtom, fetchListingByIdAtom } from '../../src/stores/listingStore';
import { updateMatchAtom, fetchMatchesByUserAtom } from '../stores/matchStore';
import { useParams } from 'react-router-dom';
import { Match, MatchStatus, Listing, ListingStatus } from '../types';
import { fetchListingUserAtom } from '../stores/userStore';

const WebcamCapture: React.FC = () => {
  // ID in the form of /resolve/ID1/ID2
  // perform different action if ID1 is finder or seeker
  // for now we leave this hardcoded first.
  // const { id1, id2 } = useParams<{ id1: string; id2: string }>();
  const id1 = `F1jpCBMxNjcgdxbu4oag`; // type: lost, seeker
  const id2 = `enmFa25CV7RvJPmnORII`; // type: found, finder

  // boilerplate
  const fetchMatchesByUser = useSetAtom(fetchMatchesByUserAtom);
  const updateMatch = useSetAtom(updateMatchAtom);
  // const addImage = useSetAtom(addImageAtom);
  const updateListing = useSetAtom(updateListingAtom);
  const fetchListingById = useSetAtom(fetchListingByIdAtom);

  // require finders to take a picture
  // get listing and match first
  const listing = fetchListingById(id1).then((Listing) => Listing);
  const matches = fetchMatchesByUser(listing.userId);
  const match = Object.values(matches).find(
    (match) => match.listingId1 === id2 || match.listingId2 === id2
  );

  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const toast = useToast();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const uploadImage = async () => {
    if (!imgSrc) {
      toast({
        title: 'No image captured',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Update the match status to resolved
      const updatedMatch = {
        status: MatchStatus.resolved,
        updatedAt: new Date(),
      };
      updateMatch(match.id, updatedMatch);

      // Convert B64 to a File object
      function dataURIToBlob(dataURI: string) {
        dataURI = dataURI.replace(/^data:/, '');

        const type = dataURI.match(/image\/[^;]+/)[0];
        const base64 = dataURI.replace(/^[^,]+,/, '');
        const arrayBuffer = new ArrayBuffer(base64.length);
        const typedArray = new Uint8Array(arrayBuffer);

        for (let i = 0; i < base64.length; i++) {
          typedArray[i] = base64.charCodeAt(i);
        }

        return new Blob([arrayBuffer], { type });
      }
      const file = new File([dataURIToBlob(imgSrc)], 'resolve', { type: 'image/jpeg' }); // how to make this more resilient to other types
      const imageUpdates = {
        main: {
          action: 'add' as const,
          file: file,
        },
      };
      // Create updated Partial<Listing> object with image
      const updatedListing: Listing = {
        ...listing,
        status: ListingStatus.resolved,
      };

      updateListing({
        updatedListing: updatedListing,
        imageUpdates: imageUpdates,
      });

      toast({
        title: 'Image uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading the image.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Center h='100vh'>
      <VStack spacing={4}>
        <Heading>Take a picture with you and the item!</Heading>
        <Box boxShadow='md' p={4} borderRadius='md'>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat='image/jpeg'
            width={640}
            height={480}
          />
        </Box>
        <Button colorScheme='blue' onClick={capture}>
          Capture photo
        </Button>
        {imgSrc && (
          <Box>
            <Image src={imgSrc} alt='captured' boxSize='300px' objectFit='cover' />
            <Button colorScheme='green' mt={2} onClick={uploadImage}>
              Resolve Listing
            </Button>
          </Box>
        )}
      </VStack>
    </Center>
  );
};

export default WebcamCapture;
