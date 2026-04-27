import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const toggle = () => {
    const next = isArabic ? 'en' : 'ar';
    i18n.changeLanguage(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 rounded-lg bg-surface-2 text-text border border-border text-sm font-medium hover:border-accent transition-colors"
    >
      {t('language.toggle')}
    </button>
  );
}
