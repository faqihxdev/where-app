import React, { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { useSetAtom } from 'jotai';
import { Box, Button, VStack, Image, useToast, Center } from '@chakra-ui/react';
import { addImageAtom } from '../../src/stores/imageStore';
import { updateListingAtom, fetchListingByIdAtom, fetchListingByIdAtom } from '../../src/stores/listingStore';


var listing1 = "ajfoafjojfaofj";
var listing2 = "fwjofjwofwjofw";
const addImage = useSetAtom(addImageAtom);
const updateListing = useSetAtom(updateListingAtom);
const fetchListingById = useSetAtom(fetchListingByIdAtom);


const WebcamCapture: React.FC = () => {

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
      // Interface with firebase
      const response = await fetch(imgSrc);



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
              Upload Image
            </Button>
          </Box>
        )}
      </VStack>
    </Center>
  );
};

export default WebcamCapture;
