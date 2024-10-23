import nlp from 'compromise';
import { eng } from 'stopword';
import { Listing } from '../types';
import { PoliceStationFeature } from '../types';

/**
 * @description Checks if two coordinates are within a specified distance of each other and calculates the actual distance
 * @param coord1 The first coordinate object with lat and lng properties
 * @param coord2 The second coordinate object with lat and lng properties
 * @param maxDistance The maximum distance in meters
 * @returns An array containing a boolean indicating whether the coordinates are within the specified distance and the actual distance in meters
 */
export const areCoordinatesWithinDistance = (
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number },
  maxDistance: number
): [boolean, number] => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return [distance <= maxDistance, distance];
};

/**
 * @description Checks if two markers overlap considering an additional buffer
 * @param marker1 The first marker
 * @param marker2 The second marker
 * @param buffer Additional buffer to add to each marker's radius (in meters)
 * @returns True if the markers overlap, false otherwise
 */
export const doMarkersOverlap = (
  marker1: { latitude: number; longitude: number; radius: number },
  marker2: { latitude: number; longitude: number; radius: number },
  buffer: number
): boolean => {
  const [withinDistance] = areCoordinatesWithinDistance(
    { lat: marker1.latitude, lng: marker1.longitude },
    { lat: marker2.latitude, lng: marker2.longitude },
    marker1.radius + marker2.radius + 2 * buffer
  );
  return withinDistance;
};

/**
 * @description Calculates the average marker location for a given listing
 * @param listing The listing object containing markers
 * @returns An array with two numbers representing the average latitude and longitude, or null if no markers exist
 */
export const getAverageMarkerLocation = (listing: Listing): [number, number] | null => {
  if (!listing.markers || listing.markers.length === 0) {
    return null;
  }

  const totalMarkers = listing.markers.length;
  const sum = listing.markers.reduce(
    (acc, marker) => {
      acc[0] += marker.latitude;
      acc[1] += marker.longitude;
      return acc;
    },
    [0, 0]
  );

  return [sum[0] / totalMarkers, sum[1] / totalMarkers];
};

/**
 * @description Performs reverse geocoding to get an address from latitude and longitude
 * @param lat The latitude of the location
 * @param lon The longitude of the location
 * @returns A promise that resolves to a string representing the address or 'Unknown location'
 */
export const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch address');
    }
    const data = await response.json();
    return data.display_name || 'Unknown location';
  } catch (error) {
    console.error('Error fetching address:', error);
    return 'Unknown location';
  }
};

/**
 * @description Computes the cosine similarity between two text strings
 * @param text1 The first text string
 * @param text2 The second text string
 * @returns The cosine similarity between the two text strings
 */
export const cosineSimilarity = (text1: string, text2: string): number => {
  // Common words in app
  const commonWords = ['found', 'lost', 'in', 'at', 'on'];

  // Remove stopwords and tokenize
  const words1 = nlp(text1)
    .terms()
    .out('array')
    .map((word: string) => word.toLowerCase())
    .filter((word: string) => !eng.includes(word))
    .filter((word: string) => !commonWords.includes(word));

  const words2 = nlp(text2)
    .terms()
    .out('array')
    .map((word: string) => word.toLowerCase())
    .filter((word: string) => !eng.includes(word))
    .filter((word: string) => !commonWords.includes(word));

  console.log(words1, words2);

  // Create a combined set of all unique words
  const allWordsSet = new Set([...words1, ...words2]);
  const allWords = Array.from(allWordsSet);

  // Create word frequency vectors
  const freqMap1 = new Map<string, number>();
  const freqMap2 = new Map<string, number>();

  allWords.forEach((word) => {
    freqMap1.set(word, 0);
    freqMap2.set(word, 0);
  });

  words1.forEach((word: string) => {
    freqMap1.set(word, (freqMap1.get(word) || 0) + 1);
  });

  words2.forEach((word: string) => {
    freqMap2.set(word, (freqMap2.get(word) || 0) + 1);
  });

  // Compute dot product and magnitudes
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  allWords.forEach((word) => {
    const val1 = freqMap1.get(word) || 0;
    const val2 = freqMap2.get(word) || 0;

    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  });

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  // Handle division by zero
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  // Compute cosine similarity
  const cosineSim = dotProduct / (magnitude1 * magnitude2);

  return cosineSim;
};

/**
 * @description Generate a 20-character ID based on input string
 * @param {string} input - The input string to generate the ID from
 * @returns {string} - A 20-character ID
 */
export const generateId = (input: string): string => {
  const hash = input.split('').reduce((acc, char) => {
    const charCode = char.charCodeAt(0);
    return ((acc << 5) - acc + charCode) | 0;
  }, 0);

  const hashPart1 = Math.abs(hash).toString(36).padStart(6, '0');
  const hashPart2 = Math.abs(hash * 31)
    .toString(36)
    .padStart(6, '0'); // Using a prime number to create variation
  const hashPart3 = Math.abs(hash * 59)
    .toString(36)
    .padStart(8, '0'); // Using another prime number

  return `${hashPart1}${hashPart2}${hashPart3}`.slice(0, 20);
};

/**
 * @description Fetches the police stations data from the API and maps it to the PoliceStationFeature interface
 * @returns An array of PoliceStationFeature objects
 */
export async function fetchPoliceStations(): Promise<PoliceStationFeature[]> {
  const apiUrl =
    'https://api-open.data.gov.sg/v1/public/api/datasets/d_c69e6d27d72f765fabfbeea362299378/poll-download';

  try {
    // Fetch the dataset metadata
    const response = await fetch(apiUrl);
    const jsonData = await response.json();

    if (jsonData.code !== 0) {
      throw new Error(jsonData.errMsg);
    }

    // Fetch the actual dataset from the URL provided in jsonData
    const dataResponse = await fetch(jsonData.data.url);
    const featureCollection = await dataResponse.json();

    // Map the features to the PoliceStationFeature interface
    const policeStations: PoliceStationFeature[] = featureCollection.features.map(
      (feature: PoliceStationFeature) => ({
        type: feature.type,
        properties: {
          Name: feature.properties.Name,
          Description: feature.properties.Description,
        },
        geometry: {
          type: feature.geometry.type,
          coordinates: feature.geometry.coordinates as [number, number, number],
        },
      })
    );

    return policeStations;
  } catch (error) {
    console.error('Error fetching police stations:', error);
    return [];
  }
}
