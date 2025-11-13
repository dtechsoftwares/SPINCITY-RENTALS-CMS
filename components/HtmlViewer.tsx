import React, { useState, useEffect } from 'react';

declare var JSZip: any;
declare var saveAs: any;

const dataURLtoBlob = (dataurl: string) => {
    try {
        const arr = dataurl.split(',');
        if (arr.length < 2) return null;
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) return null;
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    } catch (e) {
        console.error("Error converting data URL to blob", e);
        return null;
    }
};

interface FoundImage {
    base64: string;
    type: string;
    name: string;
    extension: string;
}

const HtmlViewer: React.FC = () => {
    const [htmlContent, setHtmlContent] = useState('');
    const [images, setImages] = useState<FoundImage[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (htmlContent) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;

            // Extract Customer Name
            let extractedName = '';
            const listItems = Array.from(tempDiv.querySelectorAll('li'));
            const nameLi = listItems.find(li => li.textContent?.includes('Name:'));
            if (nameLi) {
                extractedName = nameLi.textContent.replace('Name:', '').trim();
            }
            setCustomerName(extractedName);

            // Extract Images
            const imgElements = Array.from(tempDiv.querySelectorAll('img'));
            const foundImages = imgElements
                .map(img => img.src)
                .filter(src => src && src.startsWith('data:image/'))
                .map((src, index) => {
                    const mimeMatch = src.match(/data:(image\/(.*?));base64,/);
                    const type = mimeMatch ? mimeMatch[1] : 'image/png';
                    const extension = mimeMatch ? mimeMatch[2] : 'png';
                    return {
                        base64: src,
                        type: type,
                        name: `image_${index + 1}.${extension}`,
                        extension,
                    };
                });
            setImages(foundImages);
        } else {
            setImages([]);
            setCustomerName('');
        }
    }, [htmlContent]);


    const handleClear = () => {
        setHtmlContent('');
    };

    const handleDownload = async () => {
        if (images.length === 0) return;
        setIsDownloading(true);

        const sanitizedName = customerName.replace(/[^a-z0-9_-\s]/gi, '').trim().replace(/\s+/g, '_') || 'repair_request';

        if (images.length === 1) {
            const image = images[0];
            const blob = dataURLtoBlob(image.base64);
            if(blob) {
                saveAs(blob, `${sanitizedName}_${image.name}`);
            } else {
                alert('Could not process the image for download.');
            }
            setIsDownloading(false);
        } else {
            const zip = new JSZip();
            images.forEach((image) => {
                const blob = dataURLtoBlob(image.base64);
                if(blob) {
                    zip.file(image.name, blob);
                }
            });

            try {
                const content = await zip.generateAsync({ type: 'blob' });
                saveAs(content, `${sanitizedName}_images.zip`);
            } catch (error) {
                console.error("Error creating zip file", error);
                alert("There was an error creating the zip file.");
            } finally {
                setIsDownloading(false);
            }
        }
    };

    const placeholderText = `<!-- 
  Welcome to the HTML Viewer!

  1. Open the repair request email in your email client (e.g., Titan Mail, Gmail).
  2. Find the option to view the "original" or "raw source" of the email.
  3. Copy the entire HTML content.
  4. Paste it here to see the rendered email, including images.
-->`;

    return (
        <div className="p-4 sm:p-8 text-brand-text h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold">HTML Email Viewer</h1>
                    <p className="text-gray-500 mt-1">
                        Paste raw email HTML to render content and download embedded images.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                    <button
                        onClick={handleDownload}
                        disabled={images.length === 0 || isDownloading}
                        className="w-full sm:w-auto bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isDownloading ? 'Processing...' : `Download Image(s)`}
                    </button>
                    <button
                        onClick={handleClear}
                        className="w-full sm:w-auto bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                {/* HTML Input Panel */}
                <div className="flex flex-col h-full min-h-[300px] md:min-h-0">
                    <h2 className="text-lg font-semibold mb-2">HTML Source Code</h2>
                    <textarea
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        placeholder={placeholderText}
                        className="w-full flex-1 bg-gray-800 text-gray-200 font-mono text-sm p-4 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
                        spellCheck="false"
                    />
                </div>

                {/* Rendered Preview Panel */}
                <div className="flex flex-col h-full min-h-[300px] md:min-h-0">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2 gap-2">
                        <h2 className="text-lg font-semibold">Live Preview</h2>
                        <div className="text-sm bg-gray-100 px-3 py-1 rounded-full text-center">
                            <span className="font-semibold">{customerName || 'No Name Detected'}</span> | <span className="text-brand-green font-semibold">{images.length}</span> Image(s) Found
                        </div>
                    </div>
                    <div className="w-full flex-1 bg-white p-4 rounded-lg border border-gray-300 overflow-y-auto">
                        {htmlContent ? (
                            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <p>Preview will appear here...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HtmlViewer;
