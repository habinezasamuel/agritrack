import { useLanguage } from '../../context/LanguageContext';

export function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
      dark ? 'border-white/20 bg-white/10 text-white' : 'border-slate-200 bg-white text-slate-700'
    }`}>
      <span>{t('language')}:</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as 'en' | 'rw')}
        className={`cursor-pointer bg-transparent font-extrabold outline-none ${dark ? 'text-white' : 'text-emerald-800'}`}
        aria-label={t('language')}
      >
        <option value="en" className="text-slate-900">{t('english')}</option>
        <option value="rw" className="text-slate-900">{t('kinyarwanda')}</option>
      </select>
    </label>
  );
}
