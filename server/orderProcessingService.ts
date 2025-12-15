import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import {
  inventoryItems,
  inventoryTransactions,
  menuItems,
  recipes,
  type InsertInventoryTransaction,
  type MenuItem,
  type Recipe,
  type InventoryItem,
} from "@shared/schema";

// Helper to safely get inventory item with fallback for missing unit_price column
async function getInventoryItemSafe(id: string): Promise<InventoryItem | null> {
  try {
    const result = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error: any) {
    if (error.message?.includes('unit_price')) {
      console.log('[OrderProcessing] unit_price column not found, using fallback query');
      const result = await db.execute(sql`
        SELECT id, restaurant_id as "restaurantId", name, category, quantity, unit,
               reference_quantity as "referenceQuantity", price,
               CASE WHEN reference_quantity::numeric > 0 
                    THEN (price::numeric / reference_quantity::numeric)::text 
                    ELSE '0' END as "unitPrice",
               supplier, status, branch_id as "branchId", sort_order as "sortOrder",
               expiration_days as "expirationDays", purchase_date as "purchaseDate"
        FROM inventory_items WHERE id = ${id}
      `);
      const rows = (result as any).rows;
      return rows && rows.length > 0 ? rows[0] as InventoryItem : null;
    }
    throw error;
  }
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  addons?: Array<{ id: string; name: string; price: number }>;
}

interface StockRequirement {
  inventoryItemId: string;
  inventoryItemName: string;
  requiredQuantity: number;
  availableQuantity: number;
  unit: string;
}

interface StockValidationResult {
  isValid: boolean;
  insufficientItems?: StockRequirement[];
  message?: string;
}

export class OrderProcessingService {
  async prepareOrderStock(
    orderItems: OrderItem[],
    branchId: string
  ): Promise<StockValidationResult & { stockRequirements?: Map<string, StockRequirement> }> {
    try {
      const stockRequirements: Map<string, StockRequirement> = new Map();

      for (const orderItem of orderItems) {
        const menuItem = await db
          .select()
          .from(menuItems)
          .where(eq(menuItems.id, orderItem.id))
          .limit(1);

        if (!menuItem || menuItem.length === 0) {
          continue;
        }

        const item = menuItem[0];

        if (item.recipeId) {
          await this.processRecipeBasedItem(
            item,
            orderItem.quantity,
            stockRequirements,
            branchId
          );
        } else if (item.stockNo) {
          await this.processSimpleItem(
            item,
            orderItem.quantity,
            stockRequirements,
            branchId
          );
        }
      }

      const validationResult = await this.validateStock(stockRequirements);
      
      if (!validationResult.isValid) {
        return validationResult;
      }

      return { isValid: true, stockRequirements };
    } catch (error) {
      console.error("Error in prepareOrderStock:", error);
      throw error;
    }
  }

  async createOrderWithInventoryDeduction(
    orderData: any,
    stockRequirements: Map<string, StockRequirement>,
    branchId: string
  ): Promise<any> {
    return await db.transaction(async (tx) => {
      const { orders } = await import("@shared/schema");
      const [order] = await tx.insert(orders).values(orderData).returning();
      
      await this.deductInventoryInTransaction(tx, stockRequirements, order.id, branchId);
      
      return order;
    });
  }

  async finalizeOrderWithInventory(
    orderData: any,
    stockRequirements: Map<string, StockRequirement>,
    orderId: string,
    branchId: string
  ): Promise<void> {
    try {
      await this.deductInventory(stockRequirements, orderId, branchId);
    } catch (error) {
      console.error("Error in finalizeOrderWithInventory:", error);
      throw error;
    }
  }

  private async deductInventoryInTransaction(
    tx: any,
    stockRequirements: Map<string, StockRequirement>,
    orderId: string,
    branchId: string
  ): Promise<void> {
    for (const [inventoryItemId, requirement] of Array.from(stockRequirements.entries())) {
      // Use raw SQL to avoid unit_price column issue
      const result = await tx.execute(sql`
        SELECT id, restaurant_id as "restaurantId", quantity 
        FROM inventory_items WHERE id = ${inventoryItemId}
      `);
      const currentItem = (result as any).rows;

      if (!currentItem || currentItem.length === 0) continue;

      const quantityBefore = parseFloat(currentItem[0].quantity);
      const quantityAfter = quantityBefore - requirement.requiredQuantity;

      if (quantityAfter < 0) {
        throw new Error(
          `Cannot deduct ${requirement.requiredQuantity} ${requirement.unit} from ${requirement.inventoryItemName}. Only ${quantityBefore} ${requirement.unit} available.`
        );
      }

      // Record the transaction before potentially deleting the item
      const transactionRecord: InsertInventoryTransaction = {
        restaurantId: currentItem[0].restaurantId,
        inventoryItemId,
        orderId,
        type: "sale",
        quantityChange: (-requirement.requiredQuantity).toString(),
        quantityBefore: quantityBefore.toString(),
        quantityAfter: quantityAfter.toString(),
        notes: quantityAfter === 0 ? `Deducted for order - Item depleted and removed` : `Deducted for order`,
        branchId: branchId || undefined, // Convert empty string to undefined to avoid FK constraint violation
      };

      await tx.insert(inventoryTransactions).values(transactionRecord);

      if (quantityAfter === 0) {
        // Delete the inventory item when quantity reaches zero
        await tx
          .delete(inventoryItems)
          .where(eq(inventoryItems.id, inventoryItemId));
        console.log(`[INVENTORY] Deleted depleted item ${inventoryItemId} (${requirement.inventoryItemName})`);
      } else {
        // Update quantity and status
        await tx
          .update(inventoryItems)
          .set({
            quantity: quantityAfter.toString(),
            status: quantityAfter < 10 ? "Low Stock" : "In Stock",
          })
          .where(eq(inventoryItems.id, inventoryItemId));
      }
    }
  }

  private async processRecipeBasedItem(
    menuItem: MenuItem,
    quantity: number,
    stockRequirements: Map<string, StockRequirement>,
    branchId: string
  ): Promise<void> {
    if (!menuItem.recipeId) return;

    const recipeResult = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, menuItem.recipeId))
      .limit(1);

    if (!recipeResult || recipeResult.length === 0) return;

    const recipe = recipeResult[0];
    const portionMultiplier = parseFloat(menuItem.portionSize || "1.00");

    for (const ingredient of recipe.ingredients) {
      const requiredQty = ingredient.quantity * portionMultiplier * quantity;
      
      const existing = stockRequirements.get(ingredient.inventoryItemId);
      if (existing) {
        existing.requiredQuantity += requiredQty;
      } else {
        const invItem = await getInventoryItemSafe(ingredient.inventoryItemId);

        if (invItem) {
          // Only enforce branch consistency if both inventory item and order have branchId
          // Items with branchId=null are global and available to all branches
          if (branchId && invItem.branchId && invItem.branchId !== branchId) {
            throw new Error(`Inventory item ${invItem.id} (${invItem.name}) belongs to branch ${invItem.branchId} but order is for branch ${branchId}`);
          }
          
          stockRequirements.set(ingredient.inventoryItemId, {
            inventoryItemId: ingredient.inventoryItemId,
            inventoryItemName: ingredient.name,
            requiredQuantity: requiredQty,
            availableQuantity: parseFloat(invItem.quantity),
            unit: ingredient.unit,
          });
        }
      }
    }
  }

  private async processSimpleItem(
    menuItem: MenuItem,
    quantity: number,
    stockRequirements: Map<string, StockRequirement>,
    branchId: string
  ): Promise<void> {
    if (!menuItem.inventoryItemId || !menuItem.stockNo) {
      console.warn(`Menu item "${menuItem.name}" is missing inventoryItemId or stockNo for inventory deduction`);
      return;
    }

    const invItem = await getInventoryItemSafe(menuItem.inventoryItemId);

    if (!invItem) {
      console.warn(`Inventory item ${menuItem.inventoryItemId} not found for menu item "${menuItem.name}"`);
      return;
    }
    
    // Only enforce branch consistency if both inventory item and order have branchId
    // Items with branchId=null are global and available to all branches
    if (branchId && invItem.branchId && invItem.branchId !== branchId) {
      throw new Error(`Inventory item ${invItem.id} (${invItem.name}) belongs to branch ${invItem.branchId} but order is for branch ${branchId}`);
    }

    const requiredQty = parseFloat(menuItem.stockNo.toString()) * quantity;

    const existing = stockRequirements.get(invItem.id);
    if (existing) {
      existing.requiredQuantity += requiredQty;
    } else {
      stockRequirements.set(invItem.id, {
        inventoryItemId: invItem.id,
        inventoryItemName: invItem.name,
        requiredQuantity: requiredQty,
        availableQuantity: parseFloat(invItem.quantity),
        unit: invItem.unit,
      });
    }
  }

  private async validateStock(
    stockRequirements: Map<string, StockRequirement>
  ): Promise<StockValidationResult> {
    const insufficientItems: StockRequirement[] = [];

    for (const [_, requirement] of Array.from(stockRequirements.entries())) {
      if (requirement.availableQuantity < requirement.requiredQuantity) {
        insufficientItems.push(requirement);
      }
    }

    if (insufficientItems.length > 0) {
      const itemsList = insufficientItems
        .map(
          (item) =>
            `${item.inventoryItemName}: need ${item.requiredQuantity.toFixed(2)} ${item.unit}, have ${item.availableQuantity.toFixed(2)} ${item.unit}`
        )
        .join("; ");

      return {
        isValid: false,
        insufficientItems,
        message: `Insufficient inventory: ${itemsList}`,
      };
    }

    return { isValid: true };
  }

  private async deductInventory(
    stockRequirements: Map<string, StockRequirement>,
    orderId: string,
    branchId: string
  ): Promise<void> {
    await db.transaction(async (tx) => {
      for (const [inventoryItemId, requirement] of Array.from(stockRequirements.entries())) {
        // Use raw SQL to avoid unit_price column issue
        const result = await tx.execute(sql`
          SELECT id, restaurant_id as "restaurantId", quantity 
          FROM inventory_items WHERE id = ${inventoryItemId}
        `);
        const currentItem = (result as any).rows;

        if (!currentItem || currentItem.length === 0) continue;

        const quantityBefore = parseFloat(currentItem[0].quantity);
        const quantityAfter = quantityBefore - requirement.requiredQuantity;

        if (quantityAfter < 0) {
          throw new Error(
            `Cannot deduct ${requirement.requiredQuantity} ${requirement.unit} from ${requirement.inventoryItemName}. Only ${quantityBefore} ${requirement.unit} available.`
          );
        }

        // Record the transaction before potentially deleting the item
        const transactionRecord: InsertInventoryTransaction = {
          restaurantId: currentItem[0].restaurantId,
          inventoryItemId,
          orderId,
          type: "sale",
          quantityChange: (-requirement.requiredQuantity).toString(),
          quantityBefore: quantityBefore.toString(),
          quantityAfter: quantityAfter.toString(),
          notes: quantityAfter === 0 ? `Deducted for order - Item depleted and removed` : `Deducted for order`,
          branchId: branchId || undefined, // Convert empty string to undefined to avoid FK constraint violation
        };

        await tx.insert(inventoryTransactions).values(transactionRecord);

        if (quantityAfter === 0) {
          // Delete the inventory item when quantity reaches zero
          await tx
            .delete(inventoryItems)
            .where(eq(inventoryItems.id, inventoryItemId));
          console.log(`[INVENTORY] Deleted depleted item ${inventoryItemId} (${requirement.inventoryItemName})`);
        } else {
          // Update quantity and status
          await tx
            .update(inventoryItems)
            .set({
              quantity: quantityAfter.toString(),
              status: quantityAfter < 10 ? "Low Stock" : "In Stock",
            })
            .where(eq(inventoryItems.id, inventoryItemId));
        }
      }
    });
  }
}

export const orderProcessingService = new OrderProcessingService();
