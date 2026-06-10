import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(PUBLIC_KEY, true);

export const SUPER_ADMIN_KEY = 'isSuperAdminRoute';
export const SuperAdminOnly = () => SetMetadata(SUPER_ADMIN_KEY, true);
