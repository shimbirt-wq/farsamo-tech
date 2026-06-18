import type { User, UserRole } from "@prisma/client";

export type PublicUser = {
  id: string;
  fullName: string;
  universityId: string | null;
  faculty: string | null;
  department: string | null;
  phone: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type UserForPublicResponse = Pick<
  User,
  "id" | "fullName" | "universityId" | "faculty" | "department" | "phone" | "email" | "role" | "isActive" | "createdAt" | "updatedAt"
>;

export const publicUserSelect = {
  id: true,
  fullName: true,
  universityId: true,
  faculty: true,
  department: true,
  phone: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function toPublicUser(user: UserForPublicResponse): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    universityId: user.universityId,
    faculty: user.faculty,
    department: user.department,
    phone: user.phone,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
