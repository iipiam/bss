import { storage } from "./storage";

export interface ActivityLogData {
  employeeId: string;
  actionType: 'create' | 'update' | 'delete';
  actionCategory: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  description?: string;
}

export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    await storage.createEmployeeActivity({
      employeeId: data.employeeId,
      actionType: data.actionType,
      actionCategory: data.actionCategory,
      entityType: data.entityType,
      entityId: data.entityId,
      oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
      newValue: data.newValue ? JSON.stringify(data.newValue) : null,
      description: data.description || null,
    });
  } catch (error) {
    // Log error but don't throw to prevent disrupting main operations
    console.error("Failed to log activity:", error);
  }
}

export function createActivityLogger(userId: string) {
  return {
    log: async (
      actionType: 'create' | 'update' | 'delete',
      actionCategory: string,
      entityType: string,
      entityId: string,
      options?: {
        oldValue?: any;
        newValue?: any;
        description?: string;
      }
    ) => {
      await logActivity({
        employeeId: userId,
        actionType,
        actionCategory,
        entityType,
        entityId,
        oldValue: options?.oldValue,
        newValue: options?.newValue,
        description: options?.description,
      });
    },

    logCreate: async (
      category: string,
      entityType: string,
      entityId: string,
      newValue: any,
      description?: string
    ) => {
      await logActivity({
        employeeId: userId,
        actionType: 'create',
        actionCategory: category,
        entityType,
        entityId,
        newValue,
        description,
      });
    },

    logUpdate: async (
      category: string,
      entityType: string,
      entityId: string,
      oldValue: any,
      newValue: any,
      description?: string
    ) => {
      await logActivity({
        employeeId: userId,
        actionType: 'update',
        actionCategory: category,
        entityType,
        entityId,
        oldValue,
        newValue,
        description,
      });
    },

    logDelete: async (
      category: string,
      entityType: string,
      entityId: string,
      oldValue: any,
      description?: string
    ) => {
      await logActivity({
        employeeId: userId,
        actionType: 'delete',
        actionCategory: category,
        entityType,
        entityId,
        oldValue,
        description,
      });
    },
  };
}
