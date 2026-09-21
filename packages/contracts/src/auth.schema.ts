import { z } from 'zod';

export const RegisterRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password is too long'),
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['STUDENT', 'FACULTY', 'ADMIN']),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
