import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useSetAtom, useAtomValue } from 'jotai';
import { Box, Button, VStack, Image, useToast, Center, Heading } from '@chakra-ui/react';
import {
  updateListingAtom,
  fetchListingByIdAtom,
  listingsAtom,
} from '../../src/stores/listingStore';
import { updateMatchAtom, fetchMatchesByUserAtom } from '../stores/matchStore';
import { useParams } from 'react-router-dom';
import { Match, MatchStatus, Listing, ListingStatus } from '../types';

const WebcamCapture: React.FC = () => {
  const navigate = useNavigate();
  const { id1, id2 } = useParams<{ id1: string; id2: string }>();
  console.log(id1, id2);
  // boilerplate
  const fetchMatchesByUser = useSetAtom(fetchMatchesByUserAtom);
  const updateMatch = useSetAtom(updateMatchAtom);
  const updateListing = useSetAtom(updateListingAtom);
  const fetchListingById = useSetAtom(fetchListingByIdAtom);
  const [listing, setListing] = useState<Listing | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const listings = useAtomValue(listingsAtom);

  // TODO: limit to only finders taking picture
  // get listing and match first
  const fetchListingData = useCallback(async () => {
    if (!id1) return;

    try {
      if (!listings[id1]) {
        await fetchListingById(id1);
      }
      const fetchedListing = listings[id1];
      if (fetchedListing) {
        setListing(fetchedListing);
      } else {
        console.error('Listing not found');
        // Handle the case when listing is not found
      }
    } catch (error) {
      console.error('Error fetching listing data:', error);
      // Handle the error
    }
  }, [id1, listings, fetchListingById]);

  useEffect(() => {
    fetchListingData();
  }, [fetchListingData]);

  const fetchMatchesData = useCallback(async () => {
    if (!listing) return;

    try {
      const fetchedMatches = await fetchMatchesByUser(listing.userId);
      setMatches(fetchedMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
      // Handle the error
    }
  }, [listing, fetchMatchesByUser]);

  useEffect(() => {
    if (listing) {
      fetchMatchesData();
    }
  }, [listing, fetchMatchesData]);
  // console.log(`listing = ${JSON.stringify(listing)}`);
  // console.log(`matches = ${JSON.stringify(matches)}`);
  const match = Object.values(matches).find(
    (match) => match.listingId1 === id2 || match.listingId2 === id2
  );
  console.log(`match = ${JSON.stringify(match)}`);

  const webcamRef = useRef<Webcam>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null); // solely for previewing the image
  const toast = useToast();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      // Convert B64 to a File object
      function dataURIToBlob(dataURI: string): Blob {
        // Split the data URI to extract the MIME type and the base64 data
        const [typeInfo, base64] = dataURI.split(',');

        // Extract the MIME type
        const mimeMatch = typeInfo.match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

        // Decode the base64 data
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Create and return the Blob with the correct MIME type
        return new Blob([bytes], { type: mime });
      }
      function createFileFromDataURI(dataURI: string, fileName: string): File {
        const blob = dataURIToBlob(dataURI);
        return new File([blob], fileName, { type: blob.type });
      }
      const file = createFileFromDataURI(imageSrc, 'image.jpg');
      setImgFile(file);
      setImgSrc(imageSrc);
      console.log(imageSrc); // copy into base64 decoder to check
    }
  }, [webcamRef]);

  const uploadImage = async () => {
    if (!imgFile) {
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
      try {
        updateMatch(match.id, updatedMatch);
      } catch (error) {
        console.log(error);
      }

      const imageUpdates = {
        alt1: {
          action: 'add' as const,
          file: imgFile,
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

      console.log('listing updated');

      toast({
        title: 'Image uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setTimeout(() => {
        navigate('/');
      }, 3500); // Delay slightly longer than the toast duration
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading the image.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.log(error);
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
        {imgFile && (
          <Box>
            <Image src={imgSrc} alt='captured' boxSize='300px' objectFit='cover' />
            <Center mt={2}>
              <Button colorScheme='green' mt={2} onClick={uploadImage}>
                Resolve Listing
              </Button>
            </Center>
          </Box>
        )}
      </VStack>
    </Center>
  );
};

export default WebcamCapture;
