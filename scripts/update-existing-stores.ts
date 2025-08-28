import dbConnect from "@/lib/mongodb"
import Store from "@/models/Store"

function generateSlug(storeName: string): string {
  return storeName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .trim()
}

async function updateExistingStores() {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    
    // Find all stores
    const stores = await Store.find({});
    console.log(`Found ${stores.length} stores to process.`);
    
    let updatedCount = 0;
    
    for (const store of stores) {
      const updates: any = {};
      let needsUpdate = false;
      
      // Add slug if missing
      if (!store.slug && store.storeName) {
        updates.slug = generateSlug(store.storeName);
        needsUpdate = true;
      }
      
      // Trim website URL if it exists
      if (store.websiteUrl && typeof store.websiteUrl === 'string') {
        const trimmedUrl = store.websiteUrl.trim();
        if (trimmedUrl !== store.websiteUrl) {
          updates.websiteUrl = trimmedUrl;
          needsUpdate = true;
        }
      }
      
      // Update store if needed
      if (needsUpdate) {
        await Store.findByIdAndUpdate(store._id, { $set: updates });
        console.log(`Updated store: ${store.storeName}`);
        if (updates.slug) console.log(`  - Added slug: ${updates.slug}`);
        if (updates.websiteUrl) console.log(`  - Trimmed website URL`);
        updatedCount++;
      }
    }
    
    console.log(`\n=== Update Complete ===`);
    console.log(`Total stores processed: ${stores.length}`);
    console.log(`Stores updated: ${updatedCount}`);
    
  } catch (error) {
    console.error('Error updating stores:', error);
  } finally {
    process.exit(0);
  }
}

updateExistingStores();
