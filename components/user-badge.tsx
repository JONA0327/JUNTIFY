// Let's add the badge component to display next to user roles
import Image from "next/image";

interface BadgeProps {
  type: string; // e.g., "free", "premium", etc.
  size?: number; // Optional size parameter
}

export const UserBadge = ({ type, size = 24 }: BadgeProps) => {
  const badgePath = `/badges/${type}-badge.png`;
  
  return (
    <div className="inline-flex items-center ml-2">
      <Image 
        src={badgePath}
        alt={`Medalla de usuario: ${type}`} // Sugerencia: Texto alternativo más descriptivo
        width={size}
        height={size}
        className="object-contain"
      />
    </div>
  );
};
