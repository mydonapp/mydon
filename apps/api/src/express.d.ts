declare namespace Express {
  interface Request {
    context: {
      user: {
        id: string;
        email: string;
        name: string;
        language: string;
        theme: string;
        listStyle: string;
        privacyMode: boolean;
      };
    };
  }
}
