"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminOnly = exports.SUPER_ADMIN_KEY = exports.Public = exports.PUBLIC_KEY = exports.Roles = exports.ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
exports.PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_1.SetMetadata)(exports.PUBLIC_KEY, true);
exports.Public = Public;
exports.SUPER_ADMIN_KEY = 'isSuperAdminRoute';
const SuperAdminOnly = () => (0, common_1.SetMetadata)(exports.SUPER_ADMIN_KEY, true);
exports.SuperAdminOnly = SuperAdminOnly;
//# sourceMappingURL=roles.decorator.js.map