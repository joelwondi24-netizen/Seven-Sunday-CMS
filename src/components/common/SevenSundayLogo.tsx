import React from 'react';

export const ORIGINAL_SEVEN_SUNDAY_LOGO_PATH =
  '/assets/aistudio/Seven_Sunday_Logo_2_desktop_addf2fa7.png';

interface SevenSundayLogoProps {
  customLogoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  onDark?: boolean;
  className?: string;
}

export const SevenSundayLogo: React.FC<SevenSundayLogoProps> = ({
  customLogoUrl,
  size = 'md',
  onDark = false,
  className = '',
}) => {
  const heightClass = size === 'sm' ? 'h-7' : size === 'lg' ? 'h-12' : 'h-9';
  const src = customLogoUrl || ORIGINAL_SEVEN_SUNDAY_LOGO_PATH;

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${
        onDark ? 'bg-white rounded-lg px-2.5 py-1.5 shadow-sm' : ''
      } ${className}`}
    >
      <img
        src={src}
        alt="Seven Sunday Ethiopia Official Logo"
        referrerPolicy="no-referrer"
        className={`${heightClass} w-auto max-w-full object-contain select-none`}
      />
    </div>
  );
};
