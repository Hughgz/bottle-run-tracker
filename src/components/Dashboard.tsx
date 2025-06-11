import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Users, ClipboardList, BarChart3, ArrowUpRight } from "lucide-react";

interface DashboardProps {
  activeTrips: number;
  tripsTrend: number;
  totalCustomers: number;
  newCustomers: number;
  todayOrders: number;
  ordersTrend: number;
  revenue: number;
  revenueTrend: number;
  topCustomers: Array<{
    id: string;
    name: string;
    lastOrderDate: string;
    monthlySpend: number;
  }>;
  onTabChange: (tab: string) => void;
}

const Dashboard = ({
  activeTrips = 12,
  tripsTrend = 2,
  totalCustomers = 145,
  newCustomers = 5,
  todayOrders = 28,
  ordersTrend = 12,
  revenue = 2450000,
  revenueTrend = 8,
  topCustomers = [],
  onTabChange
}: Partial<DashboardProps>) => {
  // Sử dụng dữ liệu mẫu nếu không có dữ liệu truyền vào
  const defaultTopCustomers = [
    { id: '1', name: 'Khách hàng 1', lastOrderDate: 'Hôm nay', monthlySpend: 100000 },
    { id: '2', name: 'Khách hàng 2', lastOrderDate: 'Hôm nay', monthlySpend: 200000 },
    { id: '3', name: 'Khách hàng 3', lastOrderDate: 'Hôm nay', monthlySpend: 300000 }
  ];

  const customersToShow = topCustomers.length > 0 ? topCustomers : defaultTopCustomers;

  // Format số tiền theo định dạng VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-blue-50 rounded-t-lg">
            <CardTitle className="text-sm font-medium">Chuyến đi đang hoạt động</CardTitle>
            <div className="p-2 bg-blue-100 rounded-full">
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{activeTrips}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+{tripsTrend}</span> so với hôm qua
            </p>
          </CardContent>
          <CardFooter className="pt-0 pb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-blue-600 p-0 h-auto"
              onClick={() => onTabChange && onTabChange("details")}
            >
              Xem tất cả chuyến đi
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50 rounded-t-lg">
            <CardTitle className="text-sm font-medium">Tổng số khách hàng</CardTitle>
            <div className="p-2 bg-green-100 rounded-full">
              <Users className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+{newCustomers}</span> khách hàng mới
            </p>
          </CardContent>
          <CardFooter className="pt-0 pb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-green-600 p-0 h-auto"
              onClick={() => onTabChange && onTabChange("customers")}
            >
              Quản lý khách hàng
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-purple-50 rounded-t-lg">
            <CardTitle className="text-sm font-medium">Đơn hàng hôm nay</CardTitle>
            <div className="p-2 bg-purple-100 rounded-full">
              <ClipboardList className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{todayOrders}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+{ordersTrend}%</span> so với hôm qua
            </p>
          </CardContent>
          <CardFooter className="pt-0 pb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-purple-600 p-0 h-auto"
              onClick={() => onTabChange && onTabChange("orders")}
            >
              Xem tất cả đơn hàng
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-amber-50 rounded-t-lg">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <div className="p-2 bg-amber-100 rounded-full">
              <BarChart3 className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{formatCurrency(revenue)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">+{revenueTrend}%</span> so với tuần trước
            </p>
          </CardContent>
          <CardFooter className="pt-0 pb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-amber-600 p-0 h-auto"
              onClick={() => onTabChange && onTabChange("trips")}
            >
              Xem chi tiết doanh thu
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 border-none shadow-md">
          <CardHeader>
            <CardTitle>Chuyến đi gần đây</CardTitle>
            <CardDescription>Tổng quan về các chuyến giao hàng gần đây</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-slate-50 p-6 h-64 flex items-center justify-center">
              <p className="text-slate-400">Biểu đồ chuyến đi sẽ xuất hiện ở đây</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>Khách hàng hàng đầu</CardTitle>
            <CardDescription>Những khách hàng hoạt động nhiều nhất của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customersToShow.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-slate-500">Đơn hàng cuối: {customer.lastOrderDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(customer.monthlySpend)}</p>
                    <p className="text-xs text-slate-500">Tháng này</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Dashboard; 