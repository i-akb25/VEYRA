import Image from "next/image";

type Props = {
  light?: boolean;
  compact?: boolean;
  priority?: boolean;
  className?: string;
};

export function BrandLogo({ light = false, compact = false, priority = false, className = "" }: Props) {
  const src = compact
    ? light ? "/brand/veyra-mark-light.svg" : "/brand/veyra-mark.svg"
    : light ? "/brand/veyra-wordmark-light.svg" : "/brand/veyra-wordmark.svg";

  return <Image className={className} src={src} width={compact ? 96 : 360} height={compact ? 96 : 80} alt="VEYRA" priority={priority} />;
}
