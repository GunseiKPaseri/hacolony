import { use, Suspense } from "react";
import Image from "next/image";

type AvatarResponse = {
  name: string;
  hidden: boolean;
  id: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
} | {message: string};

const SelfAvatarLoader = ({avatarLoader}: {avatarLoader: Promise<AvatarResponse>}) => {

  const selfAvatar = use<AvatarResponse>(avatarLoader);

  if (!selfAvatar || "message" in selfAvatar) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>;
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="h-8 w-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">{
        selfAvatar.imageUrl ? <Image src={selfAvatar.imageUrl} alt={selfAvatar.name} className="h-8 w-8 rounded-full" /> : <div className="">{selfAvatar.name.charAt(0)}</div>
        }</div>
      <div>
        <div className="h-4 w-24">{selfAvatar.name}</div>
        <div className="h-4 w-32 text-gray-400">@{selfAvatar.id}</div>
      </div>
    </div>
  );
}
const SelfAvatarLoading = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
      <div>
        <div className="h-4 w-24 bg-gray-200 animate-pulse"></div>
        <div className="h-4 w-32 bg-gray-200 animate-pulse mt-1"></div>
      </div>
    </div>
  );
}


export default function SelfAvatar() {
  return (
    <div className="flex items-center space-x-2">
      <Suspense fallback={<SelfAvatarLoading />}>
        <SelfAvatarLoader avatarLoader={fetch("/api/selfavatar").then(res => res.json())} />
      </Suspense>
    </div>
  );
}
