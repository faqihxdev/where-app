import React from 'react'
import { Link } from 'react-router-dom'

const NotFoundPage: React.FC = () => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='text-center'>
        <h1 className='text-6xl font-bold text-gray-900 mb-4'>404</h1>
        <p className='text-xl text-gray-600 mb-8'>Oops! Page not found.</p>
        <Link
          to='/'
          className='bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-2 px-4 rounded'>
          Go back to home
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
