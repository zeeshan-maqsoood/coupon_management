import dbConnect from "@/lib/mongodb"
import Store from "@/models/Store"

async function checkStoreData() {
  try {
    await dbConnect()
    
    // Find all stores
    const stores = await Store.find({})
      .select('storeName slug websiteUrl')
      .lean()
    
    console.log('\n=== Store Data ===')
    console.table(stores.map(store => ({
      storeName: store.storeName,
      slug: store.slug || 'MISSING',
      websiteUrl: store.websiteUrl || 'MISSING'
    })))
    
    console.log('\n=== Summary ===')
    console.log(`Total stores: ${stores.length}`)
    console.log(`Stores with slug: ${stores.filter(s => s.slug).length}`)
    console.log(`Stores with websiteUrl: ${stores.filter(s => s.websiteUrl).length}`)
    
    process.exit(0)
  } catch (error) {
    console.error('Error checking store data:', error)
    process.exit(1)
  }
}

checkStoreData()
