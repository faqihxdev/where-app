export interface User {
  uid: string;
  email: string;
  preferences?: {
    name?: string;
  }
  createdAt?: Date;
}

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

export interface ListingLocation {
  name: string;
  latitude: number;
  longitude: number;
}

// Contains the firestore docId under the Images collection
export interface ListingImages {
  main: {
    id: string,
    src?: string,
  };
  alt1?: {
    id?: string,
    src?: string,
  };
  alt2?: {
    id?: string,
    src?: string,
  };
}

export interface Listing {
  id: string;
  type: 'lost' | 'found';
  userId: string;
  title: string;
  description: string;
  images: ListingImages;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  locations: ListingLocation[];
  status: ListingStatus;
  category: ListingCategory;
}