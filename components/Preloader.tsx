import React from 'react';
import { defaultLogoBase64 } from '../assets/default-logo';

interface PreloaderProps {
    splashLogo: string | null;
}

const Preloader: React.FC<PreloaderProps> = ({ splashLogo }) => (
    <div className="absolute inset-0 flex flex-col justify-center items-center bg-brand-green z-50">
        <img 
            src={splashLogo || defaultLogoBase64} 
            alt="Spin City Rentals Logo" 
            className="w-80 h-auto object-contain" 
        />
        <p className="text-2xl text-white mt-6">Customer Management Service</p>
    </div>
);

export default Preloader;