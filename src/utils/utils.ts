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
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return [distance <= maxDistance, distance];
}

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
 * @description Truncates a string to a specified length and adds an ellipsis if necessary
 * @param input The input string to truncate
 * @param maxLength The maximum length of the output string
 * @returns The truncated string with an ellipsis if it exceeds the maxLength
 */
export const truncateWithEllipsis = (input: string, maxLength: number): string => {
  if (input.length <= maxLength) {
    return input;
  }

  // Ensure maxLength is large enough to fit the ellipsis
  if (maxLength <= 3) {
    return '...'.substring(0, maxLength);
  }

  return input.substring(0, maxLength - 3) + '...';
}