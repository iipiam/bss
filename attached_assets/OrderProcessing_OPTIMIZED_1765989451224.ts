import { db } from "./db";
import { eq, and, sql, inArray } from "drizzle-orm";
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

// OPTIMIZATION: Simplified inventory item fetching with proper error handling
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

// OPTIMIZATION: Batch fetch multiple inventory items in parallel
async function getInventoryItemsBatch(ids: string[]): Promise<Map<string, InventoryItem>> {
  if (ids.length === 0) return new Map();
  
  try {
    const results = await db
      .select()
      .from(inventoryItems)
      .where(inArray(inventoryItems.id, ids));
    
    return new Map(results.map(item => [item.id, item]));
  } catch (error: any) {
    if (error.message?.includes('unit_price')) {
      console.log('[OrderProcessing] Batch query fallback for unit_price');
      const placeholders = ids.map(() => '?').join(',');
      const result = await db.execute(sql`
        SELECT id, restaurant_id as "restaurantId", name, category, quantity, unit,
               reference_quantity as "referenceQuantity", price,
               CASE WHEN reference_quantity::numeric > 0 
                    THEN (price::numeric / reference_quantity::numeric)::text 
                    ELSE '0' END as "unitPrice",
               supplier, status, branch_id as "branchId", sort_order as "sortOrder",
               expiration_days as "expirationDays", purchase_date as "purchaseDate"
        FROM inventory_items WHERE id IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})
      `);
      const rows = (result as any).rows as InventoryItem[];
      return new Map(rows.map(item => [item.id, item]));
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
  // OPTIMIZATION: Batch query all menu items at once instead of N+1 queries
  async prepareOrderStock(
    orderItems: OrderItem[],
    branchId: string
  ): Promise<StockValidationResult & { stockRequirements?: Map<string, StockRequirement> }> {
    try {
      const stockRequirements: Map<string, StockRequirement> = new Map();

      // OPTIMIZATION 1: Batch fetch all menu items in a single query
      const menuItemIds = orderItems.map(item => item.id);
      const menuItemsData = await db
        .select()
        .from(menuItems)
        .where(inArray(menuItems.id, menuItemIds));

      // Create lookup map for O(1) access
      const menuItemMap = new Map<string, MenuItem>(
        menuItemsData.map(item => [item.id, item])
      );

      // OPTIMIZATION 2: Collect all recipe IDs to batch fetch recipes
      const recipeIds = menuItemsData
        .filter(item => item.recipeId)
        .map(item => item.recipeId!);

      let recipesMap = new Map<string, Recipe>();
      if (recipeIds.length > 0) {
        const recipesData = await db
          .select()
          .from(recipes)
          .where(inArray(recipes.id, recipeIds));
        recipesMap = new Map(recipesData.map(recipe => [recipe.id, recipe]));
      }

      // OPTIMIZATION 3: Process all items with cached data
      for (const orderItem of orderItems) {
        const item = menuItemMap.get(orderItem.id);
        if (!item) continue;

        if (item.recipeId) {
          const recipe = recipesMap.get(item.recipeId);
          if (recipe) {
            await this.processRecipeBasedItemOptimized(
              item,
              recipe,
              orderItem.quantity,
              stockRequirements,
              branchId
            );
          }
        } else if (item.stockNo) {
          await this.processSimpleItemOptimized(
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

  // OPTIMIZATION: Use cached stock data instead of re-querying
  private async deductInventoryInTransaction(
    tx: any,
    stockRequirements: Map<string, StockRequirement>,
    orderId: string,
    branchId: string
  ): Promise<void> {
    // OPTIMIZATION: Prepare all updates and inserts for batch execution
    const updates: Array<{ id: string; quantity: string; status: string }> = [];
    const deletes: string[] = [];
    const transactions: InsertInventoryTransaction[] = [];

    for (const [inventoryItemId, requirement] of Array.from(stockRequirements.entries())) {
      // OPTIMIZATION: Use cached availableQuantity instead of querying
      const quantityBefore = requirement.availableQuantity;
      const quantityAfter = quantityBefore - requirement.requiredQuantity;

      if (quantityAfter < 0) {
        throw new Error(
          `Cannot deduct ${requirement.requiredQuantity} ${requirement.unit} from ${requirement.inventoryItemName}. Only ${quantityBefore} ${requirement.unit} available.`
        );
      }

      // Get restaurant ID for transaction record
      const invItem = await tx
        .select({ restaurantId: inventoryItems.restaurantId })
        .from(inventoryItems)
        .where(eq(inventoryItems.id, inventoryItemId))
        .limit(1);

      if (!invItem || invItem.length === 0) continue;

      // Prepare transaction record
      transactions.push({
        restaurantId: invItem[0].restaurantId,
        inventoryItemId,
        orderId,
        type: "sale",
        quantityChange: (-requirement.requiredQuantity).toString(),
        quantityBefore: quantityBefore.toString(),
        quantityAfter: quantityAfter.toString(),
        notes: quantityAfter === 0 ? `Deducted for order - Item depleted and removed` : `Deducted for order`,
        branchId: branchId || undefined,
      });

      if (quantityAfter === 0) {
        deletes.push(inventoryItemId);
      } else {
        updates.push({
          id: inventoryItemId,
          quantity: quantityAfter.toString(),
          status: quantityAfter < 10 ? "Low Stock" : "In Stock",
        });
      }
    }

    // OPTIMIZATION: Batch insert all transactions at once
    if (transactions.length > 0) {
      await tx.insert(inventoryTransactions).values(transactions);
    }

    // OPTIMIZATION: Batch update all inventory items at once
    if (updates.length > 0) {
      for (const update of updates) {
        await tx
          .update(inventoryItems)
          .set({ quantity: update.quantity, status: update.status })
          .where(eq(inventoryItems.id, update.id));
      }
    }

    // OPTIMIZATION: Batch delete all depleted items at once
    if (deletes.length > 0) {
      await tx
        .delete(inventoryItems)
        .where(inArray(inventoryItems.id, deletes));
      console.log(`[INVENTORY] Deleted ${deletes.length} depleted items`);
    }
  }

  // OPTIMIZATION: Process recipe with pre-fetched recipe data and parallel ingredient fetching
  private async processRecipeBasedItemOptimized(
    menuItem: MenuItem,
    recipe: Recipe,
    quantity: number,
    stockRequirements: Map<string, StockRequirement>,
    branchId: string
  ): Promise<void> {
    const portionMultiplier = parseFloat(menuItem.portionSize || "1.00");

    // OPTIMIZATION: Collect all ingredient IDs first
    const ingredientIds = recipe.ingredients.map(ing => ing.inventoryItemId);
    
    // OPTIMIZATION: Batch fetch all inventory items in parallel
    const inventoryMap = await getInventoryItemsBatch(ingredientIds);

    // Process all ingredients with cached data
    for (const ingredient of recipe.ingredients) {
      const requiredQty = ingredient.quantity * portionMultiplier * quantity;
      
      const existing = stockRequirements.get(ingredient.inventoryItemId);
      if (existing) {
        existing.requiredQuantity += requiredQty;
      } else {
        const invItem = inventoryMap.get(ingredient.inventoryItemId);

        if (invItem) {
          // Branch validation
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

  // OPTIMIZATION: Process simple item with cached data
  private async processSimpleItemOptimized(
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
    
    // Branch validation
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

  // OPTIMIZATION: Use cached stock data instead of re-querying
  private async deductInventory(
    stockRequirements: Map<string, StockRequirement>,
    orderId: string,
    branchId: string
  ): Promise<void> {
    await db.transaction(async (tx) => {
      const updates: Array<{ id: string; quantity: string; status: string }> = [];
      const deletes: string[] = [];
      const transactions: InsertInventoryTransaction[] = [];

      for (const [inventoryItemId, requirement] of Array.from(stockRequirements.entries())) {
        // OPTIMIZATION: Use cached availableQuantity
        const quantityBefore = requirement.availableQuantity;
        const quantityAfter = quantityBefore - requirement.requiredQuantity;

        if (quantityAfter < 0) {
          throw new Error(
            `Cannot deduct ${requirement.requiredQuantity} ${requirement.unit} from ${requirement.inventoryItemName}. Only ${quantityBefore} ${requirement.unit} available.`
          );
        }

        // Get restaurant ID
        const invItem = await tx
          .select({ restaurantId: inventoryItems.restaurantId })
          .from(inventoryItems)
          .where(eq(inventoryItems.id, inventoryItemId))
          .limit(1);

        if (!invItem || invItem.length === 0) continue;

        transactions.push({
          restaurantId: invItem[0].restaurantId,
          inventoryItemId,
          orderId,
          type: "sale",
          quantityChange: (-requirement.requiredQuantity).toString(),
          quantityBefore: quantityBefore.toString(),
          quantityAfter: quantityAfter.toString(),
          notes: quantityAfter === 0 ? `Deducted for order - Item depleted and removed` : `Deducted for order`,
          branchId: branchId || undefined,
        });

        if (quantityAfter === 0) {
          deletes.push(inventoryItemId);
        } else {
          updates.push({
            id: inventoryItemId,
            quantity: quantityAfter.toString(),
            status: quantityAfter < 10 ? "Low Stock" : "In Stock",
          });
        }
      }

      // Batch operations
      if (transactions.length > 0) {
        await tx.insert(inventoryTransactions).values(transactions);
      }

      if (updates.length > 0) {
        for (const update of updates) {
          await tx
            .update(inventoryItems)
            .set({ quantity: update.quantity, status: update.status })
            .where(eq(inventoryItems.id, update.id));
        }
      }

      if (deletes.length > 0) {
        await tx
          .delete(inventoryItems)
          .where(inArray(inventoryItems.id, deletes));
        console.log(`[INVENTORY] Deleted ${deletes.length} depleted items`);
      }
    });
  }
}

export const orderProcessingService = new OrderProcessingService();
