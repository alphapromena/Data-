import { useTranslation } from 'react-i18next';

export function PlaceholderPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return (
    <section>
      <h1>{t(titleKey)}</h1>
      <p className="muted">Coming soon.</p>
    </section>
  );
}
