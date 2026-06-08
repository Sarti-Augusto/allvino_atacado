// Util minimo - condicional de classes (substituto leve de clsx/cva)
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
