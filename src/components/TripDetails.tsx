import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { formatPrice, formatDate } from "@/utils/formatters";

interface TripOrder {
  id: string;
  bottle_qty: number;
  bottle_price: number;
  loc_qty: number;
  loc_price: number;
  broken_qty: number;
  sell_vo_qty: number;
  sell_vo_price: number;
  return_vo_qty: number;
  missing_amount: number;
  total_price: number;
  customers: {
    name: string;
  };
}

interface Trip {
  id: string;
  date: string;
  driver_name: string;
  total_bottles: number;
}

interface TripDetailsProps {
  tripId?: string;
}

const TripDetails = ({ tripId }: TripDetailsProps) => {
  const [tripOrders, setTripOrders] = useState<TripOrder[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string>(tripId || "");
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      fetchTripDetails(selectedTrip);
    }
  }, [selectedTrip]);

  useEffect(() => {
    if (tripId) {
      setSelectedTrip(tripId);
    }
  }, [tripId]);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Lỗi khi tải chuyến đi:', error);
    }
  };

  const fetchTripDetails = async (tripId: string) => {
    setIsLoading(true);
    try {
      // Fetch trip details
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;
      setCurrentTrip(tripData);

      // Fetch trip orders with customer names
      const { data: ordersData, error: ordersError } = await supabase
        .from('trip_orders')
        .select(`
          *,
          customers (
            name
          )
        `)
        .eq('trip_id', tripId);

      if (ordersError) throw ordersError;
      setTripOrders(ordersData || []);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết chuyến đi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalBottles = tripOrders.reduce((sum, order) => sum + order.bottle_qty, 0);
  const totalRevenue = tripOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);
  const totalBroken = tripOrders.reduce((sum, order) => sum + order.broken_qty, 0);
  const totalShellsSold = tripOrders.reduce((sum, order) => sum + order.sell_vo_qty, 0);
  const totalShellsReturned = tripOrders.reduce((sum, order) => sum + order.return_vo_qty, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Chọn chuyến đi</Label>
        <Select value={selectedTrip} onValueChange={setSelectedTrip}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Chọn một chuyến đi để xem chi tiết" />
          </SelectTrigger>
          <SelectContent>
            {trips.map((trip) => (
              <SelectItem key={trip.id} value={trip.id}>
                {trip.date} - {trip.driver_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!isLoading && currentTrip && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chuyến đi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Ngày</p>
                  <p className="text-lg">{formatDate(currentTrip.date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tài xế</p>
                  <p className="text-lg">{currentTrip.driver_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tổng bình nước</p>
                  <p className="text-lg">{currentTrip.total_bottles}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bình đã giao</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalBottles}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bình hỏng</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{totalBroken}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Vỏ bình đã bán</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{totalShellsSold}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Vỏ bình đã trả</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{totalShellsReturned}</p>
              </CardContent>
            </Card>
          </div>

          {tripOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Đơn hàng của khách hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Khách hàng</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Bình nước</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Giá bình</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Lóc nước</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Bán vỏ</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Mượn vỏ</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Bình hỏng</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Tiền thiếu</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Tổng cộng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tripOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 font-medium">
                            {order.customers.name}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {order.bottle_qty}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {formatPrice(order.bottle_price)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {order.loc_qty} ({formatPrice(order.loc_price)})
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {order.sell_vo_qty}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {order.return_vo_qty}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center text-red-600">
                            {order.broken_qty}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center text-red-600">
                            {formatPrice(order.missing_amount)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right font-bold">
                            {formatPrice(order.total_price || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {tripOrders.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Không tìm thấy đơn hàng nào cho chuyến đi này.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default TripDetails;
