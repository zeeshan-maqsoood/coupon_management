import dbConnect from "@/lib/mongodb"
import Store from "@/models/Store"

async function testStoreModel() {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    
    // Test creating a new store
    const testStore = new Store({
      storeName: "Test Store 123",
      storeHeading: "Test Store Heading",
      network: "Test Network",
      primaryCategory: new mongoose.Types.ObjectId(), // Mock category ID
      subCategory: new mongoose.Types.ObjectId(),     // Mock subcategory ID
      country: "Test Country",
      websiteUrl: "https://example.com",
      trackingLink: "https://example.com/track",
      storeThumbAlt: "Test Store",
      metaTitle: "Test Store Meta Title",
      metaKeywords: "test, store, example",
      metaDescription: "This is a test store description",
      status: "enable",
      storeDescription: "Test store description",
      moreAboutStore: "More about this test store",
      // slug should be auto-generated
    });
    
    await testStore.save();
    console.log('Test store created with slug:', testStore.slug);
    
    // Clean up
    await Store.findByIdAndDelete(testStore._id);
    console.log('Test store deleted');
    
  } catch (error) {
    console.error('Error testing store model:', error);
  } finally {
    process.exit(0);
  }
}

testStoreModel();
