export type CreateFormPayload = {
  Code: string;
  Type: string;
  Name: string;
  ProductError: string;
  ErrorCodeId: number;
  LineId: number;
  Quantity: number;
  Photos?: string[]; // Eksik alan
};

// Diğer eksik type'lar
export type RNFile = {
  uri: string;
  type?: string;
  name?: string;
};

export type Form = {
  id: string;
  title: string;
  status: string;
  barcode: string;
  productType: string;
  lineNumber: string;
  errorCode: {
    id: number;
    code: string;
    description: string;
  };
  note?: string;
  photos: string[];
  createdAt: string;
};

export type UserRole = 'SuperAdmin' | 'User' | 'admin' | 'Admin';

export type LoginResponse = {
  token: string;
  user?: any;
};

export type UserInfo = {
  username: string;
  line?: string;
  role: string;
};

export type ErrorCodeDto = {
  id: number;
  code: string;
  description: string;
};

export type LineDto = {
  id: number;
  name: string;
};

export type PhotoUploadPayload = {
  photos: RNFile[];
  formId?: string;
};

export type PhotoUploadResponse = {
  success: boolean;
  urls?: string[];
  message?: string;
};