import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Camera, X, Loader2 } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  formState: {
    childName: string;
    age: string;
    description: string;
    isPublic: boolean;
    imageFile: File | null;
    previewUrl: string;
    uploadProgress: number;
    isUploading: boolean;
  };
  setFormState: React.Dispatch<React.SetStateAction<{
    childName: string;
    age: string;
    description: string;
    isPublic: boolean;
    imageFile: File | null;
    previewUrl: string;
    uploadProgress: number;
    isUploading: boolean;
  }>>;
}

export const UploadModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formState, 
  setFormState 
}: UploadModalProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (file.size > 5 * 1024 * 1024) {
          return;
        }
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
          return;
        }
        setFormState(prev => ({
          ...prev,
          imageFile: file,
          previewUrl: URL.createObjectURL(file)
        }));
      }
    }, []),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Share Your Creation</h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100"
              disabled={formState.isUploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="childName">Child's Name *</Label>
                <Input
                  id="childName"
                  value={formState.childName}
                  onChange={(e) => setFormState(prev => ({...prev, childName: e.target.value}))}
                  required
                  minLength={2}
                  disabled={formState.isUploading}
                />
              </div>

              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="18"
                  value={formState.age}
                  onChange={(e) => setFormState(prev => ({...prev, age: e.target.value}))}
                  required
                  disabled={formState.isUploading}
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formState.description}
                  onChange={(e) => setFormState(prev => ({...prev, description: e.target.value}))}
                  maxLength={200}
                  disabled={formState.isUploading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Visibility</Label>
                  <p className="text-xs text-gray-500">
                    {formState.isPublic 
                      ? "Public (visible to everyone)" 
                      : "Private (share only via WhatsApp)"}
                  </p>
                </div>
                <Switch
                  checked={formState.isPublic}
                  onCheckedChange={(checked) => setFormState(prev => ({...prev, isPublic: checked}))}
                  disabled={formState.isUploading}
                />
              </div>

              <div>
                <Label>Upload Image *</Label>
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  } ${formState.isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getInputProps()} disabled={formState.isUploading} />
                  {formState.previewUrl ? (
                    <div className="relative">
                      <img 
                        src={formState.previewUrl} 
                        alt="Preview" 
                        className="mx-auto max-h-48 rounded-md mb-2"
                        loading="lazy"
                      />
                      {!formState.isUploading && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormState(prev => ({...prev, imageFile: null, previewUrl: ""}));
                          }}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <Camera className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG (max 5MB)</p>
                    </>
                  )}
                </div>
              </div>

              {formState.isUploading && (
                <div className="pt-2">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${formState.uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-gray-600 mt-1">
                    Uploading... {formState.uploadProgress}%
                  </p>
                </div>
              )}

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                  disabled={!formState.imageFile || !formState.childName || !formState.age || formState.isUploading}
                >
                  {formState.isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : formState.isPublic ? (
                    'Share Publicly'
                  ) : (
                    'Share Privately via WhatsApp'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};