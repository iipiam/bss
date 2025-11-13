import { storage } from "./storage";
import type { InsertEmployeeActivityLog } from "@shared/schema";

export interface ActivityLogData {
  restaurantId: string;
  employeeId: string;
  employeeName: string;
  action: string;
  actionCategory: string;
  description: string;
  entityType?: string;
  entityId?: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  branchId?: string;
  ipAddress?: string;
}

export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    const activityData: InsertEmployeeActivityLog = {
      restaurantId: data.restaurantId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      action: data.action,
      actionCategory: data.actionCategory,
      description: data.description,
      entityType: data.entityType || null,
      entityId: data.entityId || null,
      previousData: data.previousData || null,
      newData: data.newData || null,
      branchId: data.branchId || null,
      ipAddress: data.ipAddress || null,
    };
    
    await storage.createEmployeeActivity(activityData);
  } catch (error) {
    // Log error but don't throw to prevent disrupting main operations
    console.error("Failed to log activity:", error);
  }
}

export function createActivityLogger(
  restaurantId: string,
  userId: string,
  userName: string,
  branchId?: string
) {
  return {
    log: async (
      action: string,
      actionCategory: string,
      description: string,
      options?: {
        entityType?: string;
        entityId?: string;
        previousData?: Record<string, any>;
        newData?: Record<string, any>;
        ipAddress?: string;
      }
    ) => {
      await logActivity({
        restaurantId,
        employeeId: userId,
        employeeName: userName,
        action,
        actionCategory,
        description,
        entityType: options?.entityType,
        entityId: options?.entityId,
        previousData: options?.previousData,
        newData: options?.newData,
        branchId,
        ipAddress: options?.ipAddress,
      });
    },

    logCreate: async (
      category: string,
      description: string,
      entityType: string,
      entityId: string,
      newData: Record<string, any>
    ) => {
      await logActivity({
        restaurantId,
        employeeId: userId,
        employeeName: userName,
        action: 'create',
        actionCategory: category,
        description,
        entityType,
        entityId,
        newData,
        branchId,
      });
    },

    logUpdate: async (
      category: string,
      description: string,
      entityType: string,
      entityId: string,
      previousData: Record<string, any>,
      newData: Record<string, any>
    ) => {
      await logActivity({
        restaurantId,
        employeeId: userId,
        employeeName: userName,
        action: 'update',
        actionCategory: category,
        description,
        entityType,
        entityId,
        previousData,
        newData,
        branchId,
      });
    },

    logDelete: async (
      category: string,
      description: string,
      entityType: string,
      entityId: string,
      previousData: Record<string, any>
    ) => {
      await logActivity({
        restaurantId,
        employeeId: userId,
        employeeName: userName,
        action: 'delete',
        actionCategory: category,
        description,
        entityType,
        entityId,
        previousData,
        branchId,
      });
    },
  };
}
