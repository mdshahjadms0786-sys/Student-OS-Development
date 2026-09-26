import * as React from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from '@student-os/ui';
import { Label } from '../components/ui/Label.jsx';
import { apiClient } from '../lib/api-client.js';
import { useAuth } from '../lib/auth-context.jsx';
import { toast } from 'sonner';
import { Spinner } from '../components/ui/Spinner.jsx';
import { RegisterRequestSchema } from '@student-os/contracts';

export function RegisterPage() {
  const { login } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useReactHookForm({
    resolver: zodResolver(RegisterRequestSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await apiClient('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.success && res.data) {
        toast.success('Registered successfully');
        login(res.data);
        window.location.hash = '#profile';
      }
    } catch (err) {
      toast.error(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Sign up to get started with Student OS</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Adam"
                error={!!errors.name}
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m.adam@example.com"
                error={!!errors.email}
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                error={!!errors.password}
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner className="mr-2 h-4 w-4 text-white" /> : null}
              Register
            </Button>
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
              Already have an account?{' '}
              <a href="#login" className="text-blue-600 hover:underline dark:text-blue-400">
                Log in here
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
