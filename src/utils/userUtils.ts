import { User } from '../types';

// Get the avatar URL for the user
export function getAvatarUrl(user: User): string {
  if (user.preferences?.name) {
    const encodedName = encodeURIComponent(user.preferences.name);
    return `https://api.dicebear.com/9.x/initials/svg?backgroundType=gradientLinear&seed=${encodedName}`;
  } else {
    return 'https://api.dicebear.com/9.x/glass/svg?backgroundColor=1A5FFF';
  }
}