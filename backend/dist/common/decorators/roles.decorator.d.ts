export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const PUBLIC_KEY = "isPublic";
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
export declare const SUPER_ADMIN_KEY = "isSuperAdminRoute";
export declare const SuperAdminOnly: () => import("@nestjs/common").CustomDecorator<string>;
