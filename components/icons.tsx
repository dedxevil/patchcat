import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

export const MenuIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

// FIX: Converted kebab-case SVG attributes to camelCase for JSX compatibility and spread props.
export const SparklesIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3L9.27 9.27L3 12l6.27 2.73L12 21l2.73-6.27L21 12l-6.27-2.73L12 3z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export const HistoryIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"  {...props}><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>

  // <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
  //   <path d="M1 4v6h6" />
  //   <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  // </svg>
);

export const SettingsIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export const SendIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

export const CopyIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

export const SearchIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

export const EyeIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
);
  
export const EyeOffIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

export const PlugIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 17v5"></path>
        <path d="M9 14h6"></path>
        <path d="M15 7h1a2 2 0 012 2v2.5a2.5 2.5 0 01-2.5 2.5h-7A2.5 2.5 0 016 11.5V9a2 2 0 012-2h1"></path>
        <path d="M8 7V2"></path>
        <path d="M16 7V2"></path>
    </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

export const XCircleIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
);

// FIX: Converted kebab-case SVG attributes to camelCase for JSX compatibility (e.g., xmlns:xlink to xmlnsXlink) and spread props to the SVG element.
const NewPatchcatLogoSvg: React.FC<IconProps> = (props) => (
   <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="25" zoomAndPan="magnify" viewBox="0 0 37.5 37.499999" height="50" preserveAspectRatio="xMidYMid meet" version="1.0" {...props}><defs><clipPath id="d563d2f6e7"><path d="M 2.175781 2.296875 L 34.742188 2.296875 L 34.742188 34.863281 L 2.175781 34.863281 Z M 2.175781 2.296875 " clipRule="nonzero"/></clipPath><clipPath id="ea0e18acd5"><path d="M 3.699219 15.535156 L 34.785156 15.535156 L 34.785156 28 L 3.699219 28 Z M 3.699219 15.535156 " clipRule="nonzero"/></clipPath></defs><g clipPath="url(#d563d2f6e7)"><path fill="#ffffff" d="M 33.308594 15.484375 L 32.613281 9.957031 L 31.78125 3.347656 C 31.699219 2.675781 30.882812 2.386719 30.394531 2.855469 L 25.585938 7.464844 L 24.429688 8.574219 C 22.589844 7.980469 20.589844 7.652344 18.5 7.652344 C 16.429688 7.652344 14.453125 7.96875 12.632812 8.550781 L 11.410156 7.378906 L 6.601562 2.769531 C 6.113281 2.300781 5.296875 2.589844 5.214844 3.261719 L 4.382812 9.871094 L 3.671875 15.507812 C 2.710938 17.234375 2.175781 19.152344 2.175781 21.175781 C 2.175781 28.644531 9.484375 34.699219 18.5 34.699219 C 27.511719 34.699219 34.820312 28.644531 34.820312 21.175781 C 34.820312 19.140625 34.28125 17.214844 33.308594 15.484375 Z M 33.308594 15.484375 " fillOpacity="1" fillRule="nonzero"/></g><g clipPath="url(#ea0e18acd5)"><path fill="#0d0d0e" d="M 34.742188 19.371094 C 34.722656 19.539062 34.582031 19.664062 34.414062 19.664062 C 34.402344 19.664062 34.390625 19.664062 34.378906 19.660156 C 32.507812 19.453125 31.210938 19.367188 29.03125 19.121094 C 28.980469 20.039062 28.457031 27.921875 21.601562 27.179688 C 15.1875 26.484375 16.136719 18.792969 16.355469 17.621094 C 9.605469 16.84375 4.164062 16.214844 4.0625 16.203125 C 3.882812 16.183594 3.753906 16.019531 3.773438 15.839844 C 3.792969 15.660156 3.957031 15.535156 4.136719 15.550781 C 4.328125 15.574219 23.265625 17.765625 34.453125 19.007812 C 34.632812 19.027344 34.761719 19.191406 34.742188 19.371094 Z M 34.742188 19.371094 C 34.722656 19.539062 34.582031 19.664062 34.414062 19.664062 C 34.402344 19.664062 34.390625 19.664062 34.378906 19.660156 C 32.507812 19.453125 31.210938 19.367188 29.03125 19.121094 C 28.980469 20.039062 28.457031 27.921875 21.601562 27.179688 C 15.1875 26.484375 16.136719 18.792969 16.355469 17.621094 C 9.605469 16.84375 4.164062 16.214844 4.0625 16.203125 C 3.882812 16.183594 3.753906 16.019531 3.773438 15.839844 C 3.792969 15.660156 3.957031 15.535156 4.136719 15.550781 C 4.328125 15.574219 23.265625 17.765625 34.453125 19.007812 C 34.632812 19.027344 34.761719 19.191406 34.742188 19.371094 Z M 34.742188 19.371094 " fillOpacity="1" fillRule="nonzero"/></g></svg>
);

export const PatchcatLogo: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
    <div className="flex items-center gap-2" {...props}>
        <NewPatchcatLogoSvg className="w-8 h-8 text-white" />
        <h1 className="text-xl font-bold tracking-wider text-text-default hidden sm:block">Patchcat</h1>
    </div>
);

// FIX: Changed props from React.HTMLAttributes<HTMLDivElement> to IconProps to match the underlying SVG component.
export const PatchcatLogoIconOnly: React.FC<IconProps> = (props) => (
    <NewPatchcatLogoSvg className="w-10 h-10 text-white" {...props} />
);