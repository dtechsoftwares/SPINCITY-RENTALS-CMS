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
        <div className="text-center text-white mt-4">
            <h1 className="text-3xl font-bold">SpinCity Rentals</h1>
            <p className="text-lg">Customer Management Service</p>
        </div>
    </div>
);

export default Preloader;
