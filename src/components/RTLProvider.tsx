'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface RTLContextType {
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  textAlign: 'left' | 'right';
  marginStart: 'ml' | 'mr';
  marginEnd: 'mr' | 'ml';
  paddingStart: 'pl' | 'pr';
  paddingEnd: 'pr' | 'pl';
  borderStart: 'border-l' | 'border-r';
  borderEnd: 'border-r' | 'border-l';
  roundedStart: 'rounded-l' | 'rounded-r';
  roundedEnd: 'rounded-r' | 'rounded-l';
}

const RTLContext = createContext<RTLContextType | undefined>(undefined);

export const useRTL = () => {
  const context = useContext(RTLContext);
  if (!context) {
    throw new Error('useRTL must be used within an RTLProvider');
  }
  return context;
};

interface RTLProviderProps {
  children: React.ReactNode;
  locale: string;
}

const RTLProvider: React.FC<RTLProviderProps> = ({ children, locale }) => {
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    // RTL languages
    const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'yi'];
    setIsRTL(rtlLanguages.includes(locale));
  }, [locale]);

  const direction = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';

  const contextValue: RTLContextType = {
    isRTL,
    direction,
    textAlign,
    marginStart: isRTL ? 'mr' : 'ml',
    marginEnd: isRTL ? 'ml' : 'mr',
    paddingStart: isRTL ? 'pr' : 'pl',
    paddingEnd: isRTL ? 'pl' : 'pr',
    borderStart: isRTL ? 'border-r' : 'border-l',
    borderEnd: isRTL ? 'border-l' : 'border-r',
    roundedStart: isRTL ? 'rounded-r' : 'rounded-l',
    roundedEnd: isRTL ? 'rounded-l' : 'rounded-r',
  };

  return (
    <RTLContext.Provider value={contextValue}>
      <div dir={direction} className={isRTL ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </RTLContext.Provider>
  );
};

export default RTLProvider;
