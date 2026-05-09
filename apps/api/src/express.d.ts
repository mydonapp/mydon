declare namespace Express {
  interface Request {
    context: {
      user: {
        id: string;
        email: string;
        name: string;
      };
    };
  }
}
