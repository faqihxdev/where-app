export interface User {
  uid: string;
  email: string;
  preferences?: {
    name?: string;
  }
  createdAt?: Date;
}