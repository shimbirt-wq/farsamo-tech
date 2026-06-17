import { RepairStatus } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import type { PublicUser } from "@/lib/auth/public-user";
import { REPAIR_STATUS_LABELS } from "@/lib/constants/repair-status";

type DashboardRecentTicket = {
  id: string;
  ticketId: string;
  status: RepairStatus;
  createdAt: Date;
};

type DashboardBase = {
  role: PublicUser["role"];
  unreadNotifications: number;
};

export type StudentLecturerDashboard = DashboardBase & {
  role: "STUDENT" | "LECTURER";
  activeTickets: number;
  recentRepairHistory: DashboardRecentTicket[];
};

export type TechnicianStatusQueueItem = {
  status: RepairStatus;
  label: string;
  count: number;
};

export type TechnicianDashboard = DashboardBase & {
  role: "TECHNICIAN";
  assignedTickets: number;
  dailyWorkload: number;
  statusQueue: TechnicianStatusQueueItem[];
};

export type AdminDashboard = DashboardBase & {
  role: "ADMIN";
  totalTickets: number;
  pendingAssignments: number;
  activeRepairs: number;
  completedRepairs: number;
};

export type RoleDashboard = StudentLecturerDashboard | TechnicianDashboard | AdminDashboard;

const activeOwnerStatuses: RepairStatus[] = [
  "REGISTRATION_COMPLETED",
  "DEVICE_RECEIVED",
  "DIAGNOSIS_IN_PROGRESS",
  "REPAIR_IN_PROGRESS",
  "QUALITY_INSPECTION",
  "READY_FOR_COLLECTION",
];

const activeRepairStatuses: RepairStatus[] = [
  "DEVICE_RECEIVED",
  "DIAGNOSIS_IN_PROGRESS",
  "REPAIR_IN_PROGRESS",
  "QUALITY_INSPECTION",
  "READY_FOR_COLLECTION",
];

const technicianQueueStatuses: RepairStatus[] = [
  "REGISTRATION_COMPLETED",
  "DEVICE_RECEIVED",
  "DIAGNOSIS_IN_PROGRESS",
  "REPAIR_IN_PROGRESS",
  "QUALITY_INSPECTION",
  "READY_FOR_COLLECTION",
];

async function getUnreadNotifications(prisma: PrismaClient, userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      status: {
        not: "READ" as const,
      },
    },
  });
}

function isStudentOrLecturer(
  user: PublicUser,
): user is PublicUser & { role: "STUDENT" | "LECTURER" } {
  return user.role === "STUDENT" || user.role === "LECTURER";
}

async function buildStudentLecturerDashboard(
  prisma: PrismaClient,
  user: PublicUser & { role: "STUDENT" | "LECTURER" },
): Promise<StudentLecturerDashboard> {
  const where = {
    device: {
      ownerId: user.id,
    },
  };

  const [unreadNotifications, activeTickets, recentRepairHistory] = await Promise.all([
    getUnreadNotifications(prisma, user.id),
    prisma.repairTicket.count({
      where: {
        ...where,
        status: {
          in: activeOwnerStatuses,
        },
      },
    }),
    prisma.repairTicket.findMany({
      where,
      select: {
        id: true,
        ticketId: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 3,
    }),
  ]);

  return {
    role: user.role,
    unreadNotifications,
    activeTickets,
    recentRepairHistory,
  };
}

async function buildTechnicianDashboard(prisma: PrismaClient, user: PublicUser): Promise<TechnicianDashboard> {
  const [unreadNotifications, assignedTickets, statusCounts] = await Promise.all([
    getUnreadNotifications(prisma, user.id),
    prisma.repairTicket.count({
      where: {
        technicianId: user.id,
      },
    }),
    Promise.all(
      technicianQueueStatuses.map(async (status) => ({
        status,
        label: REPAIR_STATUS_LABELS[status],
        count: await prisma.repairTicket.count({
          where: {
            technicianId: user.id,
            status,
          },
        }),
      })),
    ),
  ]);

  const dailyWorkload = statusCounts.reduce((total, item) => total + item.count, 0);

  return {
    role: "TECHNICIAN",
    unreadNotifications,
    assignedTickets,
    dailyWorkload,
    statusQueue: statusCounts,
  };
}

async function buildAdminDashboard(prisma: PrismaClient, user: PublicUser): Promise<AdminDashboard> {
  const [unreadNotifications, totalTickets, pendingAssignments, activeRepairs, completedRepairs] = await Promise.all([
    getUnreadNotifications(prisma, user.id),
    prisma.repairTicket.count(),
    prisma.repairTicket.count({
      where: {
        technicianId: null,
      },
    }),
    prisma.repairTicket.count({
      where: {
        status: {
          in: activeRepairStatuses,
        },
      },
    }),
    prisma.repairTicket.count({
      where: {
        status: "DEVICE_COLLECTED",
      },
    }),
  ]);

  return {
    role: "ADMIN",
    unreadNotifications,
    totalTickets,
    pendingAssignments,
    activeRepairs,
    completedRepairs,
  };
}

export async function getRoleDashboard(prisma: PrismaClient, user: PublicUser): Promise<RoleDashboard> {
  if (isStudentOrLecturer(user)) {
    return buildStudentLecturerDashboard(prisma, user);
  }

  if (user.role === "TECHNICIAN") {
    return buildTechnicianDashboard(prisma, user);
  }

  return buildAdminDashboard(prisma, user);
}
