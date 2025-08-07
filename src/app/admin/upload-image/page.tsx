'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ImageUploadPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<{name: string, url: string}[]>([]);

  // Password Authentication
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Loiza') {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setSelectedImages(files);
    
    // Create preview URLs
    if (files) {
      const previews: {name: string, url: string}[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = URL.createObjectURL(file);
        previews.push({ name: file.name, url });
      }
      setPreviewImages(previews);
    } else {
      setPreviewImages([]);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImages || selectedImages.length === 0) {
      setUploadStatus('Please select images to upload.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('');
    const uploadedImagesList: string[] = [];
    const failedUploads: string[] = [];

    try {
      for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i];
        const formData = new FormData();
        formData.append('image', file);

        try {
          const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            uploadedImagesList.push(result.filename);
          } else {
            const error = await response.json();
            failedUploads.push(`${file.name}: ${error.error}`);
          }
        } catch (error) {
          failedUploads.push(`${file.name}: Upload failed`);
        }
      }

      // Update status
      if (uploadedImagesList.length > 0) {
        setUploadedImages(prev => [...prev, ...uploadedImagesList]);
        
        if (failedUploads.length > 0) {
          setUploadStatus(`✅ Uploaded ${uploadedImagesList.length} images. ❌ Failed: ${failedUploads.length}`);
        } else {
          setUploadStatus(`✅ Successfully uploaded all ${uploadedImagesList.length} images!`);
        }
      } else {
        setUploadStatus(`❌ All uploads failed: ${failedUploads.join(', ')}`);
      }

      // Reset form
      setSelectedImages(null);
      setPreviewImages([]);
      const fileInput = document.getElementById('imageInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('❌ Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = () => {
    setSelectedImages(null);
    setPreviewImages([]);
    setUploadStatus('');
    setUploadedImages([]);
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Password Protection Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Admin Access Required
              </h1>
              <p className="text-gray-600 mb-6">
                Please enter the admin password to access the image upload system.
              </p>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                {passwordError && (
                  <p className="text-red-600 text-sm">{passwordError}</p>
                )}
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Access Image Upload
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin/upload" className="text-blue-600 hover:text-blue-800">
                ← Back to Admin
              </Link>
              <h1 className="text-2xl font-bold text-blue-600">
                📸 Image Upload Manager
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Home
              </Link>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Upload Lesson Images
          </h2>
          
          <div className="space-y-6">
            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Image Files
              </label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="imageInput" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">JPG, PNG, WEBP (Max 5MB each)</p>
                  </div>
                  <input
                    id="imageInput"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelection}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Naming convention:</strong> 001_Topic_Name_Level_Language.jpg
              </p>
            </div>

            {/* Preview Section */}
            {previewImages.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Selected Images ({previewImages.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {previewImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <p className="text-xs text-gray-600 mt-1 truncate" title={img.name}>
                        {img.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleImageUpload}
                disabled={isUploading || !selectedImages || selectedImages.length === 0}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isUploading ? `Uploading ${selectedImages?.length || 0} images...` : 'Upload Images'}
              </button>
              
              <button
                onClick={clearAll}
                disabled={isUploading}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors font-medium"
              >
                Clear All
              </button>
            </div>

            {/* Status Messages */}
            {uploadStatus && (
              <div className={`p-4 rounded-lg text-sm ${
                uploadStatus.includes('✅') 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {uploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Recently Uploaded Images */}
        {uploadedImages.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Recently Uploaded Images ({uploadedImages.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {uploadedImages.map((filename, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-green-600">✅</div>
                  <span className="text-sm text-gray-700 flex-1 truncate" title={filename}>
                    {filename}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4">
            📖 Image Upload Guidelines
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">File Requirements:</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• Formats: JPG, PNG, WEBP</li>
                <li>• Maximum size: 5MB per image</li>
                <li>• Multiple files can be uploaded at once</li>
                <li>• Images are stored in /public/images/lessons/</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Naming Convention:</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• Format: WeekNumber_TopicName_Level_Language.jpg</li>
                <li>• Example: 001_Singapore_Cat_Ban_Beginner_English.jpg</li>
                <li>• Example: 000_Glass_Making_Intermediate_Czech.jpg</li>
                <li>• Use underscores instead of spaces</li>
                <li>• Match exactly with lesson file names</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>💡 Tip:</strong> Upload images first, then upload your lesson files. The lesson parser will automatically link to images with matching names.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <Link
            href="/admin/upload"
            className="inline-flex items-center px-6 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            📚 Go to Lesson Upload →
          </Link>
        </div>
      </div>
    </div>
  );
}