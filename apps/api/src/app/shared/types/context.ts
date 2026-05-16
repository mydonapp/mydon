export interface Context {
  user: {
    id: string;
    email: string;
    name: string;
    language: string;
    theme: string;
    listStyle: string;
    privacyMode: boolean;
    showAccountNumbers: boolean;
  };
}
