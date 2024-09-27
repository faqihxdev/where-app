import { useAtom } from "jotai";
import { authUserAtom } from "../../stores/authStore";

export default function ListingPage() {
  const [authUser] = useAtom(authUserAtom);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Listing Page</h1>
        <p className="mb-4">Hey {authUser?.email}!</p>
      </div>
    </div>
  );
}
