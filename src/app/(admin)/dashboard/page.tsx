import { MetricsCards } from '@/components/dashboard/MetricsCards'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { TopProductsChart } from '@/components/dashboard/TopProductsChart'
import { LowStockAlert } from '@/components/dashboard/LowStockAlert'
import { RecentSales } from '@/components/dashboard/RecentSales'
import { PaymentDistribution } from '@/components/dashboard/PaymentDistribution'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Visão geral do seu negócio
        </div>
      </div>
      <MetricsCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart />

        <TopProductsChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockAlert />

        <RecentSales />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <PaymentDistribution />
      </div>
    </div>
  )
}
