import type React from "react"
import AdminHeader from "@/components/admin/admin-header"
import AdminSidebar from "@/components/admin/admin-sidebar"
import AdminClient from "./admin-client"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <AdminSidebar className="w-full" />
      <div className="flex flex-col">
        <AdminHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <AdminClient>
            {children}
          </AdminClient>
        </main>
      </div>
    </div>
  )
}
