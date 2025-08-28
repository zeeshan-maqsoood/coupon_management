import dbConnect from "@/lib/mongodb"
import Store from "@/models/Store"

async function listStores() {
  try {
    await dbConnect()
    
    // Find all stores with only the fields we care about
    const stores = await Store.find({})
      .select('storeName slug websiteUrl')
      .sort({ storeName: 1 })
      .lean()
    
    if (stores.length === 0) {
      console.log('No stores found in the database.')
      return
    }
    
    console.log('\n=== Store List ===')
    console.table(stores.map(store => ({
      'Store Name': store.storeName,
      'Slug': store.slug || 'MISSING',
      'Website URL': store.websiteUrl || 'MISSING'
    })))
    
    console.log('\n=== Summary ===')
    console.log(`Total stores: ${stores.length}`)
    console.log(`Stores with slug: ${stores.filter(s => s.slug).length}`)
    console.log(`Stores with website URL: ${stores.filter(s => s.websiteUrl).length}`)
    
  } catch (error) {
    console.error('Error listing stores:', error)
  } finally {
    process.exit(0)
  }
}

listStores()
