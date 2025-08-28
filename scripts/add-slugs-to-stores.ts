import dbConnect from "@/lib/mongodb"
import Store from "@/models/Store"

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .trim()
}

async function addSlugsToStores() {
  try {
    await dbConnect()
    
    // Find all stores that need a slug
    const stores = await Store.find({
      $or: [
        { slug: { $exists: false } },
        { slug: { $in: ['', null] } }
      ]
    })

    if (stores.length === 0) {
      console.log('All stores already have slugs.')
      return
    }

    console.log(`Found ${stores.length} stores without slugs.`)
    
    for (const store of stores) {
      if (store.storeName) {
        // Generate a base slug
        let newSlug = generateSlug(store.storeName)
        let counter = 1
        let uniqueSlug = newSlug
        
        // Check if slug is already taken
        while (await Store.findOne({ slug: uniqueSlug, _id: { $ne: store._id } })) {
          uniqueSlug = `${newSlug}-${counter}`
          counter++
        }
        
        // Update the store with the new slug
        store.slug = uniqueSlug
        await store.save()
        console.log(`Updated store "${store.storeName}" with slug: ${uniqueSlug}`)
      }
    }
    
    console.log('\n=== Update Complete ===')
    console.log(`Added slugs to ${stores.length} stores.`)
    
  } catch (error) {
    console.error('Error adding slugs to stores:', error)
  } finally {
    process.exit(0)
  }
}

addSlugsToStores()
