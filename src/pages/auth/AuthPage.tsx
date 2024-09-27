import React, { useState } from "react";
import { useAtom } from "jotai";
import { loginAtom, registerAtom } from "../../stores/authStore";
import { useNavigate } from "react-router-dom";
import {
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
} from "@chakra-ui/react";
import { showCustomToast } from "../../components/CustomToast";
import { PasswordInput } from "../../components/forms/PasswordInput";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [, login] = useAtom(loginAtom);
  const [, register] = useAtom(registerAtom);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();

  const validateField = (field: string, value: string) => {
    let error = "";
    switch (field) {
      case "email":
        if (!value) {
          error = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = "Email is invalid";
        }
        break;
      case "password":
        if (!value) {
          error = "Password is required";
        } else if (value.length < 6) {
          error = "Password must be at least 6 characters";
        }
        break;
      case "confirmPassword":
        if (!isLogin && value !== password) {
          error = "Passwords don't match";
        }
        break;
    }
    return error;
  };

  const handleBlur = (field: string, value: string) => {
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = () => {
    const newErrors = {
      email: validateField("email", email),
      password: validateField("password", password),
      confirmPassword: isLogin ? "" : validateField("confirmPassword", confirmPassword),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === "");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      if (isLogin) {
        await login({ email, password });
        showCustomToast({
          title: "Login Successful",
          description: "Welcome back!",
          bgColor: "bg-green-500",
        });
      } else {
        await register({ email, password });
        showCustomToast({
          title: "Registration Successful",
          description: "Your account has been created.",
          bgColor: "bg-green-500",
        });
      }
      navigate("/listing");
    } catch (error) {
      console.error("Authentication error:", error);
      showCustomToast({
        title: "Authentication Failed",
        description: "Please check your credentials and try again.",
        bgColor: "bg-red-500",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div className="flex rounded-md bg-gray-100/90 p-1.5" role="group">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md ${
                isLogin
                  ? "text-gray-950 bg-white"
                  : "text-gray-500 bg-transparent hover:bg-white hover:text-gray-950"
              }`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md ${
                !isLogin
                  ? "text-gray-950 bg-white"
                  : "text-gray-500 bg-transparent hover:bg-white hover:text-gray-950"
              }`}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={(e) => handleBlur("email", e.target.value)}
                placeholder="myemail@example.com"
                required
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={(e) => handleBlur("password", e.target.value)}
              error={errors.password}
              label="Password"
              placeholder="••••••••"
            />
            {!isLogin && (
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
                error={errors.confirmPassword}
                label="Confirm Password"
                placeholder="••••••••"
              />
            )}
            <div className="pt-4">
              <Button type="submit" colorScheme="blue" width="full">
                {isLogin ? "Login" : "Register"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}