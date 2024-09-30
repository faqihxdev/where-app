import { Timestamp } from 'firebase/firestore';

// <<< ENUMS >>>

export enum ListingCategory {
  ELECTRONICS = 'Electronics',
  CLOTHING_AND_ACCESSORIES = 'Clothing & Accessories',
  BAGS_AND_WALLETS = 'Bags & Wallets',
  PERSONAL_IDENTIFICATION_AND_DOCUMENTS = 'Personal Identification & Documents',
  PETS = 'Pets',
  SPORTS_AND_FITNESS = 'Sports & Fitness',
  TOYS_AND_CHILDREN_ITEMS = 'Toys & Children Items',
  EYEWEAR = 'Eyewear',
  VEHICLES = 'Vehicles',
  MISCELLANEOUS = 'Miscellaneous',
  OTHER = 'Other',
}

export enum ListingStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  ARCHIVED = 'archived',
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
  type: string;
  category: ListingCategory | '';
  status: ListingStatus | '';
  sortBy: keyof Listing;
  sortOrder: 'ascending' | 'descending';
  location: { lat: number; lng: number; radius: number } | null;
}