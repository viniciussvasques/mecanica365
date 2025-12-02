import api from '../api';

export type UserRole = 'admin' | 'manager' | 'mechanic' | 'receptionist' | 'accountant';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  includeInactive?: boolean;
}

export const usersApi = {
  /**
   * Lista todos os usuários do tenant
   */
  findAll: async (filters?: UserFilters) => {
    const params = new URLSearchParams();
    if (filters?.role) {
      params.append('role', filters.role);
    }
    if (filters?.includeInactive) {
      params.append('includeInactive', 'true');
    } else if (filters?.isActive !== undefined) {
      params.append('includeInactive', filters.isActive ? 'false' : 'true');
    }

    const queryString = params.toString();
    const url = queryString ? `/users?${queryString}` : '/users';
    
    const response = await api.get<User[]>(url);
    return response.data;
  },

  /**
   * Busca um usuário por ID
   */
  findOne: async (id: string) => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Cria um novo usuário
   */
  create: async (data: CreateUserDto) => {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  /**
   * Atualiza um usuário
   */
  update: async (id: string, data: UpdateUserDto) => {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Remove um usuário (soft delete)
   */
  remove: async (id: string) => {
    await api.delete(`/users/${id}`);
  },

  /**
   * Lista apenas mecânicos ativos
   */
  findMechanics: async () => {
    return usersApi.findAll({ role: 'mechanic', isActive: true });
  },
};

