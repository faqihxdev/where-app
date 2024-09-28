import { useAtom } from "jotai";
import { authUserAtom } from "../../stores/authStore";
import { userDataAtom, fetchUserDataAtom } from "../../stores/userStore";
import { getAvatarUrl } from "../../utils/userUtils";
import { useEffect } from "react";

export default function ListingPage() {
  const [authUser] = useAtom(authUserAtom);
  const [userData] = useAtom(userDataAtom);
  const [, fetchUserData] = useAtom(fetchUserDataAtom);

  useEffect(() => {
    if (authUser && !userData) {
      fetchUserData(authUser.uid);
    }
  }, [authUser, userData, fetchUserData]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          {userData && (
            <img
              src={getAvatarUrl(userData)}
              alt={`Avatar for ${userData.preferences?.name || 'User'}`}
              className="w-12 h-12 rounded-full mr-4"
            />
          )}
          <h1 className="text-2xl font-bold">Listing Page</h1>
        </div>
        <p className="mb-4">Hey {userData?.email || authUser?.email}!</p>
      </div>
    </div>
  );
}
