import React, { useState, useEffect, useRef } from 'react';
import { SmsSettings, NotificationSettings } from '../types';
import * as db from '../utils/storage';
import { CloseIcon, HelpIcon } from './Icons';

const InputField = ({ label, description, type = 'text', value, placeholder, name, onChange }: { label: string, description?: string, type?: string, value: string, placeholder?: string, name: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  
  return (
    <div>
      <label className="block text-lg font-semibold text-brand-text mb-1">{label}</label>
      {description && <p className="text-sm text-gray-500 mb-2">{description}</p>}
      <div className="relative">
        <input 
          type={isPassword && !show ? 'password' : 'text'}
          value={value}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-green"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 px-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

const ToggleSwitch = ({ label, description, enabled, setEnabled, disabled = false }: { label: string, description: React.ReactNode, enabled: boolean, setEnabled: (enabled: boolean) => void, disabled?: boolean }) => (
    <div className="flex justify-between items-center w-full">
      <div className="flex-grow pr-4">
        <h3 className="text-lg font-semibold text-brand-text">{label}</h3>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <button
        onClick={() => !disabled && setEnabled(!enabled)}
        disabled={disabled}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors flex-shrink-0 ${
            enabled && !disabled ? 'bg-brand-green' : 'bg-gray-200'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
);

const BackupInfoModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white text-brand-text w-full max-w-lg rounded-xl shadow-2xl border border-gray-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold">Cloud Backup Instructions</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-brand-text"><CloseIcon /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p>To securely back up your data to a cloud service like Google Drive or via email, please follow these two simple steps:</p>
                    <ol className="list-decimal list-inside space-y-2">
                        <li>Click the <strong>"Backup to This Device"</strong> button to download the complete database file (`spincity_backup.json`) to your computer.</li>
                        <li>
                            Once downloaded, manually upload this file to your preferred service:
                            <ul className="list-disc list-inside ml-4 mt-2">
                                <li><strong>Email:</strong> Attach the file to a new email and send it to `spincityrentallc@gmail.com`.</li>
                                <li><strong>Google Drive:</strong> Drag and drop the file into your Google Drive folder.</li>
                            </ul>
                        </li>
                    </ol>
                    <p className="font-semibold text-sm">This two-step process ensures your data remains secure and is never transmitted automatically.</p>
                </div>
                 <div className="flex justify-end p-6 bg-gray-50 rounded-b-xl">
                    <button onClick={onClose} className="bg-brand-green text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-green-dark">
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

const PermissionHelpModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    if (!isOpen) return null;

    const getBrowser = () => {
        const ua = navigator.userAgent;
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
        if (ua.includes("Edg")) return "Edge";
        if (ua.includes("Chrome")) return "Chrome";
        return "other";
    };

    const browser = getBrowser();

    const instructions = {
        Chrome: (
            <>
                <p>To allow automatic downloads in Chrome:</p>
                <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Go to Settings {'>'} Privacy and security {'>'} Site settings.</li>
                    <li>Scroll down and click on "Additional permissions".</li>
                    <li>Click on "Automatic downloads".</li>
                    <li>Under "Allowed to ask to automatically download multiple files", click "Add".</li>
                    <li>Enter the URL of this site and click "Add".</li>
                </ol>
            </>
        ),
        Edge: (
             <>
                <p>To allow automatic downloads in Edge:</p>
                <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>Go to Settings {'>'} Cookies and site permissions.</li>
                    <li>Scroll down and click on "Automatic downloads".</li>
                    <li>Under the "Allow" section, click "Add".</li>
                    <li>Enter the URL of this site and click "Add".</li>
                </ol>
            </>
        ),
        Firefox: (
            <p>Firefox handles downloads differently and may not have a per-site setting for automatic downloads. It will typically prompt you for each download, which is the recommended security practice.</p>
        ),
        Safari: (
            <p>Safari does not allow sites to trigger automatic downloads without user interaction. You will likely be prompted to "Allow" or "Deny" the download when you close the app.</p>
        ),
        other: (
            <p>Please consult your browser's documentation on how to manage "automatic downloads" permissions for specific websites.</p>
        )
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white text-brand-text w-full max-w-lg rounded-xl shadow-2xl border border-gray-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold flex items-center"><HelpIcon className="w-6 h-6 mr-3 text-brand-green"/>Automatic Backup Help</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-brand-text"><CloseIcon /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p>Modern browsers often block websites from automatically downloading files for security reasons. The "Automatic Backup on Exit" feature relies on this permission.</p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-bold text-lg mb-2">Instructions for {browser}</h3>
                        <div className="text-sm text-gray-700">{instructions[browser]}</div>
                    </div>
                </div>
                 <div className="flex justify-end p-6 bg-gray-50 rounded-b-xl">
                    <button onClick={onClose} className="bg-brand-green text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-green-dark">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

interface SettingsProps {
    onUpdateLogo: (logo: string | null) => void;
    currentLogo: string | null;
    smsSettings: SmsSettings;
    onUpdateSmsSettings: (settings: SmsSettings) => void;
    adminKey: string;
    onUpdateAdminKey: (key: string) => void;
    currentSplashLogo: string | null;
    onUpdateSplashLogo: (logo: string | null) => void;
    showNotification: (message: string) => void;
    onRestoreData: (jsonData: string) => void;
    autoBackupEnabled: boolean;
    onToggleAutoBackup: (enabled: boolean) => void;
    notificationSettings: NotificationSettings;
    onUpdateNotificationSettings: (settings: NotificationSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
    onUpdateLogo, 
    currentLogo, 
    smsSettings, 
    onUpdateSmsSettings, 
    adminKey, 
    onUpdateAdminKey,
    currentSplashLogo,
    onUpdateSplashLogo,
    showNotification,
    onRestoreData,
    autoBackupEnabled,
    onToggleAutoBackup,
    notificationSettings,
    onUpdateNotificationSettings
}) => {
    const [logoPreview, setLogoPreview] = useState<string | null>(currentLogo);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    
    const [splashLogoPreview, setSplashLogoPreview] = useState<string | null>(currentSplashLogo);
    const [splashLogoFile, setSplashLogoFile] = useState<File | null>(null);

    const [localSmsSettings, setLocalSmsSettings] = useState<SmsSettings>(smsSettings);
    const [localAdminKey, setLocalAdminKey] = useState(adminKey);
    
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
    const restoreInputRef = useRef<HTMLInputElement>(null);
    
    const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    useEffect(() => setLocalSmsSettings(smsSettings), [smsSettings]);
    useEffect(() => setLocalAdminKey(adminKey), [adminKey]);

    useEffect(() => {
        if (navigator.permissions && typeof navigator.permissions.query === 'function') {
            const permissionName = 'automatic-downloads' as PermissionName;
            navigator.permissions.query({ name: permissionName })
            .then((result) => {
                setPermissionStatus(result.state);
                result.onchange = () => {
                    setPermissionStatus(result.state);
                };
            })
            .catch((error) => {
                console.warn("Permission query for 'automatic-downloads' failed, falling back to 'unknown'.", error);
                setPermissionStatus('unknown');
            });
        } else {
            setPermissionStatus('unknown');
        }
    }, []);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const handleSaveLogo = () => {
        if (logoPreview) {
            onUpdateLogo(logoPreview);
            showNotification('Application Logo has been saved successfully.');
        }
    };

    const handleResetLogo = () => {
        setLogoPreview(null);
        setLogoFile(null);
        onUpdateLogo(null);
        showNotification('Logo has been reset to default.');
    };

    const handleSplashLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSplashLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setSplashLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSplashLogo = () => {
        onUpdateSplashLogo(splashLogoPreview);
        showNotification('Splash screen logo updated successfully!');
    };

    const handleResetSplashLogo = () => {
        setSplashLogoPreview(null);
        setSplashLogoFile(null);
        onUpdateSplashLogo(null);
        showNotification('Splash screen logo has been reset to default.');
    };

    const handleSmsSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalSmsSettings(prev => ({...prev, [name]: value}));
    };
    
    const handleSaveSmsSettings = () => {
        onUpdateSmsSettings(localSmsSettings);
        showNotification('SMS settings saved successfully!');
    };
    
    const handleSaveAdminKey = () => {
        if (localAdminKey.length < 4) {
            alert('Admin key must be at least 4 characters long.');
            return;
        }
        onUpdateAdminKey(localAdminKey);
    };

    const handleBackup = () => {
        showNotification('Preparing your backup...');

        setTimeout(() => {
            const jsonData = db.getBackupData();
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const date = new Date().toISOString().split('T')[0];
            link.download = `spincity_backup_${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showNotification('Backup download started. Check your browser.');
        }, 1000);
    };

    const handleRestoreClick = () => {
        restoreInputRef.current?.click();
    };

    const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (window.confirm("Are you sure you want to restore from this file? This will overwrite all current data.")) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                onRestoreData(content);
            };
            reader.readAsText(file);
        }
        e.target.value = ''; 
    };
    
    const isToggleDisabled = permissionStatus === 'denied';

    const getPermissionDescription = () => {
        switch (permissionStatus) {
            case 'granted':
                return 'Permission granted. Backup will download automatically on exit.';
            case 'denied':
                return 'Permission denied by browser. Toggle is disabled.';
            case 'prompt':
                return 'Your browser will ask for permission on the first backup.';
            default:
                return "Automatically saves a backup file when you close the app. May be blocked by your browser.";
        }
    };

    const handleNotificationToggle = (type: 'sms' | 'email', enabled: boolean) => {
        const newSettings = {
            ...notificationSettings,
            ...(type === 'sms' ? { smsEnabled: enabled } : { emailEnabled: enabled })
        };
        onUpdateNotificationSettings(newSettings);
        
        const notificationType = type === 'sms' ? 'SMS' : 'Email';
        const status = enabled ? 'turned on' : 'turned off';
        showNotification(`${notificationType} notifications have been ${status}.`);
    };


    return (
        <div className="p-8 text-brand-text">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>
            
            <div className="space-y-12">
                <section>
                    <h2 className="text-2xl font-bold border-b border-gray-200 pb-2 mb-6">Data Management</h2>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-brand-text">Backup & Restore</h3>
                            <p className="text-sm text-gray-500 mb-4">Save all your CMS data to a file, or restore it from a previous backup. It's recommended to back up daily.</p>
                            <div className="flex flex-wrap gap-4">
                                <button onClick={handleBackup} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Backup to This Device</button>
                                <button onClick={handleRestoreClick} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">Restore from Device</button>
                                <button onClick={() => setIsBackupModalOpen(true)} className="bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors">Backup to Cloud (Email/Drive)</button>
                                <input type="file" ref={restoreInputRef} onChange={handleRestoreFileChange} accept=".json" className="hidden" />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-200">
                           <ToggleSwitch 
                                label="Enable Automatic Backup on Exit" 
                                description={
                                    <div className="flex items-center">
                                        <span>{getPermissionDescription()}</span>
                                        <button onClick={() => setIsHelpModalOpen(true)} className="ml-2 text-gray-400 hover:text-brand-green flex-shrink-0">
                                            <HelpIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                }
                                enabled={autoBackupEnabled} 
                                setEnabled={onToggleAutoBackup} 
                                disabled={isToggleDisabled}
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold border-b border-gray-200 pb-2 mb-6">Branding</h2>
                    <div className="flex items-center space-x-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                         {logoPreview ? (
                            <img src={logoPreview} alt="Logo Preview" className="w-20 h-20 rounded-lg object-contain bg-white p-2 border-2 border-gray-300" />
                         ) : (
                            <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                                <p className="text-xs text-center text-gray-500">Default Logo</p>
                            </div>
                         )}
                         <div className="flex-grow">
                             <label className="block text-lg font-semibold text-brand-text mb-1">Application Logo</label>
                             <p className="text-sm text-gray-500 mb-3">Upload a new logo for the sidebar. Recommended size: 128x128px.</p>
                             <input type="file" accept="image/*" onChange={handleLogoChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-lime-50 file:text-lime-700 hover:file:bg-lime-100" />
                         </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                        <button onClick={handleResetLogo} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Reset to Default</button>
                        <button onClick={handleSaveLogo} className="bg-brand-green text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-green-dark" disabled={!logoFile && logoPreview === currentLogo}>
                            Save Logo
                        </button>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold border-b border-gray-200 pb-2 mb-6">Splash Screen</h2>
                    <div className="flex items-center space-x-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                         {splashLogoPreview ? (
                            <img src={splashLogoPreview} alt="Splash Logo Preview" className="w-20 h-20 rounded-lg object-contain bg-white p-2 border-2 border-gray-300" />
                         ) : (
                            <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
                                <p className="text-xs text-center text-gray-500">Default Logo</p>
                            </div>
                         )}
                         <div className="flex-grow">
                             <label className="block text-lg font-semibold text-brand-text mb-1">Splash Screen Logo</label>
                             <p className="text-sm text-gray-500 mb-3">Upload a new logo for the splash and login pages.</p>
                             <input type="file" accept="image/*" onChange={handleSplashLogoChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-lime-50 file:text-lime-700 hover:file:bg-lime-100" />
                         </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                        <button onClick={handleResetSplashLogo} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Reset to Default</button>
                        <button onClick={handleSaveSplashLogo} className="bg-brand-green text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-green-dark" disabled={!splashLogoFile && splashLogoPreview === currentSplashLogo}>
                            Save Splash Logo
                        </button>
                    </div>
                </section>
                
                <section>
                    <h2 className="text-2xl font-bold border-b border-gray-200 pb-2 mb-6">Twilio SMS Gateway Configuration</h2>
                    <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <InputField label="Twilio Account SID" description="Your Account SID from your Twilio dashboard." type="text" value={localSmsSettings.accountSid || ''} onChange={handleSmsSettingsChange} name="accountSid" />
                        <InputField label="Twilio Auth Token" description="Your Auth Token from your Twilio dashboard." type="password" value={localSmsSettings.authToken || ''} onChange={handleSmsSettingsChange} name="authToken" />
                        <InputField label="Twilio Phone Number" description="Your active Twilio phone number, including the country code." value={localSmsSettings.twilioPhoneNumber || ''} onChange={handleSmsSettingsChange} name="twilioPhoneNumber" placeholder="+1234567890" />
                    </div>
                    <div className="flex justify-end mt-6">
                       <button onClick={handleSaveSmsSettings} className="bg-brand-green text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-green-dark">
                           Save Twilio Settings
                       </button>
                   </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold border-b border-gray-200 pb-2 mb-6">Security & Registration</h2>
                    <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <InputField label="Admin Registration Key" description="This key is required for the initial admin registration." type="password" value={localAdminKey} name="adminKey" onChange={(e) => setLocalAdminKey(e.target.value)} />
                    </div>
                    <div className="flex justify-end mt-6">
                        <button onClick={handleSaveAdminKey} className="bg-brand-green text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-green-dark" disabled={localAdminKey === adminKey}>
                            Save Key
                        </button>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold border-b border-gray-200 pb-2 mb-6">Notifications</h2>
                    <div className="space-y-6">
                        <ToggleSwitch 
                            label="SMS Notifications" 
                            description="Receive notifications via SMS for important events." 
                            enabled={notificationSettings.smsEnabled} 
                            setEnabled={(enabled) => handleNotificationToggle('sms', enabled)} 
                        />
                        <ToggleSwitch 
                            label="Email Notifications" 
                            description="Receive notifications via email for summaries and alerts." 
                            enabled={notificationSettings.emailEnabled} 
                            setEnabled={(enabled) => handleNotificationToggle('email', enabled)}
                        />
                    </div>
                </section>
            </div>
            <BackupInfoModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} />
            <PermissionHelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
        </div>
    );
};

export default Settings;