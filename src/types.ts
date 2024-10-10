import { Timestamp } from 'firebase/firestore';

// <<< TYPES & ENUMS >>>

export type ImageType = 'main' | 'alt1' | 'alt2';

export enum ListingCategory {
  electronics = 'Electronics',
  clothing_and_accessories = 'Clothing & Accessories',
  bags_and_wallets = 'Bags & Wallets',
  personal_documents = 'Personal Documents',
  pets = 'Pets',
  sports_and_fitness = 'Sports & Fitness',
  toys_and_children_items = 'Toys & Children Items',
  eyewear = 'Eyewear',
  vehicles = 'Vehicles',
  miscellaneous = 'Miscellaneous',
  other = 'Other',
}

export enum ListingStatus {
  active = 'Active',
  resolved = 'Resolved',
  archived = 'Archived',
}

export enum ListingKeyNames {
  title = 'Title',
  description = 'Description',
  category = 'Category',
  status = 'Status',
  type = 'Type',
  createdAt = 'Date Posted',
  updatedAt = 'Last Updated',
  location = 'Location',
}

export enum MatchStatus {
  new = 'New',
  viewed = 'Viewed',
  resolved = 'Resolved',
  rejected = 'Rejected',
}

// <<< MAIN TYPES >>>

export interface User {
  uid: string; // The user id from Firebase Auth stored also as the document id in the Users collection
  email: string; // The user email address
  preferences?: { name?: string }; // The user display name
  createdAt?: Date; // The time the user was created
}

export interface ListingImages {
  main: { id: string; listingId: string; data: string }; // The main image for the listing
  alt1?: { id?: string; listingId?: string; data?: string }; // The first alternative image for the listing
  alt2?: { id?: string; listingId?: string; data?: string }; // The second alternative image for the listing
  // id: The document id of the image in the Images collection
  // listingId: The document id of the listing in the Listings collection
  // data: The base64 encoded image data (Not using Firebase Storage to stay in free plan)
}

export interface Marker {
  id: string; // The document id of the marker in the Markers collection
  listingId: string; // The document id of the listing in the Listings collection
  name: string; // The name of the location
  latitude: number; // The latitude of the location
  longitude: number; // The longitude of the location
  radius: number; // The radius of the location in meters
}

export interface Listing {
  id: string; // The document id of the listing in the Listings collection
  type: 'lost' | 'found'; // The type of the listing
  userId: string; // The document id of the user in the Users collection
  title: string; // The title of the listing
  description: string; // The description of the listing
  status: ListingStatus; // The status of the listing
  category: ListingCategory; // The category of the listing
  createdAt: Date; // The time the listing was created
  updatedAt: Date; // The time the listing was last updated
  expiresAt: Date; // The time the listing will expire at
  expiry?: Date; // <-- Add this line to define the expiry property
  images: ListingImages; // The images of the listing
  markers: Marker[]; // The markers of the listing
}


export interface Match {
  id: string; // The document id of the match in the Matches collection
  listingId1: string; // The document id of the first listing in the Listings collection
  listingId2: string; // The document id of the second listing in the Listings collection
  userId1: string; // The document id of the first user in the Users collection
  userId2: string; // The document id of the second user in the Users collection
  status: MatchStatus; // The status of the match
  createdAt: Date; // The time the match was created
  updatedAt: Date; // The time the match was last updated
}

// <<< DATABASE COLLECTION TYPES >>>

export interface ListingDB {
  id: string; // The document id of the listing in the Listings collection
  type: 'lost' | 'found'; // The type of the listing
  userId: string; // The document id of the user in the Users collection
  title: string; // The title of the listing
  description: string; // The description of the listing
  status: ListingStatus; // The status of the listing
  category: ListingCategory; // The category of the listing
  createdAt: Timestamp; // The time the listing was created
  updatedAt: Timestamp; // The time the listing was last updated
  expiresAt: Timestamp; // The time the listing will expire at
  images: {
    mainId: string; // The document id of the main image in the Images collection
    alt1Id?: string; // The document id of the first alternative image in the Images collection
    alt2Id?: string; // The document id of the second alternative image in the Images collection
  };
  markerIds: string[]; // The document ids of the markers in the Markers collection
}

export interface ImageDB {
  id: string; // The document id of the image in the Images collection
  listingId: string; // The document id of the listing in the Listings collection
  data: string; // The base64 encoded image data (Not using Firebase Storage to stay in free plan)
}

// <<< OTHER TYPES >>>

export interface SearchParams {
  keyword: string; // The keyword to search for (title & description)
  type: 'all' | 'lost' | 'found'; // The type of the listing to search for
  category: string; // The category of the listing to search for
  status: ListingStatus | ''; // The status of the listing to search for
  sortBy: keyof Listing; // The field to sort the listings by
  sortOrder: 'ascending' | 'descending'; // The order to sort the listings by
  location: { name: string; lat: number; lng: number; radius: number } | null; // The location to search for listings within
}


