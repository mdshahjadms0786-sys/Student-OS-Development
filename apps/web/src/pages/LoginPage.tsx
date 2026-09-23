import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input } from '@student-os/ui';
import { Label } from '../components/ui/Label.js';
import { apiClient } from '../lib/api-client.js';
import { useAuth } from '../lib/auth-context.js';
import { toast } from 'sonner';
import { Spinner } from '../components/ui/Spinner.js';

// Assuming @student-os/contracts is in a specific location, we redefine basic schemas here or use it directly
// The prompt says "import { LoginRequestSchema, RegisterRequestSchema } from '@student-os/contracts'"
import { LoginRequestSchema } from '@student-os/contracts';

type LoginData = z.infer<typeof LoginRequestSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(LoginRequestSchema)
  });

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    try {
      const res = await apiClient<{id: string; email: string; name: string; profileComplete: boolean}>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.success && res.data) {
        toast.success('Logged in successfully');
        login(res.data);
        window.location.hash = '#home';
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Enter your credentials to login to Student OS</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              Log in
            </Button>
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
              Don't have an account?{' '}
              <a href="#register" className="text-blue-600 hover:underline dark:text-blue-400">
                Register here
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
