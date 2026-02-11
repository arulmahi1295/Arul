import { storage } from '../data/storage';

/**
 * Deducts inventory stock based on order tests.
 * Heuristic: 1 tube per Unique Category per Patient.
 * @param {Object} order - The order object with tests array.
 * @returns {Promise<Array<string>>} - Array of names of items deducted.
 */
export const processStockDeduction = async (order) => {
    let log = [];
    if (!order || !order.tests) return log;

    // Fetch current inventory
    const inventoryItems = await storage.getInventory();

    // 1. Deduct Standard Consumables (1 per Patient/Order)
    const standardConsumables = [
        ['NEEDLE', 'VACUTAINER NEEDLE', 'BUTTERFLY'],
        ['SWAB', 'ALCOHOL SWAB', 'SPIRIT'],
        ['PLASTER', 'BAND-AID', 'SPOT'],
        ['GLOVE', 'LATEX', 'NITRILE'], // Pair
        ['HOLDER', 'HUB'] // Reusable? Usually discarded in some protocols, let's assume 1 per patient if tracked
    ];

    for (const group of standardConsumables) {
        const item = inventoryItems.find(i =>
            group.some(k => i.name.toUpperCase().includes(k)) && Number(i.quantity) > 0
        );
        if (item) {
            await storage.updateInventoryItem(item.id, { quantity: Number(item.quantity) - 1 });
            item.quantity = Number(item.quantity) - 1; // Update local
            log.push(item.name);
        }
    }

    // 2. Deduct Tubes (1 tube per Unique Category per Patient)
    const cats = new Set(order.tests.map(t => (t.category || '').toUpperCase()));

    for (const cat of cats) {
        let keywords = [];
        if (cat === 'HEMATOLOGY') keywords = ['EDTA', 'LAVENDER', 'CBC'];
        else if (cat.includes('BIOCHEMISTRY') || cat.includes('IMMUNOLOGY') || cat.includes('SEROLOGY')) keywords = ['SST', 'YELLOW', 'SERUM', 'PLAIN', 'CLOT'];
        else if (cat.includes('GLUCOSE') || cat.includes('DIABETES')) keywords = ['FLUORIDE', 'GREY', 'GRAY'];
        else if (cat.includes('COAGULATION')) keywords = ['CITRATE', 'BLUE'];
        else if (cat.includes('URINE') || cat.includes('CLINICAL')) keywords = ['URINE', 'CONTAINER'];

        if (keywords.length > 0) {
            // Find first matching item with stock
            // We re-fetch or use a fresh list to minimize race conditions, 
            // though for high concurrency this needs a transaction. 
            // For now, client-side finding is acceptable as per previous implementation.

            const item = inventoryItems.find(i =>
                keywords.some(k => i.name.toUpperCase().includes(k)) && Number(i.quantity) > 0
            );

            if (item) {
                // Update specific item
                await storage.updateInventoryItem(item.id, { quantity: Number(item.quantity) - 1 });

                // Update local list to prevent double counting if multiple categories map to same tube type in same loop?
                // Actually the loop is per category. If Hematology needs EDTA, and another category needs EDTA, we might deduction twice.
                // The prompt says "1 tube per Unique Category".
                // So if we have multiple categories needing different tubes, we deduct different tubes.
                // If two categories map to the SAME tube, we check stock again.
                // To be safe, we should decrement our in-memory copy.
                item.quantity = Number(item.quantity) - 1;

                log.push(item.name);
            }
        }
    }
    return log;
};
