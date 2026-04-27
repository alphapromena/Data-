import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const next = i18n.language === 'ar' ? 'en' : 'ar';

  return (
    <button
      type="button"
      onClick={() => void i18n.changeLanguage(next)}
      className="lang-toggle"
      aria-label="Change language"
    >
      {t('language.toggle')}
    </button>
  );
}
