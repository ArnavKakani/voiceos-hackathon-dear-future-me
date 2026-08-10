import dfmLogo from '../../assets/icons/dfm_logo_main.png';
import dfmPencil from '../../assets/icons/dfm_pencil_icon.png';
import dfmNotebook from '../../assets/icons/dfm_notebook_icon.png';
import dfmScissors from '../../assets/icons/dfm_scissors_icon.png';
import dfmGlue from '../../assets/icons/dfm_glue_icon.png';

export type DfmIconVariant = 'logo' | 'pencil' | 'notebook' | 'scissors' | 'glue';

interface DfmIconSlotProps {
  variant: DfmIconVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const iconSrc: Record<DfmIconVariant, string> = {
  logo: dfmLogo,
  pencil: dfmPencil,
  notebook: dfmNotebook,
  scissors: dfmScissors,
  glue: dfmGlue,
};

const altText: Record<DfmIconVariant, string> = {
  logo: 'Dear Future Me',
  pencil: 'Pencil',
  notebook: 'Notebook',
  scissors: 'Scissors',
  glue: 'Glue',
};

const diameter: Record<NonNullable<DfmIconSlotProps['size']>, string> = {
  xs: 'w-7 h-7',
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
};

export function DfmIconSlot({ variant, size = 'md', className = '' }: DfmIconSlotProps) {
  return (
    <img
      src={iconSrc[variant]}
      alt={altText[variant]}
      className={`${diameter[size]} object-contain flex-shrink-0 ${className}`}
    />
  );
}
