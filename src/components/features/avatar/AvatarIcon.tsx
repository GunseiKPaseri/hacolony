import Image from "next/image";

const selectColor = (id: string) => {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
  ];
  const index = [...id].map(char => char.charCodeAt(0)).reduce((acc, code) => acc + code, 0) % colors.length;
  return colors[index];
}


export default function AvatarIcon({ avatar }: { avatar: {name: string, imageUrl?: string | null} }) {
  return (
    <div className={"h-8 w-8 rounded-full text-white flex items-center justify-center text-xs font-bold" + (avatar.imageUrl ? "" : " " + selectColor(avatar.name))}>{
      avatar.imageUrl ? <Image src={avatar.imageUrl} alt={avatar.name} className="h-8 w-8 rounded-full" /> : <div className="">{avatar.name.charAt(0)}</div>
    }
    </div>
  )
}