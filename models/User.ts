import mongoose, { type Document, Schema } from "mongoose"

export const USER_ROLES = ["admin", "manager", "editor"] as const;
export type UserRole = typeof USER_ROLES[number];

export const PERMISSIONS = {
  // User permissions
  USER_VIEW: 'users.view',
  USER_CREATE: 'users.create',
  USER_EDIT: 'users.edit',
  USER_DELETE: 'users.delete',
  
  // Coupon permissions
  COUPON_VIEW: 'coupons.view',
  COUPON_CREATE: 'coupons.create',
  COUPON_EDIT: 'coupons.edit',
  COUPON_DELETE: 'coupons.delete',
  
  // Store permissions
  STORE_VIEW: 'stores.view',
  STORE_CREATE: 'stores.create',
  STORE_EDIT: 'stores.edit',
  STORE_DELETE: 'stores.delete',
  
  // Category permissions
  CATEGORY_VIEW: 'categories.view',
  CATEGORY_CREATE: 'categories.create',
  CATEGORY_EDIT: 'categories.edit',
  CATEGORY_DELETE: 'categories.delete',
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DELETE',
    'COUPON_VIEW', 'COUPON_CREATE', 'COUPON_EDIT', 'COUPON_DELETE',
    'STORE_VIEW', 'STORE_CREATE', 'STORE_EDIT', 'STORE_DELETE',
    'CATEGORY_VIEW', 'CATEGORY_CREATE', 'CATEGORY_EDIT', 'CATEGORY_DELETE'
  ],
  manager: [
    'COUPON_VIEW', 'COUPON_CREATE', 'COUPON_EDIT',
    'STORE_VIEW', 'STORE_EDIT',
    'CATEGORY_VIEW', 'CATEGORY_EDIT'
  ],
  editor: [
    'COUPON_VIEW', 'COUPON_CREATE', 'COUPON_EDIT',
    'STORE_VIEW',
    'CATEGORY_VIEW'
  ]
};

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  permissions: string[];
  status: 'active' | 'inactive';
  refreshToken?: string;
  refreshTokenExpiry?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  hasPermission(permission: string): boolean;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'editor',
    },
    permissions: {
      type: [String],
      enum: [...Object.values(PERMISSIONS), ...Object.keys(PERMISSIONS)],
      default: function() {
        // Default permissions based on role
        const role = (this as any).role as UserRole;
        return ROLE_PERMISSIONS[role] || [];
      },
      validate: {
        validator: function(permissions: string[]) {
          // Ensure all permissions are valid (either in format 'users.view' or 'USER_VIEW')
          return permissions.every(permission => {
            const isDotFormat = Object.values(PERMISSIONS).includes(permission as any);
            const isUnderscoreFormat = Object.keys(PERMISSIONS).includes(permission);
            return isDotFormat || isUnderscoreFormat;
          });
        },
        message: (props: any) => `${props.value} contains invalid permissions`
      }
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    refreshToken: {
      type: String,
      select: false,
    },
    refreshTokenExpiry: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        // Create a new object to avoid mutating the original
        const { password, refreshToken, refreshTokenExpiry, ...filteredRet } = ret;
        return filteredRet;
      },
      versionKey: false,
    },
  }
);

// Method to check if user has a specific permission
UserSchema.methods.hasPermission = function(permission: string): boolean {
  // Admins have all permissions
  if (this.role === 'admin') return true;
  
  // Check if the permission exists in the user's permissions
  return this.permissions && this.permissions.includes(permission);
};

// Method to check if user has any of the given permissions
UserSchema.methods.hasAnyPermission = function(permissions: string[]): boolean {
  // Admins have all permissions
  if (this.role === 'admin') return true;
  
  // Check if any of the permissions exist in the user's permissions
  return this.permissions && permissions.some(permission => 
    this.permissions.includes(permission)
  );
};

// Method to check if user has all of the given permissions
UserSchema.methods.hasAllPermissions = function(permissions: string[]): boolean {
  // Admins have all permissions
  if (this.role === 'admin') return true;
  
  // Check role-based permissions
  const rolePermissions = this.role in ROLE_PERMISSIONS 
    ? ROLE_PERMISSIONS[this.role as keyof typeof ROLE_PERMISSIONS] 
    : [];
    
  return rolePermissions.some(p => PERMISSIONS[p as keyof typeof PERMISSIONS] === permission);
};

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const { hashPassword } = await import('@/lib/jwt');
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error as any);
  }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
