import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateTrip from "@/components/CreateTrip";
import AddCustomer from "@/components/AddCustomer";
import AddOrderToTrip from "@/components/AddOrderToTrip";
import TripDetails from "@/components/TripDetails";
import TripManagement from "@/components/TripManagement";
import CustomerManagement from "@/components/CustomerManagement";
import OrderManagement from "@/components/OrderManagement";
import Dashboard from "@/components/Dashboard";
import { Truck, Users, ClipboardList, BarChart3, Droplets } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/utils/formatters";

const Index = () => {
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [dashboardData, setDashboardData] = useState({
    activeTrips: 0,
    tripsTrend: 0,
    totalCustomers: 0,
    newCustomers: 0,
    todayOrders: 0,
    ordersTrend: 0,
    revenue: 0,
    revenueTrend: 0,
    topCustomers: [] as Array<{
      id: string;
      name: string;
      lastOrderDate: string;
      monthlySpend: number;
    }>
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Lấy số lượng chuyến đi đang hoạt động (giả định là chuyến đi trong ngày hiện tại)
      const today = new Date().toISOString().split('T')[0];
      const { data: activeTripsData } = await supabase
        .from('trips')
        .select('count')
        .eq('date', today);
      
      const activeTrips = activeTripsData?.[0]?.count || 0;
      
      // Lấy số lượng chuyến đi hôm qua để tính xu hướng
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const { data: yesterdayTripsData } = await supabase
        .from('trips')
        .select('count')
        .eq('date', yesterdayStr);
      
      const yesterdayTrips = yesterdayTripsData?.[0]?.count || 0;
      const tripsTrend = activeTrips - yesterdayTrips;
      
      // Lấy tổng số khách hàng
      const { data: customersData, count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact' });
      
      // Lấy số lượng khách hàng mới (giả định là khách hàng được thêm trong 7 ngày qua)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoStr = oneWeekAgo.toISOString();
      
      const { data: newCustomersData, count: newCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .gt('created_at', oneWeekAgoStr);
      
      // Lấy số lượng đơn hàng hôm nay
      const { data: todayOrdersData, count: todayOrders } = await supabase
        .from('trip_orders')
        .select('trips!inner(*)', { count: 'exact' })
        .eq('trips.date', today);
      
      // Lấy số lượng đơn hàng hôm qua để tính xu hướng
      const { data: yesterdayOrdersData, count: yesterdayOrders } = await supabase
        .from('trip_orders')
        .select('trips!inner(*)', { count: 'exact' })
        .eq('trips.date', yesterdayStr);
      
      const ordersTrend = yesterdayOrders ? Math.round((todayOrders - yesterdayOrders) / yesterdayOrders * 100) : 0;
      
      // Tính doanh thu (tổng tiền của tất cả đơn hàng trong tuần này)
      const { data: revenueData } = await supabase
        .from('trip_orders')
        .select('total_price')
        .gt('created_at', oneWeekAgoStr);
      
      const revenue = revenueData?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;
      
      // Tính doanh thu tuần trước để tính xu hướng
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const twoWeeksAgoStr = twoWeeksAgo.toISOString();
      
      const { data: lastWeekRevenueData } = await supabase
        .from('trip_orders')
        .select('total_price')
        .lt('created_at', oneWeekAgoStr)
        .gt('created_at', twoWeeksAgoStr);
      
      const lastWeekRevenue = lastWeekRevenueData?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;
      const revenueTrend = lastWeekRevenue ? Math.round((revenue - lastWeekRevenue) / lastWeekRevenue * 100) : 0;
      
      // Lấy top 3 khách hàng có tổng chi tiêu cao nhất trong tháng
      const { data: topCustomersData } = await supabase
        .from('trip_orders')
        .select(`
          customer_id,
          customers (id, name),
          total_price,
          created_at
        `)
        .order('total_price', { ascending: false })
        .limit(20);
      
      // Xử lý dữ liệu để tạo danh sách top khách hàng
      const customerSpendMap = new Map();
      const customerLastOrderMap = new Map();
      
      topCustomersData?.forEach(order => {
        const customerId = order.customer_id;
        const customerName = order.customers?.name || 'Không xác định';
        const totalPrice = order.total_price || 0;
        const createdAt = order.created_at;
        
        // Cập nhật tổng chi tiêu
        const currentSpend = customerSpendMap.get(customerId) || 0;
        customerSpendMap.set(customerId, currentSpend + totalPrice);
        
        // Cập nhật ngày đặt hàng gần nhất
        const currentLastOrder = customerLastOrderMap.get(customerId);
        if (!currentLastOrder || new Date(createdAt) > new Date(currentLastOrder)) {
          customerLastOrderMap.set(customerId, createdAt);
        }
      });
      
      // Tạo danh sách top khách hàng
      const topCustomers = Array.from(customerSpendMap.entries())
        .map(([id, spend]) => ({
          id,
          name: topCustomersData?.find(order => order.customer_id === id)?.customers?.name || 'Không xác định',
          lastOrderDate: formatDate(customerLastOrderMap.get(id) || ''),
          monthlySpend: spend
        }))
        .sort((a, b) => b.monthlySpend - a.monthlySpend)
        .slice(0, 3);
      
      setDashboardData({
        activeTrips,
        tripsTrend,
        totalCustomers: totalCustomers || 0,
        newCustomers: newCustomers || 0,
        todayOrders: todayOrders || 0,
        ordersTrend,
        revenue,
        revenueTrend,
        topCustomers
      });
      
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu Dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle tab change from Dashboard buttons
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Simplified Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Droplets className="h-6 w-6 text-blue-500" />
              <h1 className="text-xl font-medium text-slate-800">Quản lý Giao Nước</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="sticky top-0 z-10 bg-white py-3 shadow-sm rounded-lg">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-5 gap-2 p-1 bg-slate-100 rounded-xl">
              <TabsTrigger value="dashboard" className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <BarChart3 className="h-4 w-4" />
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="trips" className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <Truck className="h-4 w-4" />
                Chuyến đi
              </TabsTrigger>
              <TabsTrigger value="customers" className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <Users className="h-4 w-4" />
                Khách hàng
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <ClipboardList className="h-4 w-4" />
                Đơn hàng
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-md">
                <Truck className="h-4 w-4" />
                Chi tiết chuyến đi
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-blue-50 rounded-t-lg">
                <CardTitle>Tổng quan</CardTitle>
                <CardDescription>Thông tin tổng quan về hoạt động kinh doanh</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Dashboard 
                  activeTrips={dashboardData.activeTrips}
                  tripsTrend={dashboardData.tripsTrend}
                  totalCustomers={dashboardData.totalCustomers}
                  newCustomers={dashboardData.newCustomers}
                  todayOrders={dashboardData.todayOrders}
                  ordersTrend={dashboardData.ordersTrend}
                  revenue={dashboardData.revenue}
                  revenueTrend={dashboardData.revenueTrend}
                  topCustomers={dashboardData.topCustomers}
                  onTabChange={handleTabChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trips" className="mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-blue-50 rounded-t-lg">
                <CardTitle>Quản lý chuyến đi</CardTitle>
                <CardDescription>Xem và quản lý tất cả các chuyến giao hàng</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <TripManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-blue-50 rounded-t-lg">
                <CardTitle>Quản lý khách hàng</CardTitle>
                <CardDescription>Xem và quản lý tất cả khách hàng</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <CustomerManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-blue-50 rounded-t-lg">
                <CardTitle>Quản lý đơn hàng</CardTitle>
                <CardDescription>Xem và quản lý tất cả đơn hàng</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <OrderManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="bg-blue-50 rounded-t-lg">
                <CardTitle>Chi tiết chuyến đi</CardTitle>
                <CardDescription>Xem chi tiết chuyến giao hàng</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <TripDetails tripId={selectedTripId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
