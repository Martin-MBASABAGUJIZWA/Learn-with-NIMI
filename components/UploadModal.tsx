'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { X, Camera, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: (creation: any) => void;
  childName: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const UploadModal: React.FC<UploadModalProps> = ({ 
  onClose, 
  onSuccess, 
  childName 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null);
    
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.errors.some(e => e.code === 'file-too-large')) {
        setError(`File is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
        setError('Only image files are allowed (JPEG, PNG, GIF, WEBP)');
      } else {
        setError('Unable to process file');
      }
      return;
    }

    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    disabled: isUploading
  });

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);

    // Simulate progress (replace with actual progress events if needed)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 10;
        return Math.min(prev + increment, 90);
      });
    }, 300);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('childName', childName);
      formData.append('description', description);
      formData.append('isPublic', String(isPublic));

      const response = await fetch('/api/creations/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          
          if (errorData.maxSize) {
            errorMessage += ` (Max: ${Math.round(errorData.maxSize / 1024 / 1024)}MB)`;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }

        throw new Error(`${errorMessage} [Status: ${response.status}]`);
      }

      const result = await response.json();
      
      // Small delay for UI polish
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess(result);

    } catch (err: any) {
      console.error('Upload error:', err);
      
      let errorMessage = err.message || 'Upload failed. Please try again.';
      
      // Improve specific error messages
      if (err.message.includes('413')) {
        errorMessage = 'File is too large. Maximum size is 5MB.';
      } else if (err.message.includes('415')) {
        errorMessage = 'Unsupported file type. Please upload an image.';
      } else if (err.message.includes('507')) {
        errorMessage = 'Server storage full. Please try again later.';
      } else if (err.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setError(errorMessage);
      setProgress(0);
      
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setDescription('');
    setIsPublic(true);
    setProgress(0);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {success ? 'Upload Complete!' : 'Share Your Creation'}
            </h2>
            <button
              onClick={() => {
                if (!isUploading) {
                  resetForm();
                  onClose();
                }
              }}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              disabled={isUploading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Successfully Uploaded!
              </h3>
              <p className="text-gray-600 mb-6">
                Your artwork has been shared with the community.
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <div 
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors mb-4 ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : error 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
              >
                <input {...getInputProps()} />
                {preview ? (
                  <div className="relative h-48 w-full rounded-md overflow-hidden mb-4">
                    <img
                      src={preview}
                      alt="Preview"
                      className="object-contain w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                      {error ? (
                        <AlertCircle className="h-6 w-6 text-red-500" />
                      ) : isDragActive ? (
                        <UploadCloud className="h-6 w-6 text-blue-500" />
                      ) : (
                        <Camera className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {error 
                        ? 'Try another file' 
                        : isDragActive 
                          ? 'Drop your artwork here' 
                          : 'Drag & drop or click to select'}
                    </p>
                    <p className="text-xs text-gray-500">
                      JPEG, PNG, GIF, WEBP (max 5MB)
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
                  <div className="font-medium flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Upload Error
                  </div>
                  <div className="mt-1">{error}</div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tell us about your art
                  </label>
                  <Input
                    placeholder="What did you create? (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isUploading}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="visibility"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    disabled={isUploading}
                  />
                  <label htmlFor="visibility" className="text-sm font-medium text-gray-700">
                    {isPublic ? 'Public (Visible to everyone)' : 'Private (Only visible to family)'}
                  </label>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-gray-500 text-center">
                      {progress < 30 && 'Starting upload...'}
                      {progress >= 30 && progress < 70 && 'Uploading your artwork...'}
                      {progress >= 70 && progress < 100 && 'Processing...'}
                      {progress === 100 && 'Finalizing...'}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <Button
                    onClick={() => {
                      if (!isUploading) {
                        resetForm();
                        onClose();
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    disabled={!file || isUploading}
                  >
                    {isUploading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      'Share Artwork'
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};