import { useAtom } from "jotai";
import { authUserAtom, logoutAtom } from "../../stores/authStore";
import { userDataAtom, updateUserDataAtom } from "../../stores/userStore";
import { Button, Input } from "@chakra-ui/react";
import { useState } from "react";
import { User } from "../../types/user";

export default function ProtectedPage() {
  const [authUser] = useAtom(authUserAtom);
  const [userData] = useAtom(userDataAtom);
  const [, logout] = useAtom(logoutAtom);
  const [, updateUserData] = useAtom(updateUserDataAtom);

  const [displayName, setDisplayName] = useState(userData?.displayName || "");

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUpdateDisplayName = async () => {
    try {
      await updateUserData({ displayName } as Partial<User>);
    } catch (error) {
      console.error("Update display name error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Protected Page</h1>
        <p className="mb-4">Welcome, {authUser?.email}!</p>
        <p className="mb-4">Display Name: {userData?.displayName || "Not set"}</p>
        <div className="mb-4">
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter display name"
          />
          <Button onClick={handleUpdateDisplayName} colorScheme="blue" mt={2}>
            Update Display Name
          </Button>
        </div>
        <Button onClick={handleLogout} colorScheme="red">
          Logout
        </Button>
      </div>
    </div>
  );
}