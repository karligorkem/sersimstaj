import api from './api';

// API'den dönen user formatı
interface ApiUser {
  id: number;
  username: string;
  passwordHash?: string;
  role: string;
  lineId?: number;
  line?: {
    id: number;
    name: string;
  };
}

// Client için user formatı
export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'SuperAdmin' | 'admin' | 'User';
  line?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  username: string;
  email?: string;
  password: string;
  role: 'SuperAdmin' | 'admin' | 'User';
  lineId?: number; // API lineId bekliyor, line değil
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  role?: 'SuperAdmin' | 'admin' | 'User';
  lineId?: number; // API lineId bekliyor
  isActive?: boolean;
}

// API user'ını client formatına çevir
const transformApiUserToClientUser = (apiUser: ApiUser): User => {
  return {
    id: apiUser.id,
    username: apiUser.username,
    role: (apiUser.role as 'SuperAdmin' | 'admin' | 'User') || 'User',
    line: apiUser.line?.name,
    isActive: true, // API'de isActive yok, default true
    createdAt: new Date().toISOString(), // API'de yok, default değer
    updatedAt: new Date().toISOString(), // API'de yok, default değer
  };
};

const getUsers = async (): Promise<User[]> => {
  try {
    console.log('Kullanıcılar getiriliyor...');
    const response = await api.get<ApiUser[]>('/Users');
    console.log('Kullanıcılar başarıyla getirildi');
    return response.data.map(transformApiUserToClientUser);
  } catch (error) {
    console.error('Kullanıcılar getirme hatası:', error);
    throw error;
  }
};

// API için payload hazırla
const prepareUserPayloadForApi = (userData: CreateUserPayload) => {
  return {
    username: userData.username,
    passwordHash: userData.password, // API passwordHash bekliyor
    role: userData.role,
    lineId: userData.lineId,
  };
};

const addUser = async (userData: CreateUserPayload): Promise<User> => {
  try {
    console.log('Yeni kullanıcı oluşturuluyor:', userData.username);
    const apiPayload = prepareUserPayloadForApi(userData);
    const response = await api.post<ApiUser>('/Users', apiPayload);
    console.log('Kullanıcı başarıyla oluşturuldu');
    return transformApiUserToClientUser(response.data);
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    throw error;
  }
};

const updateUser = async (id: number, userData: UpdateUserPayload): Promise<User> => {
  try {
    console.log('Kullanıcı güncelleniyor:', id);
    const apiPayload = {
      username: userData.username,
      role: userData.role,
      lineId: userData.lineId,
    };
    const response = await api.put<ApiUser>(`/Users/${id}`, apiPayload);
    console.log('Kullanıcı başarıyla güncellendi');
    return transformApiUserToClientUser(response.data);
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    throw error;
  }
};

const deleteUser = async (id: number): Promise<void> => {
  try {
    console.log('Kullanıcı siliniyor:', id);
    await api.delete(`/Users/${id}`);
    console.log('Kullanıcı başarıyla silindi');
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    throw error;
  }
};

export const UsersService = {
  getUsers,
  addUser,
  updateUser,
  deleteUser,
};