import React, { Suspense } from "react";
import { selfAvatarAtom } from "@/state/selfavatar";
import { useAtom } from "jotai";
import IDText from "@/components/ui/IDText";
import AvatarIcon from "./AvatarIcon";

const SelfAvatarLoader = () => {

  const [{data: selfAvatar}] = useAtom(selfAvatarAtom);

  if (!selfAvatar || "message" in selfAvatar) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>;
  }

  return (
    <div className="flex items-center space-x-2">
      <AvatarIcon avatar={selfAvatar} />
      <div>
        <div className="h-4 w-24">{selfAvatar.name}</div>
        <div className="h-4 w-32"><IDText id={selfAvatar.id} /></div>
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
        <SelfAvatarLoader />
      </Suspense>
    </div>
  );
}
