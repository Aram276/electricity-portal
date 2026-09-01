import { en } from './en';
import { ckb } from './ckb';
import { ar } from './ar';

export type LanguageCode = 'en' | 'ckb' | 'ar';

export const translations = {
    en,
    ckb,
    ar,
};

export { en, ckb, ar };
export type { TranslationKeys } from './en';
