"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Check, Upload, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/contexts/ThemeContext";

interface ProfileImagePickerProps {
  currentImage: string | null;
  onImageChange: (image: string | null) => void;
}

// Preset images grouped by style
const PRESET_GROUPS = [
  {
    id: 1,
    light: "/images/profile/Icon-1-light.jpg",
    dark: "/images/profile/Icon-1-dark.jpg",
  },
  {
    id: 2,
    light: "/images/profile/Icon-2-light.jpg",
    dark: "/images/profile/Icon-2-dark.jpg",
  },
  {
    id: 3,
    light: "/images/profile/Icon-3-light.jpg",
    dark: "/images/profile/Icon-3-dark.jpg",
  },
  {
    id: 4,
    light: "/images/profile/Icon-4-light.jpg",
    dark: "/images/profile/Icon-4-dark.jpg",
  },
];

export function ProfileImagePicker({
  currentImage,
  onImageChange,
}: ProfileImagePickerProps) {
  const { effectiveMode } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<"light" | "dark">("light");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if current image is a preset
  const getCurrentPresetInfo = () => {
    if (!currentImage) return null;
    for (const group of PRESET_GROUPS) {
      if (currentImage === group.light) return { id: group.id, variant: "light" as const };
      if (currentImage === group.dark) return { id: group.id, variant: "dark" as const };
    }
    return null;
  };

  const presetInfo = getCurrentPresetInfo();
  const isCustomImage = currentImage && !presetInfo;

  const handlePresetSelect = (groupId: number, variant: "light" | "dark") => {
    const group = PRESET_GROUPS.find((g) => g.id === groupId);
    if (group) {
      const imageUrl = variant === "light" ? group.light : group.dark;
      setSelectedPreset(groupId);
      setSelectedVariant(variant);
      onImageChange(imageUrl);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64 data URL for now (could upload to cloud storage later)
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onImageChange(dataUrl);
        setSelectedPreset(null);
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert("Failed to read image file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      alert("Failed to upload image");
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    setSelectedPreset(null);
  };

  return (
    <div className="space-y-4">
      {/* Current profile image */}
      <div className="flex items-center gap-4">
        <div
          className="relative h-20 w-20 overflow-hidden rounded-2xl"
          style={{
            background: "var(--background)",
            boxShadow: "var(--neu-shadow)",
          }}
        >
          {currentImage ? (
            <Image
              src={currentImage}
              alt="Profile"
              fill
              className="object-cover"
              unoptimized={currentImage.startsWith("data:")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Camera className="h-8 w-8" style={{ color: "var(--accent)" }} />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload className="h-4 w-4" />}
            isLoading={isUploading}
          >
            Upload photo
          </Button>
          {currentImage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              leftIcon={<X className="h-4 w-4" />}
            >
              Remove
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Preset options */}
      <div>
        <label
          className="mb-3 block text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          Or choose a preset
        </label>
        <div className="grid grid-cols-4 gap-3">
          {PRESET_GROUPS.map((group) => {
            const isSelected = presetInfo?.id === group.id;
            const displayVariant = isSelected ? presetInfo.variant : effectiveMode;
            const displayImage = displayVariant === "light" ? group.light : group.dark;

            return (
              <div key={group.id} className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePresetSelect(group.id, displayVariant)}
                  className="relative aspect-square w-full overflow-hidden rounded-2xl"
                  style={{
                    boxShadow: isSelected
                      ? "var(--neu-shadow), 0 0 0 3px var(--foreground)"
                      : "var(--neu-shadow-sm)",
                  }}
                >
                  <Image
                    src={displayImage}
                    alt={`Preset ${group.id}`}
                    fill
                    className="object-cover"
                  />
                  {isSelected && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.3)" }}
                    >
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  )}
                </motion.button>

                {/* Light/Dark toggle for selected preset */}
                {isSelected && (
                  <div className="flex justify-center gap-1">
                    <button
                      onClick={() => handlePresetSelect(group.id, "light")}
                      className="rounded-full px-2 py-0.5 text-[10px] transition-all"
                      style={{
                        background: presetInfo.variant === "light" ? "var(--foreground)" : "var(--shadow-dark)",
                        color: presetInfo.variant === "light" ? "var(--background)" : "var(--accent)",
                      }}
                    >
                      Light
                    </button>
                    <button
                      onClick={() => handlePresetSelect(group.id, "dark")}
                      className="rounded-full px-2 py-0.5 text-[10px] transition-all"
                      style={{
                        background: presetInfo.variant === "dark" ? "var(--foreground)" : "var(--shadow-dark)",
                        color: presetInfo.variant === "dark" ? "var(--background)" : "var(--accent)",
                      }}
                    >
                      Dark
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
