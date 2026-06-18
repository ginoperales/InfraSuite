import { User } from '@infrasuite/auth';

export type Permission =
  | 'COMPANY_CREATE'
  | 'COMPANY_DELETE'
  | 'LICENSE_MANAGE'
  | 'MODULE_ACTIVATE'
  | 'LOGS_VIEW'
  | 'BACKUP_RUN'
  | 'USER_CREATE'
  | 'USER_ROLE_ASSIGN'
  | 'PROJECT_CREATE'
  | 'PROJECT_EDIT'
  | 'PROJECT_DELETE'
  | 'APU_EDIT'
  | 'RESOURCE_EDIT'
  | 'REPORT_EXPORT'
  | 'DATA_VIEW';

const ROLE_PERMISSIONS: Record<User['role'], Permission[]> = {
  SUPER_ADMIN: [
    'COMPANY_CREATE',
    'COMPANY_DELETE',
    'LICENSE_MANAGE',
    'MODULE_ACTIVATE',
    'LOGS_VIEW',
    'BACKUP_RUN',
    'USER_CREATE',
    'USER_ROLE_ASSIGN',
    'PROJECT_CREATE',
    'PROJECT_EDIT',
    'PROJECT_DELETE',
    'APU_EDIT',
    'RESOURCE_EDIT',
    'REPORT_EXPORT',
    'DATA_VIEW'
  ],
  ADMIN: [
    'USER_CREATE',
    'USER_ROLE_ASSIGN',
    'PROJECT_CREATE',
    'PROJECT_EDIT',
    'PROJECT_DELETE',
    'APU_EDIT',
    'RESOURCE_EDIT',
    'REPORT_EXPORT',
    'DATA_VIEW'
  ],
  PROJECT_MANAGER: [
    'PROJECT_EDIT',
    'APU_EDIT',
    'RESOURCE_EDIT',
    'REPORT_EXPORT',
    'DATA_VIEW'
  ],
  ENGINEER: [
    'APU_EDIT',
    'RESOURCE_EDIT',
    'DATA_VIEW'
  ],
  VIEWER: [
    'DATA_VIEW'
  ]
};

export const hasPermission = (role: User['role'], permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

export const getRolePermissions = (role: User['role']): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};
