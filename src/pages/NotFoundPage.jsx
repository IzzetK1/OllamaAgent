import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700">404</h1>
      <h2 className="text-2xl font-semibold mt-4 mb-6">Sayfa Bulunamadı</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link to="/" className="btn btn-primary flex items-center">
        <FiHome className="mr-2" />
        Ana Sayfaya Dön
      </Link>
    </div>
  );
};

export default NotFoundPage;