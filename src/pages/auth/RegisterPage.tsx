import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Card, CardBody, CardFooter } from '../../components/common/Card';
import type { RegisterData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterData>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterData) => {
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { confirmPassword: _confirmPassword, ...userData } = data;

    setError('');
    setIsLoading(true);
    try {
      await registerUser(userData);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Card variant="glass" padding="xl" className="shadow-2xl border border-white/60">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200/60 mb-3 shadow-xs">
            <i className="bi bi-person-plus-fill"></i> {t('newMembership')}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('createAgriTrackAccount')}</h2>
          <p className="text-sm text-slate-600 mt-1">{t('joinNetwork')}</p>
        </div>

        <CardBody className="p-0">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-2.5 shadow-xs" role="alert">
              <i className="bi bi-exclamation-octagon-fill text-rose-600 mt-0.5 text-base"></i>
              <div>
                <strong className="font-semibold">Registration notice:</strong> {error}
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="e.g. Habineza"
                leftIcon={<i className="bi bi-person text-slate-400"></i>}
                error={errors.firstName?.message}
                {...register('firstName', { required: 'First name is required' })}
                autoComplete="given-name"
                disabled={isLoading}
              />
              <Input
                label="Last Name"
                placeholder="e.g. Jean"
                leftIcon={<i className="bi bi-person text-slate-400"></i>}
                error={errors.lastName?.message}
                {...register('lastName', { required: 'Last name is required' })}
                autoComplete="family-name"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Username"
                placeholder="e.g. farmer_jean"
                leftIcon={<i className="bi bi-at text-slate-400"></i>}
                error={errors.username?.message}
                {...register('username', { 
                  required: 'Username is required', 
                  minLength: { value: 3, message: 'Username must be at least 3 characters' } 
                })}
                autoComplete="username"
                disabled={isLoading}
              />

              <Input
                label="Phone Number"
                placeholder="e.g. +250 788 123 456"
                leftIcon={<i className="bi bi-telephone text-slate-400"></i>}
                error={errors.phoneNumber?.message}
                {...register('phoneNumber', { 
                  pattern: { value: /^\+?[0-9\s-]{7,}$/, message: 'Invalid phone number' } 
                })}
                autoComplete="tel"
                disabled={isLoading}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. jean@agritrack.rw"
              leftIcon={<i className="bi bi-envelope text-slate-400"></i>}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
              })}
              autoComplete="email"
              disabled={isLoading}
            />

            <Select
              label="Account Role"
              options={[
                { value: 'FARMER', label: '🌾 Farmer (Crop & Harvest Management)' },
                { value: 'OFFICER', label: '🛡️ Agricultural Officer (Review & Approvals)' },
              ]}
              error={errors.role?.message}
              {...register('role', { required: 'Role is required' })}
              disabled={isLoading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<i className="bi bi-shield-lock text-slate-400"></i>}
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
                autoComplete="new-password"
                disabled={isLoading}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<i className="bi bi-shield-check text-slate-400"></i>}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              variant="primary"
              className="w-full mt-2" 
              size="lg" 
              isLoading={isLoading}
              leftIcon={<i className="bi bi-check2-circle"></i>}
            >
              {t('completeRegistration')}
            </Button>
          </form>
        </CardBody>
        <CardFooter className="flex flex-col items-center gap-2 pt-6 mt-4 border-t border-slate-100">
          <p className="text-sm text-slate-600 text-center">
            {t('alreadyAccount')}{' '}
            <Link to="/login" className="text-emerald-700 hover:text-emerald-900 font-bold transition-colors inline-flex items-center gap-1">
              Sign In <i className="bi bi-arrow-right"></i>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}