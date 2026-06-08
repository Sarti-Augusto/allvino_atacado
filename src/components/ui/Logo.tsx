// =====================================================================
// Logo Allvino - alterna entre versao clara (light) e escura (dark)
// Recebe `variant` que define qual PNG usar
// =====================================================================
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface LogoProps {
  variant?: 'dark' | 'light' | 'auto';
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function Logo({
  variant = 'dark',
  className,
  width = 180,
  height = 60,
  priority = false,
}: LogoProps) {
  // variant=auto: usa classe group/size- pra inverter (requer CSS no parent)
  const src = variant === 'light' ? '/logo-allvino-light.png' : '/logo-allvino-dark.png';

  return (
    <Image
      src={src}
      alt="Allvino"
      width={width}
      height={height}
      priority={priority}
      className={cn('h-auto w-auto', className)}
    />
  );
}
