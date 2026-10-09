// apps/web/src/components/products/image-uploader.tsx

'use client';

// Single-image uploader.
//   - shows current image (or placeholder)
//   - "Choose image" → local file → POST /uploads/product-image
//   - returns { url } via onUploaded(url)
//   - "Remove" clears the image
//
// Uses FormData; JWT attaches automatically via the axios interceptor.

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api, getApiErrorMessage } from '@/lib/api';

interface ImageUploaderProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

interface UploadResponse {
  success: true;
  data: {
    upload: {
      url: string;
      filename: string;
      size: number;
      mimeType: string;
    };
  };
}

export function ImageUploader({ value, onChange, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    // Basic client-side pre-check (server enforces too).
    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
      toast.error('Only JPEG, PNG, or WEBP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post<UploadResponse>(
        '/uploads/product-image',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      onChange(res.data.data.upload.url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUploading(false);
      // Reset input value so the same file can be picked again if needed.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={disabled || uploading}
      />

      <div className="flex items-start gap-3">
        {/* Preview */}
        <div className="size-20 shrink-0 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Product"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={pickFile}
            disabled={disabled || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Uploading…
              </>
            ) : value ? (
              'Replace image'
            ) : (
              'Choose image'
            )}
          </Button>

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              disabled={disabled || uploading}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Remove
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            JPEG, PNG, or WEBP · max 5 MB
          </p>
        </div>
      </div>
    </div>
  );
}
