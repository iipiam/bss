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

// OPTIMIZATION: Batch fetch multiple inventory items in parallel using SQL IN clause
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
  restaurantId?: string; // Cache restaurant ID for transaction
  unitPrice: number; // Price per unit (constant)
  totalPrice: number; // Current total price in inventory
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

      // OPTIMIZATION 3: Collect all inventory IDs needed (from recipes and direct links)
      const allInventoryIds = new Set<string>();
      
      // Collect from recipes
      for (const recipe of Array.from(recipesMap.values())) {
        for (const ingredient of recipe.ingredients) {
          allInventoryIds.add(ingredient.inventoryItemId);
        }
      }
      
      // Collect from direct inventory links
      for (const item of menuItemsData) {
        if (item.inventoryItemId && item.stockNo) {
          allInventoryIds.add(item.inventoryItemId);
        }
      }

      // OPTIMIZATION 4: Batch fetch all inventory items in parallel
      const inventoryMap = await getInventoryItemsBatch(Array.from(allInventoryIds));

      // OPTIMIZATION 5: Process all items with cached data (no more N+1 queries!)
      for (const orderItem of orderItems) {
        const item = menuItemMap.get(orderItem.id);
        if (!item) continue;

        if (item.recipeId) {
          const recipe = recipesMap.get(item.recipeId);
          if (recipe) {
            this.processRecipeBasedItemOptimized(
              item,
              recipe,
              orderItem.quantity,
              stockRequirements,
              branchId,
              inventoryMap
            );
          }
        } else if (item.stockNo && item.inventoryItemId) {
          this.processSimpleItemOptimized(
            item,
            orderItem.quantity,
            stockRequirements,
            branchId,
            inventoryMap
          );
        }
      }

      const validationResult = this.validateStock(stockRequirements);
      
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

  // OPTIMIZATION: Use cached stock data instead of re-querying each item
  private async deductInventoryInTransaction(
    tx: any,
    stockRequirements: Map<string, StockRequirement>,
    orderId: string,
    branchId: string
  ): Promise<void> {
    // OPTIMIZATION: Batch collect all inventory IDs to fetch restaurant IDs at once
    const inventoryIds = Array.from(stockRequirements.keys());
    
    // Early return if no inventory to deduct
    if (inventoryIds.length === 0) {
      console.log('[INVENTORY] No inventory items to deduct for this order');
      return;
    }
    
    // Fetch only restaurant IDs for all items in one query
    const restaurantIdResult = await tx.execute(sql`
      SELECT id, restaurant_id as "restaurantId" 
      FROM inventory_items 
      WHERE id IN (${sql.join(inventoryIds.map(id => sql`${id}`), sql`, `)})
    `);
    const restaurantIdMap = new Map<string, string>(
      ((restaurantIdResult as any).rows || []).map((r: any) => [r.id, r.restaurantId])
    );

    // Prepare batch operations
    const transactions: InsertInventoryTransaction[] = [];
    const updates: Array<{ id: string; quantity: string; price: string; status: string }> = [];

    for (const [inventoryItemId, requirement] of Array.from(stockRequirements.entries())) {
      // OPTIMIZATION: Use cached availableQuantity instead of re-querying
      const quantityBefore = requirement.availableQuantity;
      const quantityAfter = quantityBefore - requirement.requiredQuantity;

      if (quantityAfter < 0) {
        throw new Error(
          `Cannot deduct ${requirement.requiredQuantity} ${requirement.unit} from ${requirement.inventoryItemName}. Only ${quantityBefore} ${requirement.unit} available.`
        );
      }

      const restaurantId = restaurantIdMap.get(inventoryItemId);
      if (!restaurantId) continue;

      // Prepare transaction record
      transactions.push({
        restaurantId,
        inventoryItemId,
        orderId,
        type: "sale",
        quantityChange: (-requirement.requiredQuantity).toString(),
        quantityBefore: quantityBefore.toString(),
        quantityAfter: quantityAfter.toString(),
        notes: quantityAfter === 0 ? `Deducted for order - Item depleted` : `Deducted for order`,
        branchId: branchId || undefined,
      });

      // Calculate new price: maintain constant unit price by deducting proportionally
      // newPrice = quantityAfter × unitPrice (will be 0 when depleted - correct for total value)
      const newPrice = quantityAfter * requirement.unitPrice;
      
      // Determine status based on quantity
      // Note: We update to "Depleted" status instead of deleting to preserve FK integrity
      // Unit price history is preserved in inventory_transactions for reorder calculations
      let status: string;
      if (quantityAfter === 0) {
        status = "Depleted";
      } else if (quantityAfter < 10) {
        status = "Low Stock";
      } else {
        status = "In Stock";
      }
      
      updates.push({
        id: inventoryItemId,
        quantity: quantityAfter.toString(),
        price: newPrice.toFixed(2),
        status,
      });
    }

    // OPTIMIZATION: Batch insert all transaction records
    if (transactions.length > 0) {
      await tx.insert(inventoryTransactions).values(transactions);
    }

    // Execute updates (still need individual updates due to different values)
    // Note: We update items to zero quantity with "Depleted" status instead of deleting
    // This preserves the foreign key relationship with inventory_transactions
    for (const update of updates) {
      await tx
        .update(inventoryItems)
        .set({ quantity: update.quantity, price: update.price, status: update.status })
        .where(eq(inventoryItems.id, update.id));
    }
    
    const depletedCount = updates.filter(u => u.status === "Depleted").length;
    if (depletedCount > 0) {
      console.log(`[INVENTORY] Marked ${depletedCount} items as Depleted (quantity=0)`);
    }
  }

  // OPTIMIZATION: Process recipe with pre-fetched data (no queries inside!)
  private processRecipeBasedItemOptimized(
    menuItem: MenuItem,
    recipe: Recipe,
    quantity: number,
    stockRequirements: Map<string, StockRequirement>,
    branchId: string,
    inventoryMap: Map<string, InventoryItem>
  ): void {
    const portionMultiplier = parseFloat(menuItem.portionSize || "1.00");

    for (const ingredient of recipe.ingredients) {
      const requiredQty = ingredient.quantity * portionMultiplier * quantity;
      
      const existing = stockRequirements.get(ingredient.inventoryItemId);
      if (existing) {
        existing.requiredQuantity += requiredQty;
      } else {
        const invItem = inventoryMap.get(ingredient.inventoryItemId);

        // CRITICAL: Throw error if inventory item is missing (not just warn)
        if (!invItem) {
          throw new Error(`Inventory item ${ingredient.inventoryItemId} (${ingredient.name}) not found for recipe "${recipe.name}" in menu item "${menuItem.name}"`);
        }

        // Branch validation
        if (branchId && invItem.branchId && invItem.branchId !== branchId) {
          throw new Error(`Inventory item ${invItem.id} (${invItem.name}) belongs to branch ${invItem.branchId} but order is for branch ${branchId}`);
        }
        
        const availableQty = parseFloat(invItem.quantity);
        const totalPriceVal = parseFloat(invItem.price || "0");
        const unitPriceVal = availableQty > 0 ? totalPriceVal / availableQty : 0;
        
        stockRequirements.set(ingredient.inventoryItemId, {
          inventoryItemId: ingredient.inventoryItemId,
          inventoryItemName: ingredient.name,
          requiredQuantity: requiredQty,
          availableQuantity: availableQty,
          unit: ingredient.unit,
          unitPrice: unitPriceVal,
          totalPrice: totalPriceVal,
        });
      }
    }
  }

  // OPTIMIZATION: Process simple item with pre-fetched data (no queries inside!)
  private processSimpleItemOptimized(
    menuItem: MenuItem,
    quantity: number,
    stockRequirements: Map<string, StockRequirement>,
    branchId: string,
    inventoryMap: Map<string, InventoryItem>
  ): void {
    if (!menuItem.inventoryItemId || !menuItem.stockNo) {
      // Menu items without inventory links are allowed (infinite stock)
      console.log(`[OrderProcessing] Menu item "${menuItem.name}" has no inventory link - skipping stock validation`);
      return;
    }

    const invItem = inventoryMap.get(menuItem.inventoryItemId);

    // CRITICAL: Throw error if linked inventory item is missing
    if (!invItem) {
      throw new Error(`Inventory item ${menuItem.inventoryItemId} not found for menu item "${menuItem.name}". Please check inventory link.`);
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
      const availableQty = parseFloat(invItem.quantity);
      const totalPriceVal = parseFloat(invItem.price || "0");
      const unitPriceVal = availableQty > 0 ? totalPriceVal / availableQty : 0;
      
      stockRequirements.set(invItem.id, {
        inventoryItemId: invItem.id,
        inventoryItemName: invItem.name,
        requiredQuantity: requiredQty,
        availableQuantity: availableQty,
        unit: invItem.unit,
        unitPrice: unitPriceVal,
        totalPrice: totalPriceVal,
      });
    }
  }

  private validateStock(
    stockRequirements: Map<string, StockRequirement>
  ): StockValidationResult {
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
      await this.deductInventoryInTransaction(tx, stockRequirements, orderId, branchId);
    });
  }

  async deductInventoryForMealDelivery(
    menuItemIds: string[],
    restaurantId: string,
    subscriptionId: string,
    mealTime: string
  ): Promise<{ deducted: boolean; details: string[] }> {
    if (menuItemIds.length === 0) {
      return { deducted: false, details: ["No menu items linked to subscription"] };
    }

    try {
      const menuItemResults = await db
        .select()
        .from(menuItems)
        .where(and(
          inArray(menuItems.id, menuItemIds),
          eq(menuItems.restaurantId, restaurantId)
        ));

      if (menuItemResults.length === 0) {
        return { deducted: false, details: ["No matching menu items found"] };
      }

      const recipeIds = menuItemResults
        .filter((m) => m.recipeId)
        .map((m) => m.recipeId!);

      let recipesMap = new Map<string, Recipe>();
      if (recipeIds.length > 0) {
        const recipeResults = await db
          .select()
          .from(recipes)
          .where(inArray(recipes.id, recipeIds));
        for (const r of recipeResults) {
          recipesMap.set(r.id, r);
        }
      }

      const allInventoryIds = new Set<string>();
      for (const item of menuItemResults) {
        if (item.recipeId) {
          const recipe = recipesMap.get(item.recipeId);
          if (recipe?.ingredients) {
            for (const ing of recipe.ingredients) {
              allInventoryIds.add(ing.inventoryItemId);
            }
          }
        } else if (item.inventoryItemId) {
          allInventoryIds.add(item.inventoryItemId);
        }
      }

      if (allInventoryIds.size === 0) {
        return { deducted: false, details: ["No inventory items linked to selected menu items"] };
      }

      const inventoryMap = await getInventoryItemsBatch(Array.from(allInventoryIds));
      const stockRequirements = new Map<string, StockRequirement>();
      const quantity = 1;

      for (const item of menuItemResults) {
        if (item.recipeId) {
          const recipe = recipesMap.get(item.recipeId);
          if (recipe) {
            this.processRecipeBasedItemOptimized(item, recipe, quantity, stockRequirements, "", inventoryMap);
          }
        } else if (item.stockNo && item.inventoryItemId) {
          this.processSimpleItemOptimized(item, quantity, stockRequirements, "", inventoryMap);
        }
      }

      if (stockRequirements.size === 0) {
        return { deducted: false, details: ["No stock requirements calculated"] };
      }

      const validation = this.validateStock(stockRequirements);
      if (!validation.isValid) {
        console.warn(`[MealDelivery] Insufficient stock for subscription ${subscriptionId}: ${validation.message}`);
      }

      const refId = `MSUB-${subscriptionId.substring(0, 8)}-${mealTime}`;
      await db.transaction(async (tx) => {
        const inventoryIds = Array.from(stockRequirements.keys());
        const restaurantIdResult = await tx.execute(sql`
          SELECT id, restaurant_id as "restaurantId" 
          FROM inventory_items 
          WHERE id IN (${sql.join(inventoryIds.map(id => sql`${id}`), sql`, `)})
        `);
        const restaurantIdMap = new Map<string, string>(
          ((restaurantIdResult as any).rows || []).map((r: any) => [r.id, r.restaurantId])
        );

        const transactions: InsertInventoryTransaction[] = [];
        const updates: Array<{ id: string; quantity: string; price: string; status: string }> = [];

        for (const [inventoryItemId, requirement] of Array.from(stockRequirements.entries())) {
          const quantityBefore = requirement.availableQuantity;
          let quantityAfter = quantityBefore - requirement.requiredQuantity;
          if (quantityAfter < 0) quantityAfter = 0;

          const rid = restaurantIdMap.get(inventoryItemId);
          if (!rid) continue;

          transactions.push({
            restaurantId: rid,
            inventoryItemId,
            orderId: refId,
            type: "sale",
            quantityChange: (-requirement.requiredQuantity).toString(),
            quantityBefore: quantityBefore.toString(),
            quantityAfter: quantityAfter.toString(),
            notes: `Meal subscription delivery (${mealTime})`,
          });

          const newPrice = quantityAfter * requirement.unitPrice;
          let status: string;
          if (quantityAfter === 0) status = "Depleted";
          else if (quantityAfter < 10) status = "Low Stock";
          else status = "In Stock";

          updates.push({
            id: inventoryItemId,
            quantity: quantityAfter.toString(),
            price: newPrice.toFixed(2),
            status,
          });
        }

        if (transactions.length > 0) {
          await tx.insert(inventoryTransactions).values(transactions);
        }
        for (const update of updates) {
          await tx
            .update(inventoryItems)
            .set({ quantity: update.quantity, price: update.price, status: update.status })
            .where(eq(inventoryItems.id, update.id));
        }
      });

      const details = Array.from(stockRequirements.entries()).map(
        ([_, req]) => `${req.inventoryItemName}: -${req.requiredQuantity.toFixed(2)} ${req.unit}`
      );
      console.log(`[MealDelivery] Deducted inventory for subscription ${subscriptionId} (${mealTime}):`, details);
      return { deducted: true, details };
    } catch (error: any) {
      console.error(`[MealDelivery] Error deducting inventory for subscription ${subscriptionId}:`, error);
      return { deducted: false, details: [error.message] };
    }
  }
}

export const orderProcessingService = new OrderProcessingService();
