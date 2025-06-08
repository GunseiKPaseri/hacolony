"use client";

import { useState, useEffect } from "react";

export interface AvatarFormData {
  name: string;
  description: string;
  imageUrl: string;
}

interface AvatarFormProps {
  defaultName?: string;
  onAvatarChange: (avatar: AvatarFormData) => void;
  className?: string;
}

export function AvatarForm({ defaultName = "", onAvatarChange, className = "" }: AvatarFormProps) {
  const [avatarData, setAvatarData] = useState<AvatarFormData>({
    name: "",
    description: "",
    imageUrl: "",
  });

  // defaultNameが変更されたときにアバター名とdescriptionをデフォルト値で更新
  useEffect(() => {
    if (defaultName) {
      const newData = {
        name: defaultName,
        description: `${defaultName}のアバター`,
        imageUrl: avatarData.imageUrl,
      };
      setAvatarData(newData);
      onAvatarChange(newData);
    }
  }, [defaultName, avatarData.imageUrl, onAvatarChange]);

  const handleInputChange = (field: keyof AvatarFormData, value: string) => {
    const newData = { ...avatarData, [field]: value };
    setAvatarData(newData);
    onAvatarChange(newData);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          アバター設定
        </label>
        
        <div className="space-y-3 rounded-lg border border-gray-200 p-4 bg-gray-50">
          <div>
            <label htmlFor="avatar-name" className="block text-sm font-medium text-gray-700 mb-1">
              アバター名 <span className="text-red-500">*</span>
            </label>
            <input
              id="avatar-name"
              type="text"
              required
              value={avatarData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="例: タロウのアバター"
            />
          </div>

          <div>
            <label htmlFor="avatar-description" className="block text-sm font-medium text-gray-700 mb-1">
              アバター説明
            </label>
            <textarea
              id="avatar-description"
              rows={2}
              value={avatarData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 resize-none"
              placeholder="例: プロフィール用のアバターです"
            />
          </div>

          <div>
            <label htmlFor="avatar-image" className="block text-sm font-medium text-gray-700 mb-1">
              アバター画像URL
            </label>
            <input
              id="avatar-image"
              type="url"
              value={avatarData.imageUrl}
              onChange={(e) => handleInputChange("imageUrl", e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="https://example.com/avatar.jpg"
            />
            {avatarData.imageUrl && (
              <div className="mt-2">
                <img
                  src={avatarData.imageUrl}
                  alt="アバタープレビュー"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500">
            <p>• アバター名は必須です</p>
            <p>• 説明が未入力の場合、デフォルトの説明が使用されます</p>
            <p>• 画像URLは任意です</p>
          </div>
        </div>
      </div>
    </div>
  );
}