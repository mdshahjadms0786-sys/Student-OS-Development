import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}
