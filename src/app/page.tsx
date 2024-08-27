'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import './home.css'; // Ensure this import is present

type Language = 'en' | 'si' | 'ta';

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
    { title: 'Requirements', description: 'Review the necessary pre-requisites before applying.', link: '/instructions/reqirements' },
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
  const [language, setLanguage] = useState<Language>('en');

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-24">
      <div className="fixed top-0 right-0 m-4">
        <a
          className="flex place-items-center gap-2"
          href="https://icta.lk/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <Image
            src="/icta.jpg"
            alt="ICTA Logo"
            width={200} // Adjust width as needed
            height={86} // Calculated from original ratio (3833 x 1648)
            priority
          />
        </a>
      </div>

      <div className="language-selector">
        <button
          onClick={() => setLanguage('en')}
          className={`text-sm font-medium ${language === 'en' ? 'active' : ''}`}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('si')}
          className={`text-sm font-medium ${language === 'si' ? 'active' : ''}`}
        >
          සිංහල
        </button>
        <button
          onClick={() => setLanguage('ta')}
          className={`text-sm font-medium ${language === 'ta' ? 'active' : ''}`}
        >
          தமிழ்
        </button>
      </div>

      <div className="hero">
        <h1 className="text-5xl font-bold animate-text-gradient">
          {heroText[language]}
        </h1>
        <a
          href="/domain-request"
          className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 text-xl font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Get Started
        </a>
      </div>

      <div className="cards">
        {cardData[language].map((card, index) => (
          <a
            key={index}
            href={card.link}
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              {card.title}{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              {card.description}
            </p>
          </a>
        ))}
      </div>
    </main>
  );
}
