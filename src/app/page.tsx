'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Define a type for the language options
type Language = 'en' | 'si' | 'ta';

// Define the structure of the hero text and card data
const heroText: Record<Language, string> = {
  en: 'GovLK Domain Registration',
  si: 'GovLK වසම් ලියාපදිංචි කිරීමේ ඉල්ලීම',
  ta: 'GovLK டொமைன் பதிவு',
};

type CardData = {
  title: string;
  description: string;
  link: string;
};

const cardData: Record<Language, CardData[]> = {
  en: [
    { title: 'Pre-Requirements', description: 'Review the necessary pre-requisites before applying.', link: '/instructions/reqirements' },
    { title: 'Instructions', description: 'Follow the detailed instructions to get started.', link: '/instructions/get-started' },
    { title: 'Form Upload', description: 'Upload your completed domain registration form here.', link: '/domain/upload-form' },
    { title: 'Support', description: 'Need help? Contact our support team for assistance.', link: '/support' },
  ],
  si: [
    { title: 'පූර්ව අවශ්‍යතා', description: 'අයදුම් කිරීමේදී අවශ්‍ය පෙර ඇරයුම් ඉදිරියට.', link: '/instructions/reqirements' },
    { title: 'උපදෙස්', description: 'ඉදිරියට යාමට විස්තරාත්මක උපදෙස් අනුගමනය කරන්න.', link: '/instructions/get-started' },
    { title: 'පෝරම උඩුගත කිරීම', description: 'ඔබේ සම්පූර්ණ වූ වසම් ලියාපදිංචි පෝරමය මෙහි උඩුගත කරන්න.', link: '/domain/upload-form' },
    { title: 'සහාය', description: 'උදව් අවශ්‍යද? සහාය සඳහා අපගේ කණ්ඩායම සම්බන්ධ කරන්න.', link: '/support' },
  ],
  ta: [
    { title: 'முன் தேவைகள்', description: 'விண்ணப்பிப்பதற்கு முன் தேவையான முன்பாடுகளை மதிப்பீடு செய்யவும்.', link: '/instructions/reqirements' },
    { title: 'வழிமுறைகள்', description: 'தொடங்குவதற்கான விரிவான வழிமுறைகளைப் பின்பற்றவும்.', link: '/instructions/get-started' },
    { title: 'படிவம் பதிவேற்றம்', description: 'உங்கள் முடிக்கப்பட்ட டொமைன் பதிவு படிவத்தை இங்கு பதிவேற்றவும்.', link: '/domain/upload-form' },
    { title: 'ஆதரவு', description: 'உதவி தேவைபடுகிறதா? உதவிக்காக எங்கள் குழுவைத் தொடர்பு கொள்ளவும்.', link: '/support' },
  ],
};

export default function HomePage() {
  const [language, setLanguage] = useState<Language>('en'); // Ensure language is of type 'Language'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-lg font-bold">GovLK Domain Registration</div>
          <div className="space-x-4">
            <button
              onClick={() => setLanguage('en')}
              className={`text-sm font-medium ${language === 'en' ? 'text-blue-600' : 'text-gray-600'}`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('si')}
              className={`text-sm font-medium ${language === 'si' ? 'text-blue-600' : 'text-gray-600'}`}
            >
              සිංහල
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`text-sm font-medium ${language === 'ta' ? 'text-blue-600' : 'text-gray-600'}`}
            >
              தமிழ்
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center py-20 bg-gradient-to-r from-blue-500 to-indigo-600">
        <h1 className="text-5xl font-bold animate-text-gradient">
          {heroText[language]}
        </h1>
      </section>

      {/* Cards Section */}
      <section className="container mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {cardData[language].map((card, index) => (
          <Link key={index} href={card.link} className="block bg-white shadow-lg rounded-lg p-6 hover:shadow-2xl transition-shadow duration-300">
            <h2 className="text-xl font-bold mb-2">{card.title}</h2>
            <p className="text-gray-600">{card.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
