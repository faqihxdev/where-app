import { test as base } from '@playwright/test';
import { User, Listing, ListingCategory, ListingStatus } from '../src/types';

// Declare the types of your fixtures
type Fixtures = {
  testUser: User;
  testListings: {
    'test-listing-1': Partial<Listing>;
    'test-listing-2': Partial<Listing>;
  };
};

// Extend base test with custom fixtures
export const test = base.extend<Fixtures>({
  // Reuse signed-in state from auth.setup.ts
  storageState: 'playwright/.auth/user.json',

  // Add testUser fixture
  // eslint-disable-next-line no-empty-pattern
  testUser: async ({}, use) => {
    const testUser: User = {
      uid: '8rh5hp1Fr7SX9R1RwqwTqYgIjxT2',
      email: 'akmalaqil12345@gmail.com',
      preferences: {
        name: 'Aqil',
      },
      createdAt: new Date(),
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(testUser);
  },

  // Add a new listing fixture
  // eslint-disable-next-line no-empty-pattern
  testListings: async ({}, use) => {
    const testListings: {
      'test-listing-1': Partial<Listing>;
      'test-listing-2': Partial<Listing>;
    } = {
      'test-listing-1': {
        title: 'Playwright Test 1',
        description: 'Playwright Test 1 Description',
        type: 'lost',
        status: ListingStatus.active,
        category: ListingCategory.other,
      },
      'test-listing-2': {
        title: 'Playwright Test 2',
        description: 'Playwright Test 2 Description',
        type: 'found',
        status: ListingStatus.active,
        category: ListingCategory.other,
      },
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(testListings);
  },
});

export { expect } from '@playwright/test';
