'use client';
import React, { useState, useEffect } from 'react';
import { DollarSign, Euro, Yen, Won, Shekel, CreditCard, Circle } from 'lucide-react';

interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  icon: React.ReactNode;
  regions: string[];
  rate: number; // Exchange rate to USD
}

interface CurrencyLocalizationProps {
  locale: string;
  amount: number;
}

const CurrencyLocalization: React.FC<CurrencyLocalizationProps> = ({ locale, amount }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyInfo | null>(null);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);

  const currencies: CurrencyInfo[] = [
    {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      icon: <DollarSign className="w-4 h-4" />,
      regions: ['en'],
      rate: 1.0
    },
    {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      icon: <Euro className="w-4 h-4" />,
      regions: ['es', 'fr', 'de'],
      rate: 0.85
    },
    {
      code: 'SAR',
      symbol: 'ر.س',
      name: 'Saudi Riyal',
      icon: <CreditCard className="w-4 h-4" />,
      regions: ['ar'],
      rate: 3.75
    },
    {
      code: 'ILS',
      symbol: '₪',
      name: 'Israeli Shekel',
      icon: <Shekel className="w-4 h-4" />,
      regions: ['he'],
      rate: 3.65
    },
    {
      code: 'JPY',
      symbol: '¥',
      name: 'Japanese Yen',
      icon: <Yen className="w-4 h-4" />,
      regions: ['ja'],
      rate: 110.0
    },
    {
      code: 'KRW',
      symbol: '₩',
      name: 'South Korean Won',
      icon: <Won className="w-4 h-4" />,
      regions: ['ko'],
      rate: 1200.0
    },
    {
      code: 'CNY',
      symbol: '¥',
      name: 'Chinese Yuan',
      icon: <Yen className="w-4 h-4" />,
      regions: ['zh'],
      rate: 6.45
    },
    {
      code: 'RUB',
      symbol: '₽',
      name: 'Russian Ruble',
      icon: <Circle className="w-4 h-4" />,
      regions: ['ru'],
      rate: 75.0
    },
    {
      code: 'INR',
      symbol: '₹',
      name: 'Indian Rupee',
      icon: <DollarSign className="w-4 h-4" />,
      regions: ['hi', 'ta', 'te', 'bn', 'gu', 'mr', 'sa'],
      rate: 83.0
    }
  ];

  useEffect(() => {
    // Find currency for current locale
    const currency = currencies.find(curr => curr.regions.includes(locale)) || currencies[0];
    setSelectedCurrency(currency);
    
    // Convert amount
    const converted = amount * currency.rate;
    setConvertedAmount(converted);
  }, [locale, amount]);

  const formatCurrency = (amount: number, currency: CurrencyInfo) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (!selectedCurrency) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-blue-600 dark:text-blue-400 mr-2">
            {selectedCurrency.icon}
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Local Price</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(convertedAmount, selectedCurrency)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {selectedCurrency.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {selectedCurrency.code}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CurrencyLocalization;
