'use client';
import React, { useState, useEffect } from 'react';
import { Globe, Shield, CreditCard, Clock, Users, FileText, CheckCircle } from 'lucide-react';

interface RegionalFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  regions: string[];
}

interface RegionalFeaturesProps {
  locale: string;
}

const RegionalFeatures: React.FC<RegionalFeaturesProps> = ({ locale }) => {
  const [features, setFeatures] = useState<RegionalFeature[]>([]);

  useEffect(() => {
    const regionalFeatures: RegionalFeature[] = [
      {
        id: 'local-formats',
        name: 'Local File Formats',
        description: 'Support for region-specific file formats and standards',
        icon: <FileText className="w-5 h-5" />,
        available: true,
        regions: ['en', 'es', 'fr', 'de', 'ar', 'he', 'ja', 'ko', 'zh', 'ru']
      },
      {
        id: 'security-standards',
        name: 'Regional Security Standards',
        description: 'Compliance with local data protection and security regulations',
        icon: <Shield className="w-5 h-5" />,
        available: true,
        regions: ['en', 'es', 'fr', 'de', 'ar', 'he']
      },
      {
        id: 'local-payment',
        name: 'Local Payment Methods',
        description: 'Support for region-specific payment methods and currencies',
        icon: <CreditCard className="w-5 h-5" />,
        available: true,
        regions: ['en', 'es', 'fr', 'de', 'ar', 'he', 'ja', 'ko', 'zh', 'ru']
      },
      {
        id: 'timezone-support',
        name: 'Timezone Support',
        description: 'Automatic timezone detection and local time display',
        icon: <Clock className="w-5 h-5" />,
        available: true,
        regions: ['en', 'es', 'fr', 'de', 'ar', 'he', 'ja', 'ko', 'zh', 'ru']
      },
      {
        id: 'local-support',
        name: 'Local Customer Support',
        description: 'Customer support in your local language and timezone',
        icon: <Users className="w-5 h-5" />,
        available: true,
        regions: ['en', 'es', 'fr', 'de', 'ar', 'he']
      },
      {
        id: 'compliance',
        name: 'Regional Compliance',
        description: 'GDPR, CCPA, and other regional compliance requirements',
        icon: <CheckCircle className="w-5 h-5" />,
        available: true,
        regions: ['en', 'es', 'fr', 'de', 'ar', 'he']
      }
    ];

    // Filter features available for current locale
    const availableFeatures = regionalFeatures.filter(feature => 
      feature.regions.includes(locale) && feature.available
    );
    
    setFeatures(availableFeatures);
  }, [locale]);

  const getRegionInfo = (locale: string) => {
    const regionMap: Record<string, { name: string; currency: string; timezone: string }> = {
      'en': { name: 'United States', currency: 'USD', timezone: 'America/New_York' },
      'es': { name: 'Spain', currency: 'EUR', timezone: 'Europe/Madrid' },
      'fr': { name: 'France', currency: 'EUR', timezone: 'Europe/Paris' },
      'de': { name: 'Germany', currency: 'EUR', timezone: 'Europe/Berlin' },
      'ar': { name: 'Saudi Arabia', currency: 'SAR', timezone: 'Asia/Riyadh' },
      'he': { name: 'Israel', currency: 'ILS', timezone: 'Asia/Jerusalem' },
      'ja': { name: 'Japan', currency: 'JPY', timezone: 'Asia/Tokyo' },
      'ko': { name: 'South Korea', currency: 'KRW', timezone: 'Asia/Seoul' },
      'zh': { name: 'China', currency: 'CNY', timezone: 'Asia/Shanghai' },
      'ru': { name: 'Russia', currency: 'RUB', timezone: 'Europe/Moscow' },
      'hi': { name: 'India (Hindi)', currency: 'INR', timezone: 'Asia/Kolkata' },
      'ta': { name: 'India (Tamil)', currency: 'INR', timezone: 'Asia/Kolkata' },
      'te': { name: 'India (Telugu)', currency: 'INR', timezone: 'Asia/Kolkata' },
      'bn': { name: 'India (Bengali)', currency: 'INR', timezone: 'Asia/Kolkata' },
      'gu': { name: 'India (Gujarati)', currency: 'INR', timezone: 'Asia/Kolkata' },
      'mr': { name: 'India (Marathi)', currency: 'INR', timezone: 'Asia/Kolkata' },
      'sa': { name: 'India (Sanskrit)', currency: 'INR', timezone: 'Asia/Kolkata' }
    };
    
    return regionMap[locale] || regionMap['en'];
  };

  const regionInfo = getRegionInfo(locale);

  if (features.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 mb-8">
      <div className="flex items-center mb-4">
        <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Regional Features for {regionInfo.name}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center mb-2">
              <div className="text-blue-600 dark:text-blue-400 mr-2">
                {feature.icon}
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {feature.name}
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p>Currency: {regionInfo.currency} | Timezone: {regionInfo.timezone}</p>
      </div>
    </div>
  );
};

export default RegionalFeatures;
