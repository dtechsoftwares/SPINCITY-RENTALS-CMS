import React from 'react';

interface PreloaderProps {
    splashLogo: string | null;
}

const DefaultLogo = ({ className }: { className?: string}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m-3-1l-3-1m3 1v5.25m-3-5.25v5.25m-3-5.25l3 1m-3-1l-3 1m0 0v5.25m0 0l3 1m-3-1l-3-1" />
    </svg>
);

const Preloader: React.FC<PreloaderProps> = ({ splashLogo }) => (
    <div className="absolute inset-0 flex flex-col justify-center items-center bg-brand-green z-50">
        {splashLogo ? (
            <img src={splashLogo} alt="Spin City Rentals Logo" className="w-80 h-auto" />
        ) : (
            <DefaultLogo className="w-80 h-auto text-white" />
        )}
    </div>
);

export default Preloader;