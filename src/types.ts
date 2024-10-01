import { Timestamp } from 'firebase/firestore';

// <<< ENUMS >>>

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

// <<< CLIENT SIDE TYPES >>>

export interface User {
  uid: string;
  email: string;
  preferences?: {
    name?: string;
  }
  createdAt?: Date;
}

export interface ListingImages {
  main:  { id: string,  listingId: string,  data: string };
  alt1?: { id?: string, listingId?: string, data?: string };
  alt2?: { id?: string, listingId?: string, data?: string };
}

export interface Marker {
  id: string;
  listingId: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export interface Listing {
  id: string;
  type: 'lost' | 'found';
  userId: string;
  title: string;
  description: string;
  status: ListingStatus;
  category: ListingCategory;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  images: ListingImages;
  markers: Marker[];
}

// <<< DATABASE COLLECTION TYPES >>>

export interface ListingDB {
  id: string;
  type: 'lost' | 'found';
  userId: string;
  title: string;
  description: string;
  status: ListingStatus;
  category: ListingCategory;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
  images: {
    mainId: string;
    alt1Id?: string;
    alt2Id?: string;
  };
  markerIds: string[];
}

export interface ImageDB {
  id: string;
  listingId: string;
  data: string;
}

// <<< OTHER TYPES >>>

export interface SearchParams {
  keyword: string;
  type: 'all' | 'lost' | 'found';
  category: string;
  status: ListingStatus | '';
  sortBy: keyof Listing;
  sortOrder: 'ascending' | 'descending';
  location: { lat: number; lng: number; radius: number } | null;
}