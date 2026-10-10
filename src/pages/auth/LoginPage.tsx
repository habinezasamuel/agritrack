import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card, CardBody, CardFooter } from '../../components/common/Card';
import type { LoginCredentials } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

const DEMO_CREDENTIALS = [
  { role: 'Administrator', username: 'admin', password: 'admin123', badge: 'Admin' },
  { role: 'Farmer', username: 'farmer', password: 'farmer123', badge: 'Farmer' },
  { role: 'Agricultural Officer', username: 'officer', password: 'officer123', badge: 'Officer' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    setError('');
    setIsLoading(true);
    try {
      const response = await login(data);
      if (response.user.role === 'ADMIN') {
        navigate('/admin');
      } else if (response.user.role === 'OFFICER') {
        navigate('/officer');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (username: string, pass: string) => {
    setValue('username', username, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
          {t('welcomeBack')}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{t('signInDescription')}</p>
      </div>

      <Card variant="elevated" padding="lg" className="shadow-xl border border-slate-200/80 bg-white rounded-3xl">
        <CardBody>
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-scale-in" role="alert">
              <svg className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <Input
                label={t('username')}
                placeholder="Enter your username (e.g. farmer1)"
                error={errors.username?.message}
                {...register('username', { required: 'Username is required' })}
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
            <div>
              <Input
                label={t('password')}
                type="password"
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between text-sm py-1">
              <label className="flex items-center gap-2 cursor-pointer group select-none">
                <input type="checkbox" className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer" />
                <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">{t('rememberMe')}</span>
              </label>
              <Link to="/forgot-password" className="text-xs text-emerald-700 hover:text-emerald-800 font-bold transition-colors">
                {t('forgotPassword')}
              </Link>
            </div>

            <Button type="submit" className="w-full py-3 text-sm font-bold shadow-md shadow-emerald-700/20" size="lg" isLoading={isLoading}>
              {t('signIn')}
            </Button>
          </form>
        </CardBody>

        <CardFooter className="flex flex-col items-center gap-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-600 text-center">
            {t('noAccount')}{' '}
            <Link to="/register" className="text-emerald-700 hover:text-emerald-800 hover:underline font-bold transition-colors">
              {t('createAccount')}
            </Link>
          </p>

          <div className="w-full">
            <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[0.6875rem] font-extrabold text-emerald-800 uppercase tracking-wider">Demo Accounts (Quick Select)</span>
                <span className="text-[0.625rem] text-slate-400 font-medium">Click to fill</span>
              </div>
              <div className="space-y-2">
                {DEMO_CREDENTIALS.map((cred, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDemoFill(cred.username, cred.password)}
                    className="w-full text-left px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group shadow-2xs flex items-center justify-between cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">{cred.role}</span>
                    </div>
                    <div className="text-[0.6875rem] text-slate-500 font-mono flex gap-2">
                      <span>{cred.username}</span>
                      <span className="text-slate-300">•</span>
                      <span>{cred.password}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
