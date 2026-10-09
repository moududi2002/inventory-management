// apps/web/src/components/settings/logo-uploader.tsx

'use client';

// Uploads a shop logo via /uploads/shop-logo.
//   - preview image (100×100)
//   - pick / replace / remove
//   - calls onChange(url|null) — parent saves via Settings PATCH

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api, getApiErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

interface LogoUploaderProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function LogoUploader({ value, onChange, disabled }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
      toast.error('Only JPEG, PNG, or WEBP allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5 MB');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post<{
        success: true;
        data: { upload: { url: string } };
      }>('/uploads/shop-logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data.data.upload.url);
      toast.success('Logo uploaded');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={disabled || uploading}
        className="hidden"
      />

      <div className="flex items-center gap-4">
        {/* Preview */}
        <div
          className={cn(
            'size-20 shrink-0 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden',
            value ? 'border-solid bg-card' : 'bg-muted/40',
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Logo"
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
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
              'Replace logo'
            ) : (
              'Choose logo'
            )}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              disabled={disabled || uploading}
              className="text-destructive hover:text-destructive justify-start -ml-2"
            >
              <Trash2 className="mr-2 size-3.5" />
              Remove
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            PNG, JPG, or WEBP · max 5 MB
          </p>
        </div>
      </div>
    </div>
  );
}
