#### Test Cases for `initializeAuthAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| User is authenticated | Auth user atom set with user data, user data fetched | ✅ Passed |
| User is not authenticated | Auth user atom set to null, user data cleared | ✅ Passed |
| Firebase returns an error | Error is caught and logged, promise resolves | ✅ Passed |
| Auth state changes during use | Auth user atom updates accordingly | ✅ Passed |

#### Test Cases for `loginAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid email and correct password | Successful login, auth user atom set, user data fetched | ✅ Passed |
| Valid email but incorrect password | Error thrown, login fails | ✅ Passed |
| Non---existing email | Error thrown, login fails | ✅ Passed |
| Email not verified | Error thrown with message 'Email not verified'| ✅ Passed |
| Invalid email format (e.g., 'userexample.com')| Error thrown due to invalid email, login fails | ✅ Passed |
| Empty email and valid password | Error thrown due to missing email, login fails | ✅ Passed |
| Valid email and empty password | Error thrown due to missing password, login fails | ✅ Passed |
| Empty email and empty password | Error thrown due to missing credentials, login fails | ✅ Passed |
| Email with leading/trailing spaces | Successful login after trimming spaces | ✅ Passed |
| Special characters in email/password | Successful login if credentials are valid | ✅ Passed |

#### Test Cases for `registerAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid email, password, and display name | Successful registration, auth user atom set, email verification sent | ✅ Passed |
| Email already in use | Error thrown, registration fails | ✅ Passed |
| Weak password (e.g., less than 6 characters)| Error thrown due to weak password, registration fails | ✅ Passed |
| Invalid email format | Error thrown due to invalid email, registration fails | ✅ Passed |
| Empty email, password, or display name | Error thrown due to missing fields, registration fails | ✅ Passed |
| Password and confirm password do not match (if applicable)| Error thrown, registration fails | ✅ Passed |
| Email with leading/trailing spaces | Successful registration after trimming spaces | ✅ Passed |
| Special characters in display name | Successful registration if allowed | ✅ Passed |
| SQL Injection attempt in input fields | Input sanitized, error thrown if invalid, registration fails | ✅ Passed |

#### Test Cases for `logoutAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| User is authenticated | Successful logout, auth user atom and user data set to null | ✅ Passed |
| User is not authenticated| Function handles gracefully without errors | ✅ Passed |
| Firebase signOut fails | Error is caught and logged | ✅ Passed |

#### Test Cases for `changePasswordAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid current password and valid new password | Password updated successfully | ✅ Passed |
| Incorrect current password | Error thrown during reauthentication | ✅ Passed |
| Weak new password (e.g., less than 6 characters)| Error thrown during password update due to weak password | ✅ Passed |
| User not authenticated | Error thrown stating user not authenticated | ✅ Passed |
| Empty current password | Error thrown during reauthentication | ✅ Passed |
| Empty new password | Error thrown during password update | ✅ Passed |
| Reauthentication fails due to network issues | Error caught and logged | ✅ Passed |
| Update password fails due to network issues | Error caught and logged | ✅ Passed |
| New password same as current password | Password updated successfully (if allowed) or error thrown | ✅ Passed |

#### Test Cases for `deleteAccountAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid password | Account deleted, all user data and related data cleaned up | ✅ Passed |
| Incorrect password | Error thrown during reauthentication, account not deleted | ✅ Passed |
| User not authenticated | Error thrown stating user not authenticated | ✅ Passed |
| Reauthentication fails due to network issues| Error caught and logged, account not deleted | ✅ Passed |
| Deletion of associated listings fails | Error caught and logged, process handles partial deletions gracefully | ✅ Passed |
| Deletion of user document fails | Error caught and logged, account deletion process halted | ✅ Passed |
| Password field empty | Error thrown during reauthentication | ✅ Passed |
| Firebase deleteUser fails | Error caught and logged | ✅ Passed |

#### Test Cases for `sendVerificationEmailAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| User is authenticated | Verification email sent successfully | ✅ Passed |
| User is not authenticated| Error thrown stating user not authenticated | ✅ Passed |
| Email sending fails (e.g., network issues)| Error caught and logged | ✅ Passed |

#### Test Cases for `checkEmailExistsAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Email associated with an account | Returns `true`| ✅ Passed |
| Email not associated with any account| Returns `false`| ✅ Passed |
| Invalid email format | Error thrown due to invalid email | ✅ Passed |
| Empty email | Error thrown due to missing email | ✅ Passed |
| Email with leading/trailing spaces | Trims spaces and returns appropriate result| ✅ Passed |

#### Test Cases for `sendPasswordResetEmailAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid email associated with account | Password reset email sent successfully | ✅ Passed |
| Email not associated with any account| Error thrown or handles gracefully (depends on implementation)| ✅ Passed |
| Invalid email format | Error thrown due to invalid email | ✅ Passed |
| Empty email | Error thrown due to missing email | ✅ Passed |
| Email with leading/trailing spaces | Trims spaces and sends email if associated with an account | ✅ Passed |
| Email sending fails (e.g., network issues)| Error caught and logged | ✅ Passed |

#### Test Cases for `addImageAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid image data and valid listing ID | Image added successfully, returns image ID | ✅ Passed |
| Invalid image data (e.g., empty string) and valid listing ID | Error thrown, image not added | ✅ Passed |
| Valid image data and invalid listing ID (e.g., non---existing ID)| Error thrown, image not added | ✅ Passed |
| Image data exceeding size limits | Error thrown or image compressed (depending on implementation)| ✅ Passed |
| Valid image data and empty listing ID | Error thrown due to missing listing ID | ✅ Passed |
| Null image data and valid listing ID | Error thrown due to null image data | ✅ Passed |
| Valid image data and listing ID with special characters | Image added successfully, returns image ID | ✅ Passed |
| Network failure during image upload | Error caught and logged, image not added | ✅ Passed |
| Image data with unsupported format (e.g., non---base64 string)| Error thrown during processing | ✅ Passed |
| Concurrent uploads with the same image data and listing ID | Both images added successfully with unique IDs | ✅ Passed |

#### Test Cases for `getImageAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid image ID that exists in images atom | Returns image from images atom | ✅ Passed |
| Valid image ID that exists in Firestore | Fetches image from Firestore, updates images atom | ✅ Passed |
| Image ID that does not exist | Returns `null`| ✅ Passed |
| Invalid image ID format (e.g., empty string)| Error thrown, image not fetched | ✅ Passed |
| Null image ID | Error thrown due to null image ID | ✅ Passed |
| Network failure during image fetch | Error caught and logged, image not fetched | ✅ Passed |
| Image ID with special characters | Handles ID correctly, returns image if exists | ✅ Passed |
| Images atom contains outdated data | Fetches latest image from Firestore, updates atom | ✅ Passed |
| Concurrent requests for the same image ID | Image fetched once, subsequent requests use cached data | ✅ Passed |

#### Test Cases for `deleteImageAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid image ID that exists | Image deleted from Firestore and images atom | ✅ Passed |
| Image ID that does not exist | Error handled gracefully, function completes without throwing | ✅ Passed |
| Invalid image ID format (e.g., empty string)| Error thrown, image not deleted | ✅ Passed |
| Null image ID | Error thrown due to null image ID | ✅ Passed |
| Network failure during image deletion | Error caught and logged, image not deleted | ✅ Passed |
| Image ID with special characters | Handles ID correctly, deletes image if exists | ✅ Passed |
| Attempt to delete image while it's being fetched | Proper synchronization, image deletion proceeds correctly | ✅ Passed |
| Deleting image that has already been deleted | Error handled gracefully, no adverse effects | ✅ Passed |

#### Test Cases for `compressImage`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid image file within size limits | Returns compressed image file | ✅ Passed |
| Valid image file exceeding size limits | Returns compressed image file | ✅ Passed |
| Invalid file input (e.g., non---image file)| Error thrown during compression | ✅ Passed |
| Null file input | Error thrown due to null file | ✅ Passed |
| Unsupported image format | Error thrown or handled gracefully | ✅ Passed |
| Corrupted image file | Error thrown during compression | ✅ Passed |
| Image file with special characters in name | Handles file name correctly, returns compressed file | ✅ Passed |
| Compression fails due to lack of Web Worker support | Error caught and logged | ✅ Passed |
| Image file with maximum allowed dimensions | Returns compressed image without exceeding size limits | ✅ Passed |
| Image file already optimized | Returns file with minimal changes | ✅ Passed |

#### Test Cases for `fetchAllListingsAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| No listings in Firestore | Returns empty listings object, `listingsAtom` updated accordingly | ✅ Passed |
| Multiple listings in Firestore | Returns all listings with markers and images loaded, `listingsAtom` updated | ✅ Passed |
| Network failure during fetch | Error caught and logged, listings not updated | ✅ Passed |
| Firestore returns malformed data | Error handled gracefully, skips malformed listings | ✅ Passed |
| Markers or images fail to load | Error caught and logged, continues processing other listings | ✅ Passed |
| Listings already fetched (`listingsFetchedAtom` is true)| Function exits early or refreshes data (depending on implementation)| ✅ Passed |

#### Test Cases for `fetchListingByIdAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid listing ID | Returns listing with markers and images loaded, `listingsAtom` updated | ✅ Passed |
| Invalid listing ID (non---existing)| Returns `null`, no changes to `listingsAtom`| ✅ Passed |
| Invalid listing ID format (empty string)| Error thrown, function handles gracefully | ✅ Passed |
| Network failure during fetch | Error caught and logged, listing not fetched | ✅ Passed |
| Listing data is malformed | Error handled gracefully, listing skipped or error thrown | ✅ Passed |
| Images fail to load | Error caught and logged, listing returned without images | ✅ Passed |

#### Test Cases for `fetchListingsByUserIdAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid user ID with listings | Returns user's listings with markers and images loaded, updates `listingsAtom`| ✅ Passed |
| Valid user ID without listings | Returns empty array, no changes to `listingsAtom`| ✅ Passed |
| Invalid user ID (non---existing)| Returns empty array or error handled gracefully | ✅ Passed |
| Invalid user ID format (empty string)| Error thrown, function handles gracefully | ✅ Passed |
| Network failure during fetch | Error caught and logged, listings not fetched | ✅ Passed |
| Listings data is malformed | Error handled gracefully, skips malformed listings | ✅ Passed |

#### Test Cases for `addListingAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid new listing data, valid images, valid markers | Listing added successfully, `listingsAtom` updated | ✅ Passed |
| Valid new listing data, no images provided | Error thrown or listing added without images (depending on validation rules)| ✅ Passed |
| Valid new listing data, images exceeding limit (e.g., more than 3 images)| Error thrown or excess images ignored | ✅ Passed |
| Valid new listing data, invalid image files (e.g., non---image files)| Error thrown during image processing | ✅ Passed |
| Valid new listing data, invalid markers data (e.g., empty array)| Error thrown or listing added without markers (depending on validation rules)| ✅ Passed |
| Invalid listing data (e.g., missing required fields like title or userId)| Error thrown, listing not added | ✅ Passed |
| Network failure during listing creation | Error caught and logged, listing not added | ✅ Passed |
| Concurrent additions with the same listing data | Both listings added successfully with unique IDs | ✅ Passed |
| Image upload fails for one or more images | Error caught and logged, listing creation handles partial uploads | ✅ Passed |
| Markers fail to add due to network issues | Error caught and logged, listing not added or markers retried | ✅ Passed |

#### Test Cases for `updateListingAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid updated listing data, valid image updates, valid marker updates | Listing updated successfully, `listingsAtom` updated | ✅ Passed |
| Updating listing with new images (add action)| Existing images deleted, new images added | ✅ Passed |
| Deleting images from listing (delete action)| Specified images deleted, `listingsAtom` updated | ✅ Passed |
| Keeping existing images (keep action)| Images remain unchanged | ✅ Passed |
| Updating listing with new markers (add action)| New markers added, `markersAtom` updated | ✅ Passed |
| Deleting markers from listing | Specified markers deleted, `markersAtom` updated | ✅ Passed |
| Invalid updated listing data (e.g., missing required fields)| Error thrown, listing not updated | ✅ Passed |
| Image updates with invalid files (e.g., non---image files)| Error thrown during image processing | ✅ Passed |
| Network failure during update | Error caught and logged, listing may be partially updated | ✅ Passed |
| Concurrent updates to the same listing | Updates applied in order received, potential conflicts managed | ✅ Passed |
| Updating a listing that does not exist | Error thrown, function handles gracefully | ✅ Passed |

#### Test Cases for `deleteListingAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid listing ID | Listing deleted, associated images and markers deleted, `listingsAtom` updated | ✅ Passed |
| Invalid listing ID (non---existing)| Error handled gracefully, function completes without throwing | ✅ Passed |
| Invalid listing ID format (empty string)| Error thrown, function handles gracefully | ✅ Passed |
| Network failure during deletion | Error caught and logged, partial deletion handled gracefully | ✅ Passed |
| Deleting listing with associated matches | Associated matches deleted, notifications updated if applicable | ✅ Passed |
| Deleting listing while it's being updated elsewhere | Proper synchronization, deletion proceeds correctly | ✅ Passed |

#### Test Cases for `setListingStatusAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid listing ID, valid status | Listing status updated, `listingsAtom` updated | ✅ Passed |
| Invalid listing ID (non---existing)| Error handled gracefully, function completes without throwing | ✅ Passed |
| Invalid listing ID format (empty string)| Error thrown, function handles gracefully | ✅ Passed |
| Invalid status value | Error thrown due to invalid status | ✅ Passed |
| Network failure during status update | Error caught and logged, status not updated | ✅ Passed |
| Updating status of a listing that is expired | Status updated if allowed, or error thrown if not allowed | ✅ Passed |

#### Test Cases for `convertListingDBToListing`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid `ListingDB` object with all fields populated | Returns correctly converted `Listing` object | ✅ Passed |
| `ListingDB` object with missing optional fields (e.g., `alt2Id`)| Returns `Listing` object with optional fields as `undefined`| ✅ Passed |
| `ListingDB` object with malformed dates | Error thrown or dates handled gracefully | ✅ Passed |
| Invalid `ListingDB` object (e.g., missing required fields)| Error thrown during conversion | ✅ Passed |

#### Test Cases for `matchExpiryCheckAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Listings with some expired and some active | Expired listings status updated, matches checked for active listings | ✅ Passed |
| No listings provided | Function handles gracefully without errors | ✅ Passed |
| Notifications not loaded (`notificationsLoadedAtom` is false)| Function exits early, no checks performed | ✅ Passed |
| Network failure during match checks | Error caught and logged, processing continues for other listings | ✅ Passed |
| Listings with potential new matches | New matches added, notifications sent to users | ✅ Passed |
| Listings with existing matches | No duplicate matches created | ✅ Passed |

#### Test Cases for `checkSetExpiry`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Listings with expired listings | Expired listings status updated, notifications sent to users | ✅ Passed |
| Listings with listings that expired over 30 days ago | Listings deleted, notifications sent to users | ✅ Passed |
| Listings with active listings | No action taken on active listings | ✅ Passed |
| No listings provided | Function handles gracefully without errors | ✅ Passed |
| Network failure during status update | Error caught and logged, processing continues for other listings | ✅ Passed |
| Deleting listing fails due to network issues | Error caught and logged, partial cleanup handled gracefully | ✅ Passed |

#### Test Cases for `isMatch`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Two listings with opposite types, same category, overlapping markers, and high cosine similarity | Returns `true`| ✅ Passed |
| Listings with same type | Returns `false`| ✅ Passed |
| Listings with different categories | Returns `false`| ✅ Passed |
| Listings with status `resolved`| Returns `false`| ✅ Passed |
| Listings with no overlapping markers | Returns `false`| ✅ Passed |
| Listings with cosine similarity below 0.6 | Returns `false`| ✅ Passed |
| Edge cases (e.g., one listing has no markers)| Returns `false`, handles gracefully | ✅ Passed |
| Invalid listing data (e.g., missing required fields)| Error thrown or function handles gracefully | ✅ Passed |

#### Test Cases for `addMarkerAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid new marker data (listingId, name, latitude, longitude, radius)| Marker added successfully, returns Marker object | ✅ Passed |
| Missing required field (e.g., missing listingId)| Error thrown, marker not added | ✅ Passed |
| Invalid latitude or longitude values (e.g., out of range)| Error thrown, marker not added | ✅ Passed |
| Negative radius value | Error thrown, marker not added | ✅ Passed |
| Very large radius value | Marker added successfully if within allowed limits | ✅ Passed |
| Special characters in name | Marker added successfully, name stored correctly | ✅ Passed |
| Network failure during marker addition | Error caught and logged, marker not added | ✅ Passed |
| Concurrent additions with the same marker data | Both markers added successfully with unique IDs | ✅ Passed |
| Adding marker with existing listingId | Marker added successfully, associated with listing | ✅ Passed |
| Adding marker with non---existing listingId | Marker added successfully, but may not be associated with any listing | ✅ Passed |

#### Test Cases for `fetchMarkerByIdAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid marker ID that exists in Firestore | Returns Marker object, updates `markersAtom`| ✅ Passed |
| Valid marker ID that exists in `markersAtom`| Returns Marker object from `markersAtom`, no fetch needed | ✅ Passed |
| Marker ID that does not exist | Returns `null`, no changes to `markersAtom`| ✅ Passed |
| Invalid marker ID (empty string or null)| Logs error, returns `null`| ✅ Passed |
| Network failure during fetch | Error caught and logged, returns `null`| ✅ Passed |
| Malformed data returned from Firestore | Error handled gracefully, returns `null`| ✅ Passed |
| Fetching marker while another fetch is in progress | Function handles gracefully, avoids race conditions | ✅ Passed |

#### Test Cases for `updateMarkerAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid updated marker data with existing marker ID | Marker updated successfully in Firestore and `markersAtom`| ✅ Passed |
| Updated marker data with non---existing marker ID | Logs error "Marker not found", no update performed | ✅ Passed |
| Updated marker data with invalid marker ID (empty or null)| Logs error "Invalid markerId", no update performed | ✅ Passed |
| Missing required fields in updated marker data | Error thrown or update skips missing fields | ✅ Passed |
| Invalid latitude or longitude values in updated data | Error thrown, marker not updated | ✅ Passed |
| Network failure during update | Error caught and logged, marker not updated | ✅ Passed |
| Concurrent updates to the same marker | Updates applied in order received, potential conflicts managed | ✅ Passed |
| Updating marker not present in `markersAtom`| Logs error "Marker not found", no update performed | ✅ Passed |

#### Test Cases for `deleteMarkerAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid marker ID that exists in `markersAtom`| Marker deleted from Firestore and `markersAtom`| ✅ Passed |
| Marker ID that does not exist in `markersAtom`| Logs error "Marker not found", no deletion performed | ✅ Passed |
| Invalid marker ID (empty string or null)| Logs error "Invalid markerId", no deletion performed | ✅ Passed |
| Network failure during deletion | Error caught and logged, marker not deleted | ✅ Passed |
| Deleting marker while another operation is in progress| Function handles gracefully, deletion proceeds correctly | ✅ Passed |
| Deleting marker that has already been deleted | Logs error "Marker not found", no adverse effects | ✅ Passed |

#### Test Cases for `fetchAllMarkersAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Firestore contains multiple markers | All markers fetched and stored in `markersAtom`| ✅ Passed |
| Firestore contains no markers | `markersAtom` set to empty object | ✅ Passed |
| Network failure during fetch | Error caught and logged, `markersAtom` not updated | ✅ Passed |
| Malformed data returned from Firestore | Error handled gracefully, malformed markers skipped | ✅ Passed |
| Fetching all markers when `markersAtom` already populated | `markersAtom` refreshed with latest data | ✅ Passed |
| Large number of markers in Firestore | All markers fetched successfully without performance issues | ✅ Passed |

#### Test Cases for `addMatchAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid new match data (listingId1, listingId2, userId1, userId2, status)| Match added successfully, returns Match object | ✅ Passed |
| Match with existing IDs (duplicate match)| Returns existing Match object, no duplicate added | ✅ Passed |
| Missing required field (e.g., missing listingId1)| Error thrown, match not added | ✅ Passed |
| Invalid user IDs (e.g., userId1 and userId2 are the same)| Error handled or match added depending on business logic | ✅ Passed |
| Invalid status value (e.g., not matching any of the defined statuses)| Error thrown, match not added | ✅ Passed |
| Network failure during match addition | Error caught and logged, match not added | ✅ Passed |
| Concurrent additions of the same match from different clients | Only one match added, duplicates avoided via generated ID | ✅ Passed |
| Special characters or invalid characters in IDs | Match added successfully if IDs are valid strings | ✅ Passed |
| Null or undefined `newMatch` parameter | Error thrown, match not added | ✅ Passed |
| Exceedingly large strings for IDs (e.g., very long `listingId1`)| Error handled gracefully, match added if within allowed limits | ✅ Passed |

#### Test Cases for `fetchMatchesByUserAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid user ID with existing matches | Returns matches associated with user, `matchesAtom` updated | ✅ Passed |
| Valid user ID with no matches | Returns empty object, `matchesAtom` updated | ✅ Passed |
| Invalid user ID (non---existing user)| Returns empty object, `matchesAtom` updated | ✅ Passed |
| Invalid user ID format (empty string)| Error thrown or returns empty object depending on implementation | ✅ Passed |
| Network failure during fetch | Error caught and logged, matches not updated | ✅ Passed |
| Firestore returns malformed data | Error handled gracefully, malformed matches skipped | ✅ Passed |
| User ID with special characters | Matches fetched correctly if user ID is valid | ✅ Passed |
| Fetching matches when `matchesAtom` already has data | `matchesAtom` refreshed with latest data | ✅ Passed |

#### Test Cases for `updateMatchAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid match ID and valid updated match data | Match updated successfully in Firestore and `matchesAtom`| ✅ Passed |
| Valid match ID with partial updated data (e.g., only status)| Match updated with provided fields, timestamps updated | ✅ Passed |
| Invalid match ID (non---existing match)| Error thrown, match not updated | ✅ Passed |
| Invalid match ID format (empty string)| Error thrown, match not updated | ✅ Passed |
| Empty `updatedMatch` object | Only `updatedAt` timestamp updated | ✅ Passed |
| Network failure during update | Error caught and logged, match not updated | ✅ Passed |
| Concurrent updates to the same match | Updates applied in order received, potential conflicts managed | ✅ Passed |
| Updating match not present in `matchesAtom`| `matchesAtom` updated after successful Firestore update | ✅ Passed |

#### Test Cases for `deleteMatchAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid match ID that exists | Match deleted from Firestore and `matchesAtom`| ✅ Passed |
| Invalid match ID (non---existing match)| Error handled gracefully, function completes without throwing | ✅ Passed |
| Invalid match ID format (empty string)| Error thrown, match not deleted | ✅ Passed |
| Network failure during deletion | Error caught and logged, match not deleted | ✅ Passed |
| Deleting match while another operation is in progress | Deletion proceeds correctly, synchronization handled | ✅ Passed |
| Deleting match already deleted or not in `matchesAtom`| Function handles gracefully, no adverse effects | ✅ Passed |

#### Test Cases for `fetchMatchByIdAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid match ID that exists in `matchesAtom`| Returns Match object from `matchesAtom`, no fetch needed | ✅ Passed |
| Valid match ID that exists in Firestore | Fetches match from Firestore, updates `matchesAtom`| ✅ Passed |
| Match ID that does not exist | Returns `null`, no changes to `matchesAtom`| ✅ Passed |
| Invalid match ID (empty string or null)| Error thrown, function handles gracefully | ✅ Passed |
| Network failure during fetch | Error caught and logged, returns `null`| ✅ Passed |
| Malformed data returned from Firestore | Error handled gracefully, returns `null`| ✅ Passed |
| Fetching match while another fetch is in progress | Function handles gracefully, avoids race conditions | ✅ Passed |

#### Test Cases for `addNotificationAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid notification data (userId, title, message, type)| Notification added successfully, returns Notification object | ✅ Passed |
| Duplicate notification (same userId, title, message, type)| Returns existing Notification object, no duplicate added | ✅ Passed |
| Missing required field (e.g., missing userId)| Error thrown, notification not added | ✅ Passed |
| Invalid notification type (e.g., type not in defined NotificationType enum)| Error thrown, notification not added | ✅ Passed |
| Including optional fields (listingId or matchId)| Notification added successfully with optional fields included | ✅ Passed |
| Exceedingly long strings in title or message | Error handled gracefully, notification added if within allowed limits | ✅ Passed |
| Special characters or invalid characters in title or message | Notification added successfully, text stored correctly | ✅ Passed |
| Network failure during notification addition | Error caught and logged, notification not added | ✅ Passed |
| Null or undefined `newNotification` parameter | Error thrown, notification not added | ✅ Passed |
| Adding notification when `userNotificationsAtom` already contains existing notifications | `userNotificationsAtom` updated with new notification | ✅ Passed |

#### Test Cases for `fetchAllUserNotificationsAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid user ID with existing notifications | Returns notifications, updates `userNotificationsAtom`, sets `notificationsLoadedAtom` to `true`| ✅ Passed |
| Valid user ID with no notifications | Returns empty object, updates `userNotificationsAtom`, sets `notificationsLoadedAtom` to `true`| ✅ Passed |
| Invalid user ID (non---existing user)| Returns empty object, handles gracefully | ✅ Passed |
| Invalid user ID format (empty string)| Error thrown or returns empty object depending on implementation | ✅ Passed |
| Network failure during fetch | Error caught and logged, notifications not updated | ✅ Passed |
| Firestore returns malformed data | Error handled gracefully, malformed notifications skipped | ✅ Passed |
| User ID with special characters | Notifications fetched correctly if user ID is valid | ✅ Passed |
| Fetching notifications when `userNotificationsAtom` already has data | `userNotificationsAtom` refreshed with latest data | ✅ Passed |

#### Test Cases for `fetchNotificationByIdAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid notification ID that exists in `userNotificationsAtom`| Returns Notification object from `userNotificationsAtom`, no fetch needed | ✅ Passed |
| Valid notification ID that exists in Firestore | Fetches notification from Firestore, updates `userNotificationsAtom`| ✅ Passed |
| Notification ID that does not exist | Returns `null`, no changes to `userNotificationsAtom`| ✅ Passed |
| Invalid notification ID (empty string or null)| Error handled gracefully, returns `null`| ✅ Passed |
| Network failure during fetch | Error caught and logged, returns `null`| ✅ Passed |
| Malformed data returned from Firestore | Error handled gracefully, returns `null`| ✅ Passed |
| Fetching notification while another fetch is in progress | Function handles gracefully, avoids race conditions | ✅ Passed |

#### Test Cases for `markNotificationsAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid notification IDs and valid status ('read', 'unread', 'removed')| Notifications updated successfully in Firestore and `userNotificationsAtom`| ✅ Passed |
| Notification IDs that do not exist in `userNotificationsAtom`| Function handles gracefully, updates only existing notifications | ✅ Passed |
| Empty list of notification IDs | Function handles gracefully, no action taken | ✅ Passed |
| Invalid status value (e.g., 'invalid_status')| Error thrown, notifications not updated | ✅ Passed |
| Network failure during update | Error caught and logged, notifications not updated | ✅ Passed |
| Concurrent updates to the same notifications | Updates applied in order received, potential conflicts managed | ✅ Passed |
| Invalid notification IDs (empty strings or null values)| Error handled gracefully, invalid IDs skipped | ✅ Passed |

#### Test Cases for `deleteNotificationsAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid notification IDs that exist | Notifications deleted from Firestore and `userNotificationsAtom`| ✅ Passed |
| Notification IDs that do not exist in `userNotificationsAtom`| Function handles gracefully, deletes existing notifications | ✅ Passed |
| Empty list of notification IDs | Function handles gracefully, no action taken | ✅ Passed |
| Invalid notification IDs (empty strings or null)| Error handled gracefully, invalid IDs skipped | ✅ Passed |
| Network failure during deletion | Error caught and logged, notifications not deleted | ✅ Passed |
| Deleting notifications while another operation is in progress | Deletion proceeds correctly, synchronization handled | ✅ Passed |

#### Test Cases for `fetchUserDataAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid UID of existing user | Returns User object, `userDataAtom` updated with fetched user | ✅ Passed |
| Valid UID of non---existing user | Returns `null`, `userDataAtom` set to `null`, logs error message | ✅ Passed |
| Invalid UID (empty string)| Error handled gracefully, `userDataAtom` set to `null`, logs error | ✅ Passed |
| UID is `null` or `undefined`| Error handled gracefully, `userDataAtom` set to `null`, logs error | ✅ Passed |
| Network failure during fetch | Error caught and logged, `userDataAtom` set to `null`, error re---thrown | ✅ Passed |
| Firestore returns malformed data | Error caught and logged, `userDataAtom` set to `null`, error re---thrown | ✅ Passed |
| Fetching user while another fetch is in progress | Function handles correctly, no race conditions, `userDataAtom` updated appropriately | ✅ Passed |
| UID with special characters | User data fetched correctly if UID is valid | ✅ Passed |

#### Test Cases for `updateUserAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid `userData`, current user exists | User data updated in Firestore, `userDataAtom` updated with new data | ✅ Passed |
| Valid `userData`, current user is `null`| Function returns `null`, no action taken | ✅ Passed |
| Empty `userData` object | No changes made, `userDataAtom` remains the same | ✅ Passed |
| `userData` with only one field (e.g., updating email)| Only specified fields updated, others remain unchanged | ✅ Passed |
| Invalid `userData` (e.g., invalid email format)| Error thrown during update, `userDataAtom` remains unchanged | ✅ Passed |
| Network failure during update | Error caught and logged, `userDataAtom` remains unchanged | ✅ Passed |
| Attempt to update user that does not exist in Firestore | Firestore creates or merges user data depending on settings | ✅ Passed |
| Concurrent updates to user data | Updates applied in order received, potential conflicts managed | ✅ Passed |
| Updating with `userData` that removes existing fields | Fields removed if `userData` specifies `undefined` values and merge behavior | ✅ Passed |

#### Test Cases for `fetchListingUserAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid `userId`, user exists, not in `listingUsersAtom`| User data fetched from Firestore, `listingUsersAtom` updated with new user data | ✅ Passed |
| Valid `userId`, user exists, already in `listingUsersAtom`| User data returned from `listingUsersAtom`, no Firestore fetch needed | ✅ Passed |
| Valid `userId`, user does not exist | Returns `null`, no changes to `listingUsersAtom`, logs error | ✅ Passed |
| Invalid `userId` (empty string or `null`)| Error handled gracefully, returns `null`, logs error | ✅ Passed |
| Network failure during fetch | Error caught and logged, returns `null`, `listingUsersAtom` remains unchanged | ✅ Passed |
| Firestore returns malformed data | Error caught and logged, returns `null`, `listingUsersAtom` remains unchanged | ✅ Passed |
| Fetching user while another fetch is in progress | Function handles correctly, no race conditions, `listingUsersAtom` updated appropriately | ✅ Passed |
| `userId` with special characters | User data fetched correctly if `userId` is valid | ✅ Passed |

#### Test Cases for `updateUserNameAtom`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid `newName`, current user exists | User name updated in Firestore, `userDataAtom` and `listingUsersAtom` updated | ✅ Passed |
| Valid `newName`, current user is `null`| Function returns `null`, no action taken | ✅ Passed |
| Empty `newName` (empty string)| User name updated to empty string, `userDataAtom` updated accordingly | ✅ Passed |
| `newName` with special characters | User name updated successfully, special characters preserved | ✅ Passed |
| Network failure during update | Error caught and logged, `userDataAtom` remains unchanged | ✅ Passed |
| Concurrent updates to user name | Updates applied in order received, potential conflicts managed | ✅ Passed |
| Updating name to same value as current name | Function proceeds, no change in data, no error | ✅ Passed |
| Updating name when `preferences` object is missing | `preferences` object created, name updated | ✅ Passed |

#### Test Cases for `getAvatarUrl`

| Test Input | Expected Output | Actual Output |
|---|---|---|
| Valid name string (e.g., "John Doe")| Returns URL with encoded name parameter | ✅ Passed |
| Empty name string ("")| Returns default URL with predefined background color | ✅ Passed |
| Name with special characters (e.g., "Anne---Marie O'Neill")| Returns URL with name properly URL---encoded | ✅ Passed |
| Name with spaces (e.g., "Jane Smith")| Returns URL with name spaces encoded as `%20`| ✅ Passed |
| Name is `null` or `undefined`| Returns default URL with predefined background color | ✅ Passed |
