import React, { useState, useEffect } from 'react';
import {
  loginAtom,
  registerAtom,
  checkEmailExistsAtom,
  sendPasswordResetEmailAtom,
} from '../stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Button,
  Link,
  VStack,
} from '@chakra-ui/react';
import { showCustomToast } from '../components/CustomToast';
import { PasswordInput } from '../components/forms/PasswordInput';
import logo from '../assets/logo.png';
import { useAtomValue, useSetAtom } from 'jotai';
import { authUserAtom } from '../stores/authStore';
import AlertDialog from '../components/AlertDialog';

export default function AuthPage() {
  const login = useSetAtom(loginAtom);
  const register = useSetAtom(registerAtom);
  const checkEmailExists = useSetAtom(checkEmailExistsAtom);
  const sendPasswordResetEmail = useSetAtom(sendPasswordResetEmailAtom);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const authUser = useAtomValue(authUserAtom);
  const location = useLocation();
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetEmailSending, setIsResetEmailSending] = useState(false);

  useEffect(() => {
    if (authUser) {
      const intendedPath = (location.state as { from?: Location })?.from?.pathname || '/';
      navigate(intendedPath);
    }
  }, [authUser, navigate, location]);

  const validateField = (field: string, value: string) => {
    let error = '';
    switch (field) {
      case 'email':
      case 'resetEmail':
        if (!value) {
          error = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = 'Email is invalid';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters';
        } else if (value.length > 64) {
          error = 'Password cannot exceed 64 characters';
        }
        break;
      case 'confirmPassword':
        if (!isLogin && value !== password) {
          error = "Passwords don't match";
        }
        break;
      case 'displayName':
        if (!isLogin && !value) {
          error = 'Display name is required';
        } else if (value.length < 3) {
          error = 'Display name must be at least 3 characters long';
        } else if (value.length > 15) {
          error = 'Display name cannot exceed 15 characters';
        }
        break;
    }
    return error;
  };

  const handleBlur = (field: string, value: string) => {
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateForm = () => {
    const newErrors = {
      email: validateField('email', email),
      password: validateField('password', password),
      confirmPassword: isLogin ? '' : validateField('confirmPassword', confirmPassword),
      displayName: isLogin ? '' : validateField('displayName', displayName),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
        showCustomToast({
          title: 'Login Successful',
          description: 'Welcome back!',
          color: 'success',
        });
        navigate('/');
      } else {
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
          showCustomToast({
            title: 'Registration Failed',
            description: 'An account with this email already exists.',
            color: 'danger',
          });
        } else {
          await register({ email, password, displayName });
          showCustomToast({
            title: 'Registration Successful',
            description: 'Please check your email to verify your account.',
            color: 'success',
          });
          navigate('/verify-email');
        }
      }
    } catch (error) {
      console.error('[AuthPage] Authentication error:', error);
      if (error instanceof Error && error.message === 'Email not verified') {
        showCustomToast({
          title: 'Login Failed',
          description: 'Please verify your email before logging in.',
          color: 'warning',
        });
      } else {
        showCustomToast({
          title: 'Authentication Failed',
          description: 'Please check your credentials and try again.',
          color: 'danger',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const error = validateField('resetEmail', resetEmail);
    if (error) {
      setErrors((prev) => ({ ...prev, resetEmail: error }));
      return;
    }

    setIsResetEmailSending(true);
    try {
      await sendPasswordResetEmail(resetEmail);
      setIsForgotPasswordOpen(false);
      showCustomToast({
        title: 'Password Reset Email Sent',
        description: 'Please check your email for instructions to reset your password.',
        color: 'success',
      });
    } catch (error) {
      console.error('[AuthPage] Password reset error:', error);
      showCustomToast({
        title: 'Password Reset Failed',
        description: 'An error occurred while sending the password reset email. Please try again.',
        color: 'danger',
      });
    } finally {
      setIsResetEmailSending(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4'>
      <div className='w-full max-w-md mx-auto bg-white rounded-lg p-6'>
        <div className='flex flex-col items-center mb-8'>
          <img src={logo} alt='logo' className='w-16 h-16' />
          <span className='text-xl font-bold text-blue-600'>WhereApp</span>
        </div>

        <div className='mb-6'>
          <div className='flex rounded-md bg-gray-100/90 p-1.5' role='group'>
            <button
              type='button'
              className={`flex-1 py-2 text-sm font-medium rounded-md ${
                isLogin
                  ? 'text-gray-950 bg-white'
                  : 'text-gray-700 bg-transparent hover:bg-white/50 hover:text-gray-950'
              }`}
              onClick={() => setIsLogin(true)}>
              Login
            </button>
            <button
              type='button'
              className={`flex-1 py-2 text-sm font-medium rounded-md ${
                !isLogin
                  ? 'text-gray-950 bg-white'
                  : 'text-gray-700 bg-transparent hover:bg-white/50 hover:text-gray-950'
              }`}
              onClick={() => setIsLogin(false)}>
              Register
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='space-y-4'>
            {!isLogin && (
              <FormControl isInvalid={!!errors.displayName}>
                <FormLabel>Name</FormLabel>
                <Input
                  type='text'
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={(e) => handleBlur('displayName', e.target.value)}
                  placeholder='Display Name'
                  required={!isLogin}
                  variant='filled'
                />
                <FormErrorMessage>{errors.displayName}</FormErrorMessage>
              </FormControl>
            )}
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={(e) => handleBlur('email', e.target.value)}
                placeholder='myemail@example.com'
                required
                variant='filled'
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={(e) => handleBlur('password', e.target.value)}
              error={errors.password}
              label='Password'
              placeholder='••••••••'
            />
            {!isLogin && (
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                label='Confirm Password'
                placeholder='••••••••'
              />
            )}
            <div className='pt-4'>
              <Button
                isLoading={isLoading}
                loadingText={isLogin ? 'Logging in...' : 'Registering...'}
                type='submit'
                w='full'
                fontWeight='normal'
                bg='primary.600'
                color='white'
                _hover={{ bg: 'primary.700' }}
                _active={{ bg: 'primary.800' }}>
                {isLogin ? 'Login' : 'Register'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {isLogin && (
        <div className='mt-4 text-center'>
          <Link
            color='primary.600'
            onClick={() => setIsForgotPasswordOpen(true)}
            fontSize='sm'
            fontWeight='medium'>
            Forgot Password?
          </Link>
        </div>
      )}

      <AlertDialog
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        title='Reset Password'
        body={
          <VStack spacing={3} align='stretch'>
            <FormControl isInvalid={!!errors.resetEmail}>
              <FormLabel>Email address</FormLabel>
              <Input
                type='email'
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                onBlur={(e) => handleBlur('resetEmail', e.target.value)}
                placeholder='Enter your email'
              />
              <FormErrorMessage>{errors.resetEmail}</FormErrorMessage>
            </FormControl>
          </VStack>
        }
        footer={
          <Button
            onClick={handleForgotPassword}
            isLoading={isResetEmailSending}
            loadingText='Sending...'
            w='full'
            bg='primary.600'
            color='white'
            fontWeight='medium'
            _hover={{ bg: 'primary.700' }}
            _active={{ bg: 'primary.800' }}
            isDisabled={!!errors.resetEmail}>
            Send Reset Email
          </Button>
        }
      />
    </div>
  );
}
