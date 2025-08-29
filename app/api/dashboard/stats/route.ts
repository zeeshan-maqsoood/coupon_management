import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import Store from "@/models/Store"
import Category from "@/models/Category"
import Coupon from "@/models/Coupon"
import { verifyAccessToken } from "@/lib/jwt"

// This route needs to be dynamic because it uses request headers
export const dynamic = 'force-dynamic' // Force dynamic (server) route instead of static prerendering

export async function GET(request: Request) {
  try {
    // Check for auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = await verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    await dbConnect()
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Use a single aggregation pipeline to get all stats in one query
    const [stats] = await Store.aggregate([
      {
        $facet: {
          // Basic counts
          counts: [
            {
              $group: {
                _id: null,
                stores: { $sum: 1 },
                enabledStores: {
                  $sum: { $cond: [{ $eq: ["$status", "enable"] }, 1, 0] }
                },
                disabledStores: {
                  $sum: { $cond: [{ $eq: ["$status", "disable"] }, 1, 0] }
                },
                // Add coupon stats from embedded documents
                activeCoupons: {
                  $sum: {
                    $size: {
                      $filter: {
                        input: "$coupons",
                        as: "coupon",
                        cond: {
                          $and: [
                            { $eq: ["$$coupon.status", "active"] },
                            { $gt: ["$$coupon.expiryDate", now] }
                          ]
                        }
                      }
                    }
                  }
                },
                expiredCoupons: {
                  $sum: {
                    $size: {
                      $filter: {
                        input: "$coupons",
                        as: "coupon",
                        cond: {
                          $or: [
                            { $eq: ["$$coupon.status", "expired"] },
                            { $lte: ["$$coupon.expiryDate", now] }
                          ]
                        }
                      }
                    }
                  }
                },
                inactiveCoupons: {
                  $sum: {
                    $size: {
                      $filter: {
                        input: "$coupons",
                        as: "coupon",
                        cond: { $eq: ["$$coupon.status", "inactive"] }
                      }
                    }
                  }
                },
                totalCoupons: { $sum: { $size: "$coupons" } }
              }
            }
          ],
          // Recent stores (last 30 days)
          recentStores: [
            {
              $match: {
                createdAt: { $gte: thirtyDaysAgo }
              }
            },
            {
              $count: "count"
            }
          ]
        }
      },
      {
        $project: {
          counts: { $arrayElemAt: ["$counts", 0] },
          recentStores: {
            $ifNull: [{ $arrayElemAt: ["$recentStores.count", 0] }, 0]
          }
        }
      }
    ])

    // Get other counts in parallel
    const [userStats, categoryCount, recentUsers, recentCoupons] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            recent: {
              $sum: {
                $cond: [{ $gte: ["$createdAt", thirtyDaysAgo] }, 1, 0]
              }
            },
            roles: { $push: "$role" }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            recent: 1,
            roles: {
              $arrayToObject: {
                $map: {
                  input: { $setUnion: ["$roles"] },
                  as: "role",
                  in: {
                    k: "$$role",
                    v: {
                      $size: {
                        $filter: {
                          input: "$roles",
                          as: "r",
                          cond: { $eq: ["$$r", "$$role"] }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]),
      Category.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      // Count recent coupons from the last 30 days
      Store.aggregate([
        {
          $project: {
            recentCoupons: {
              $size: {
                $filter: {
                  input: "$coupons",
                  as: "coupon",
                  cond: { $gte: ["$$coupon.createdAt", thirtyDaysAgo] }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: "$recentCoupons" }
          }
        }
      ])
    ])

    const result = {
      overview: {
        users: userStats[0]?.total || 0,
        stores: stats?.counts?.stores || 0,
        categories: categoryCount,
        coupons: stats?.counts?.totalCoupons || 0,
      },
      coupons: {
        active: stats?.counts?.activeCoupons || 0,
        expired: stats?.counts?.expiredCoupons || 0,
        inactive: stats?.counts?.inactiveCoupons || 0,
        total: stats?.counts?.totalCoupons || 0,
      },
      stores: {
        enabled: stats?.counts?.enabledStores || 0,
        disabled: stats?.counts?.disabledStores || 0,
        total: stats?.counts?.stores || 0,
      },
      users: {
        total: userStats[0]?.total || 0,
        roles: userStats[0]?.roles || {},
      },
      recent: {
        users: { 
          value: userStats[0]?.recent || 0, 
          isPositive: (userStats[0]?.recent || 0) > 0 
        },
        stores: { 
          value: stats?.recentStores || 0, 
          isPositive: (stats?.recentStores || 0) > 0 
        },
        coupons: { 
          value: recentCoupons[0]?.count || 0, 
          isPositive: (recentCoupons[0]?.count || 0) > 0 
        },
      },
    }

    const response = NextResponse.json({ success: true, data: result })
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    return response
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
