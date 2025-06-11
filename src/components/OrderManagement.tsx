import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  FileText,
  ClipboardList,
  PlusCircle,
  ListFilter,
  Eye,
  TruckIcon,
  UserPlus,
  X
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddOrderToTrip from "./AddOrderToTrip";
import { formatPrice, formatDate } from "@/utils/formatters";
import { Pagination } from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Customer {
  id: string;
  name: string;
}

interface Trip {
  id: string;
  date: string;
  driver_name: string;
  total_bottles: number;
}

interface Order {
  id: string;
  trip_id: string;
  customer_id: string;
  customer_name: string;
  trip_date: string;
  driver_name: string;
  bottle_qty: number;
  bottle_price: number;
  total_price: number;
  loc_qty?: number;
  loc_price?: number;
  broken_qty?: number;
  sell_vo_qty?: number;
  sell_vo_price?: number;
  return_vo_qty?: number;
  missing_amount?: number;
  created_at: string;
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const { toast } = useToast();

  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedOrders, setPaginatedOrders] = useState<Order[]>([]);

  const [selectedTripDetails, setSelectedTripDetails] = useState<Trip | null>(null);
  const [tripOrders, setTripOrders] = useState<Order[]>([]);
  const [isLoadingTripOrders, setIsLoadingTripOrders] = useState(false);

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");
  const [bottleQty, setBottleQty] = useState<number>(1);
  const [bottlePrice, setBottlePrice] = useState<number>(0);
  const [locQty, setLocQty] = useState<number>(0);
  const [locPrice, setLocPrice] = useState<number>(0);
  const [brokenQty, setBrokenQty] = useState<number>(0);
  const [sellVoQty, setSellVoQty] = useState<number>(0);
  const [sellVoPrice, setSellVoPrice] = useState<number>(35000);
  const [returnVoQty, setReturnVoQty] = useState<number>(0);
  const [missingAmount, setMissingAmount] = useState<number>(0);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchTrips();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, customerFilter, orders]);

  // Thêm effect để xử lý phân trang
  useEffect(() => {
    paginateOrders();
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Thêm useEffect để lấy thông tin chi tiết chuyến đi khi selectedTripId thay đổi
  useEffect(() => {
    if (selectedTripId) {
      fetchTripDetails(selectedTripId);
      fetchOrdersForTrip(selectedTripId);
    } else {
      setSelectedTripDetails(null);
      setTripOrders([]);
    }
  }, [selectedTripId]);

  // Hàm xử lý phân trang
  const paginateOrders = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedOrders(filteredOrders.slice(startIndex, endIndex));
  };

  // Hàm xử lý khi chuyển trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trip_orders')
        .select(`
          id,
          trip_id,
          customer_id,
          bottle_qty,
          bottle_price,
          total_price,
          loc_qty,
          loc_price,
          broken_qty,
          sell_vo_qty,
          sell_vo_price,
          return_vo_qty,
          missing_amount,
          created_at,
          trips (date, driver_name),
          customers (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders = data?.map(order => ({
        id: order.id,
        trip_id: order.trip_id,
        customer_id: order.customer_id,
        customer_name: order.customers.name,
        trip_date: order.trips.date,
        driver_name: order.trips.driver_name,
        bottle_qty: order.bottle_qty,
        bottle_price: order.bottle_price,
        total_price: order.total_price || 0,
        loc_qty: order.loc_qty || 0,
        loc_price: order.loc_price || 0,
        broken_qty: order.broken_qty || 0,
        sell_vo_qty: order.sell_vo_qty || 0,
        sell_vo_price: order.sell_vo_price || 35000,
        return_vo_qty: order.return_vo_qty || 0,
        missing_amount: order.missing_amount || 0,
        created_at: order.created_at
      })) || [];

      setOrders(formattedOrders);
      setFilteredOrders(formattedOrders);
    } catch (error) {
      console.error('Lỗi khi tải danh sách đơn hàng:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đơn hàng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách khách hàng:', error);
    }
  };

  const filterOrders = () => {
    let result = [...orders];

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.customer_name.toLowerCase().includes(lowerSearchTerm) ||
        order.trip_date.includes(searchTerm)
      );
    }

    // Lọc theo khách hàng
    if (customerFilter && customerFilter !== "all") {
      result = result.filter(order => order.customer_id === customerFilter);
    }
    
    setFilteredOrders(result);
    // Reset về trang đầu tiên khi thay đổi bộ lọc
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này không?")) {
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('trip_orders')
          .delete()
          .eq('id', id);

        if (error) throw error;

        // Cập nhật danh sách đơn hàng chung
        setOrders(orders.filter(order => order.id !== id));
        
        // Cập nhật danh sách đơn hàng của chuyến đi hiện tại nếu đang ở tab thêm đơn hàng
        if (selectedTripId) {
          setTripOrders(tripOrders.filter(order => order.id !== id));
        }
        
        toast({
          title: "Thành công",
          description: "Đã xóa đơn hàng",
        });
      } catch (error) {
        console.error('Lỗi khi xóa đơn hàng:', error);
        toast({
          title: "Lỗi",
          description: "Không thể xóa đơn hàng",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEditOrder = (order: Order) => {
    setOrderToEdit(order);
    setIsEditDialogOpen(true);
  };

  // Hàm tính tổng tiền cho form thêm đơn hàng
  const calculateTotalPrice = () => {
    const bottleTotal = bottleQty * bottlePrice;
    const locTotal = locQty * locPrice;
    const sellVoTotal = sellVoQty * sellVoPrice;
    return bottleTotal + locTotal + sellVoTotal - missingAmount;
  };

  // Hàm tính tổng tiền cho dialog chỉnh sửa đơn hàng
  const calculateEditTotalPrice = () => {
    if (!orderToEdit) return 0;
    
    const bottle_qty = parseInt((document.getElementById('edit-quantity') as HTMLInputElement)?.value) || orderToEdit.bottle_qty;
    const bottle_price = parseInt((document.getElementById('edit-price') as HTMLInputElement)?.value) || orderToEdit.bottle_price;
    const loc_qty = parseInt((document.getElementById('edit-loc-qty') as HTMLInputElement)?.value) || orderToEdit.loc_qty || 0;
    const loc_price = parseInt((document.getElementById('edit-loc-price') as HTMLInputElement)?.value) || orderToEdit.loc_price || 0;
    const sell_vo_qty = parseInt((document.getElementById('edit-sell-vo-qty') as HTMLInputElement)?.value) || orderToEdit.sell_vo_qty || 0;
    const sell_vo_price = parseInt((document.getElementById('edit-sell-vo-price') as HTMLInputElement)?.value) || orderToEdit.sell_vo_price || 35000;
    const missing_amount = parseInt((document.getElementById('edit-missing-amount') as HTMLInputElement)?.value) || orderToEdit.missing_amount || 0;
    
    return (bottle_qty * bottle_price) + (loc_qty * loc_price) + (sell_vo_qty * sell_vo_price) - missing_amount;
  };

  const handleUpdateOrder = async () => {
    if (!orderToEdit) return;

    try {
      const bottle_qty = parseInt((document.getElementById('edit-quantity') as HTMLInputElement).value);
      const bottle_price = parseInt((document.getElementById('edit-price') as HTMLInputElement).value);
      const loc_qty = parseInt((document.getElementById('edit-loc-qty') as HTMLInputElement).value) || 0;
      const loc_price = parseInt((document.getElementById('edit-loc-price') as HTMLInputElement).value) || 0;
      const broken_qty = parseInt((document.getElementById('edit-broken-qty') as HTMLInputElement).value) || 0;
      const sell_vo_qty = parseInt((document.getElementById('edit-sell-vo-qty') as HTMLInputElement).value) || 0;
      const sell_vo_price = parseInt((document.getElementById('edit-sell-vo-price') as HTMLInputElement).value) || 35000;
      const return_vo_qty = parseInt((document.getElementById('edit-return-vo-qty') as HTMLInputElement).value) || 0;
      const missing_amount = parseInt((document.getElementById('edit-missing-amount') as HTMLInputElement).value) || 0;
      
      // Calculate total price using the edit calculation function
      const total_price = calculateEditTotalPrice();

      const { error } = await supabase
        .from('trip_orders')
        .update({
          bottle_qty,
          bottle_price,
          total_price,
          loc_qty,
          loc_price,
          broken_qty,
          sell_vo_qty,
          sell_vo_price,
          return_vo_qty,
          missing_amount
        })
        .eq('id', orderToEdit.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin đơn hàng",
      });
      
      // Cập nhật danh sách đơn hàng chung
      fetchOrders();
      
      // Cập nhật danh sách đơn hàng của chuyến đi hiện tại nếu đang ở tab thêm đơn hàng
      if (selectedTripId && orderToEdit.trip_id === selectedTripId) {
        fetchOrdersForTrip(selectedTripId);
      }
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Lỗi khi cập nhật đơn hàng:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin đơn hàng",
        variant: "destructive",
      });
    }
  };

  const calculateReturnStatus = (order: Order) => {
    const bottlesReturned = order.return_vo_qty || 0;
    const bottlesDelivered = order.bottle_qty || 0;
    
    if (bottlesReturned >= bottlesDelivered) {
      return <span className="text-green-600 font-medium">Đã trả</span>;
    } else {
      const remaining = bottlesDelivered - bottlesReturned;
      return <span className="text-amber-600 font-medium">Còn thiếu ({remaining})</span>;
    }
  };

  const handleViewOrderDetails = (order: Order) => {
    setOrderToEdit(order);
    setIsOrderDetailsOpen(true);
  };

  // Hàm lấy thông tin chi tiết chuyến đi
  const fetchTripDetails = async (tripId: string) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (error) throw error;
      setSelectedTripDetails(data);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin chuyến đi:', error);
    }
  };

  // Hàm lấy danh sách đơn hàng của chuyến đi đã chọn
  const fetchOrdersForTrip = async (tripId: string) => {
    setIsLoadingTripOrders(true);
    try {
      const { data, error } = await supabase
        .from('trip_orders')
        .select(`
          id,
          trip_id,
          customer_id,
          bottle_qty,
          bottle_price,
          total_price,
          loc_qty,
          loc_price,
          broken_qty,
          sell_vo_qty,
          sell_vo_price,
          return_vo_qty,
          missing_amount,
          created_at,
          customers (name)
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders = data?.map(order => ({
        id: order.id,
        trip_id: order.trip_id,
        customer_id: order.customer_id,
        customer_name: order.customers.name,
        trip_date: selectedTripDetails?.date || '',
        driver_name: selectedTripDetails?.driver_name || '',
        bottle_qty: order.bottle_qty,
        bottle_price: order.bottle_price,
        total_price: order.total_price || 0,
        loc_qty: order.loc_qty || 0,
        loc_price: order.loc_price || 0,
        broken_qty: order.broken_qty || 0,
        sell_vo_qty: order.sell_vo_qty || 0,
        sell_vo_price: order.sell_vo_price || 35000,
        return_vo_qty: order.return_vo_qty || 0,
        missing_amount: order.missing_amount || 0,
        created_at: order.created_at
      })) || [];

      setTripOrders(formattedOrders);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng của chuyến đi:', error);
    } finally {
      setIsLoadingTripOrders(false);
    }
  };

  const fetchTrips = async () => {
    setIsLoadingTrips(true);
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách chuyến đi:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách chuyến đi",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTrips(false);
    }
  };

  const handleCustomerChange = (value: string) => {
    setSelectedCustomer(value);
    const customer = customers.find(c => c.id === value);
    if (customer) {
      setSelectedCustomerName(customer.name);
    }
  };

  const resetOrderForm = () => {
    setSelectedCustomer(null);
    setSelectedCustomerName("");
    setBottleQty(1);
    setBottlePrice(0);
    setLocQty(0);
    setLocPrice(0);
    setBrokenQty(0);
    setSellVoQty(0);
    setSellVoPrice(35000);
    setReturnVoQty(0);
    setMissingAmount(0);
  };

  const handleAddOrder = async (e: React.FormEvent, keepFormOpen = false) => {
    e.preventDefault();
    if (!selectedTripId || !selectedCustomer) return;
    
    setIsAddingOrder(true);
    setSuccessMessage(null);

    try {
      const totalPrice = calculateTotalPrice();

      const { error } = await supabase.from("trip_orders").insert([
        {
          trip_id: selectedTripId,
          customer_id: selectedCustomer,
          bottle_price: bottlePrice,
          bottle_qty: bottleQty,
          total_price: totalPrice,
          loc_qty: locQty,
          loc_price: locPrice,
          broken_qty: brokenQty,
          sell_vo_qty: sellVoQty,
          sell_vo_price: sellVoPrice,
          return_vo_qty: returnVoQty,
          missing_amount: missingAmount
        },
      ]);

      if (error) throw error;

      // Hiển thị thông báo thành công với tên khách hàng
      setSuccessMessage(`Đã thêm đơn hàng cho khách hàng ${selectedCustomerName}`);
      
      // Reset form nhưng giữ nguyên chuyến đi đã chọn
      resetOrderForm();
      
      // Nếu không giữ form mở, đóng form
      if (!keepFormOpen) {
        setShowOrderForm(false);
      }
      
      toast({
        title: "Thành công",
        description: `Đã thêm đơn hàng vào chuyến đi cho khách hàng ${selectedCustomerName}`,
      });

      // Cập nhật danh sách đơn hàng của chuyến đi
      if (selectedTripId) {
        fetchOrdersForTrip(selectedTripId);
      }
    } catch (error) {
      console.error("Lỗi khi thêm đơn hàng:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm đơn hàng vào chuyến đi",
        variant: "destructive",
      });
    } finally {
      setIsAddingOrder(false);
    }
  };

  return (
    <Tabs defaultValue="add" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="add" className="flex items-center gap-2">
          <PlusCircle size={16} />
          Thêm đơn hàng
        </TabsTrigger>
        <TabsTrigger value="manage" className="flex items-center gap-2">
          <ClipboardList size={16} />
          Quản lý đơn hàng
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="add" className="space-y-4">
        <div className="space-y-4">
          {!selectedTripId && (
            <Card>
              <CardHeader>
                <CardTitle>Chọn chuyến đi</CardTitle>
                <CardDescription>Chọn một chuyến đi để bắt đầu thêm đơn hàng</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTrips ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="trip">Chuyến đi</Label>
                    <Select value={selectedTripId || undefined} onValueChange={setSelectedTripId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chuyến đi" />
                      </SelectTrigger>
                      <SelectContent>
                        {trips.map((trip) => (
                          <SelectItem key={trip.id} value={trip.id}>
                            {formatDate(trip.date)} - {trip.driver_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {selectedTripId && !showOrderForm && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TruckIcon size={18} className="text-blue-500" />
                      Chuyến đi: {selectedTripDetails ? formatDate(selectedTripDetails.date) : ''}
                    </CardTitle>
                    <CardDescription>Tài xế: {selectedTripDetails?.driver_name}</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setSelectedTripId('')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <X size={14} /> Đổi chuyến đi
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowOrderForm(true)} 
                  className="w-full flex items-center gap-2"
                >
                  <UserPlus size={16} />
                  Tạo đơn hàng mới
                </Button>
              </CardContent>
            </Card>
          )}

          {successMessage && (
            <Alert className="bg-green-50 border-green-200">
              <PlusCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {selectedTripId && showOrderForm && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Thêm đơn hàng mới</CardTitle>
                  <Button 
                    onClick={() => setShowOrderForm(false)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <X size={14} /> Đóng
                  </Button>
                </div>
                <CardDescription>
                  Thêm đơn hàng cho chuyến đi ngày {selectedTripDetails ? formatDate(selectedTripDetails.date) : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => handleAddOrder(e, false)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Chọn khách hàng</Label>
                    <Select
                      value={selectedCustomer || undefined}
                      onValueChange={handleCustomerChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khách hàng" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bottleQty">Số lượng bình</Label>
                      <Input
                        id="bottleQty"
                        type="number"
                        value={bottleQty}
                        onChange={(e) => setBottleQty(Number(e.target.value))}
                        min={1}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bottlePrice">Đơn giá bình (VND)</Label>
                      <Input
                        id="bottlePrice"
                        type="number"
                        value={bottlePrice}
                        onChange={(e) => setBottlePrice(Number(e.target.value))}
                        min={0}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="locQty">Số lóc</Label>
                      <Input
                        id="locQty"
                        type="number"
                        value={locQty}
                        onChange={(e) => setLocQty(Number(e.target.value))}
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="locPrice">Tiền lóc (VND)</Label>
                      <Input
                        id="locPrice"
                        type="number"
                        value={locPrice}
                        onChange={(e) => setLocPrice(Number(e.target.value))}
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brokenQty">Số lượng bình bị hư</Label>
                      <Input
                        id="brokenQty"
                        type="number"
                        value={brokenQty}
                        onChange={(e) => setBrokenQty(Number(e.target.value))}
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sellVoQty">Bán vỏ (số lượng)</Label>
                      <Input
                        id="sellVoQty"
                        type="number"
                        value={sellVoQty}
                        onChange={(e) => setSellVoQty(Number(e.target.value))}
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sellVoPrice">Tiền vỏ (VND)</Label>
                      <Input
                        id="sellVoPrice"
                        type="number"
                        value={sellVoPrice}
                        onChange={(e) => setSellVoPrice(Number(e.target.value))}
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="returnVoQty">Mượn vỏ (số lượng)</Label>
                      <Input
                        id="returnVoQty"
                        type="number"
                        value={returnVoQty}
                        onChange={(e) => setReturnVoQty(Number(e.target.value))}
                        min={0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="missingAmount">Thiếu tiền (VND)</Label>
                      <Input
                        id="missingAmount"
                        type="number"
                        value={missingAmount}
                        onChange={(e) => setMissingAmount(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Thành tiền dự kiến</Label>
                    <div className="p-2 border rounded-md bg-slate-50 font-bold text-lg">
                      {formatPrice(calculateTotalPrice())}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="text-sm text-slate-500">
                        <span className="font-medium">Tiền bình:</span> {formatPrice(bottleQty * bottlePrice)}
                      </div>
                      <div className="text-sm text-slate-500">
                        <span className="font-medium">Tiền lóc:</span> {formatPrice(locQty * locPrice)}
                      </div>
                      <div className="text-sm text-slate-500">
                        <span className="font-medium">Tiền vỏ:</span> {formatPrice(sellVoQty * sellVoPrice)}
                      </div>
                      <div className="text-sm text-slate-500">
                        <span className="font-medium">Tiền thiếu:</span> {formatPrice(missingAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isAddingOrder || !selectedCustomer}
                    >
                      {isAddingOrder ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang thêm...
                        </>
                      ) : (
                        "Thêm đơn hàng"
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddOrder(e, true);
                      }}
                      disabled={isAddingOrder || !selectedCustomer}
                      className="whitespace-nowrap"
                    >
                      Thêm và tạo mới
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
        
        {selectedTripDetails && (
          <Card className="mt-6 border-t-4 border-t-blue-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TruckIcon size={18} className="text-blue-500" />
                    Chuyến đi: {formatDate(selectedTripDetails.date)}
                  </CardTitle>
                  <CardDescription>Tài xế: {selectedTripDetails.driver_name}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500">Số lóc: <span className="font-medium">{selectedTripDetails.total_bottles}</span></div>
                  <div className="text-sm text-slate-500">Đơn hàng: <span className="font-medium">{tripOrders.length}</span></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-sm font-medium mb-2">Đơn hàng đã thêm vào chuyến đi này:</h3>
              
              {isLoadingTripOrders ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : tripOrders.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead className="text-right">Số lượng</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                        <TableHead className="text-center">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tripOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.customer_name}</TableCell>
                          <TableCell className="text-right">{order.bottle_qty}</TableCell>
                          <TableCell className="text-right">{formatPrice(order.bottle_price)}</TableCell>
                          <TableCell className="text-right font-medium">{formatPrice(order.total_price)}</TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewOrderDetails(order)}
                                title="Xem chi tiết"
                                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                              >
                                <Eye size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditOrder(order)}
                                title="Chỉnh sửa"
                                className="h-8 w-8 p-0 hover:bg-amber-100 hover:text-amber-700"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDelete(order.id)}
                                disabled={isDeleting}
                                title="Xóa"
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 border rounded-md bg-slate-50">
                  <p className="text-muted-foreground">Chưa có đơn hàng nào trong chuyến đi này</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>
      
      <TabsContent value="manage" className="space-y-6">
        {/* Thanh tìm kiếm và bộ lọc */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Tìm kiếm theo tên khách hàng hoặc ngày..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="w-full md:w-64">
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <ListFilter size={16} />
                  <SelectValue placeholder="Lọc theo khách hàng" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khách hàng</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-48">
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Số dòng mỗi trang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 dòng</SelectItem>
                <SelectItem value="10">10 dòng</SelectItem>
                <SelectItem value="20">20 dòng</SelectItem>
                <SelectItem value="50">50 dòng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bảng danh sách đơn hàng */}
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-900">Khách hàng</TableHead>
                  <TableHead className="font-semibold text-slate-900">Ngày chuyến đi</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-right">Số lượng</TableHead>
                  <TableHead className="font-semibold text-slate-900">Trả hàng</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-right">Đơn giá</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-right">Thành tiền</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order, index) => (
                  <TableRow 
                    key={order.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/40 transition-colors`}
                  >
                    <TableCell className="font-medium text-slate-800">{order.customer_name}</TableCell>
                    <TableCell className="text-slate-700">{formatDate(order.trip_date)}</TableCell>
                    <TableCell className="text-right font-medium text-slate-800">{order.bottle_qty}</TableCell>
                    <TableCell>
                      {order.return_vo_qty >= order.bottle_qty ? (
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Đã trả
                        </div>
                      ) : (
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Còn thiếu ({order.bottle_qty - (order.return_vo_qty || 0)})
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-slate-700">{formatPrice(order.bottle_price)}</TableCell>
                    <TableCell className="text-right font-medium text-slate-800">{formatPrice(order.total_price)}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewOrderDetails(order)}
                          title="Xem chi tiết"
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditOrder(order)}
                          title="Chỉnh sửa"
                          className="h-8 w-8 p-0 hover:bg-amber-100 hover:text-amber-700"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(order.id)}
                          disabled={isDeleting}
                          title="Xóa"
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="bg-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t">
              <div className="text-sm text-slate-500 mb-4 sm:mb-0">
                Hiển thị <span className="font-medium">{paginatedOrders.length}</span> trên tổng số <span className="font-medium">{filteredOrders.length}</span> đơn hàng
              </div>
              
              {/* Component phân trang */}
              {filteredOrders.length > itemsPerPage && (
                <Pagination 
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredOrders.length / itemsPerPage)}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-slate-50 shadow-sm">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-600 mb-1">Không tìm thấy đơn hàng nào</p>
            <p className="text-sm text-slate-500">Thử thay đổi bộ lọc hoặc thêm đơn hàng mới</p>
          </div>
        )}

        {/* Dialog chỉnh sửa đơn hàng */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa đơn hàng</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin đơn hàng
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {orderToEdit && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Khách hàng</Label>
                      <p className="font-medium">{orderToEdit.customer_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Ngày chuyến đi</Label>
                      <p className="font-medium">{formatDate(orderToEdit.trip_date)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tài xế</Label>
                      <p className="font-medium">{orderToEdit.driver_name}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Thông tin bình</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-quantity">Số lượng bình</Label>
                        <Input
                          id="edit-quantity"
                          type="number"
                          defaultValue={orderToEdit.bottle_qty}
                          min={1}
                          onChange={() => document.getElementById('total-price')!.textContent = formatPrice(calculateEditTotalPrice())}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-price">Đơn giá (VND)</Label>
                        <Input
                          id="edit-price"
                          type="number"
                          defaultValue={orderToEdit.bottle_price}
                          min={0}
                          onChange={() => document.getElementById('total-price')!.textContent = formatPrice(calculateEditTotalPrice())}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Thông tin lóc nước</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-loc-qty">Số lóc</Label>
                        <Input
                          id="edit-loc-qty"
                          type="number"
                          defaultValue={orderToEdit.loc_qty || 0}
                          min={0}
                          onChange={() => document.getElementById('total-price')!.textContent = formatPrice(calculateEditTotalPrice())}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-loc-price">Tiền lóc (VND)</Label>
                        <Input
                          id="edit-loc-price"
                          type="number"
                          defaultValue={orderToEdit.loc_price || 0}
                          min={0}
                          onChange={() => document.getElementById('total-price')!.textContent = formatPrice(calculateEditTotalPrice())}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Thông tin vỏ bình</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-sell-vo-qty">Bán vỏ (số lượng)</Label>
                        <Input
                          id="edit-sell-vo-qty"
                          type="number"
                          defaultValue={orderToEdit.sell_vo_qty || 0}
                          min={0}
                          onChange={() => document.getElementById('total-price')!.textContent = formatPrice(calculateEditTotalPrice())}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-sell-vo-price">Tiền vỏ (VND)</Label>
                        <Input
                          id="edit-sell-vo-price"
                          type="number"
                          defaultValue={orderToEdit.sell_vo_price || 35000}
                          min={0}
                          onChange={() => document.getElementById('total-price')!.textContent = formatPrice(calculateEditTotalPrice())}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-return-vo-qty">Mượn vỏ (số lượng)</Label>
                        <Input
                          id="edit-return-vo-qty"
                          type="number"
                          defaultValue={orderToEdit.return_vo_qty || 0}
                          min={0}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-broken-qty">Số lượng bình bị hư</Label>
                        <Input
                          id="edit-broken-qty"
                          type="number"
                          defaultValue={orderToEdit.broken_qty || 0}
                          min={0}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Thông tin thanh toán</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-missing-amount">Tiền thiếu (VND)</Label>
                        <Input
                          id="edit-missing-amount"
                          type="number"
                          defaultValue={orderToEdit.missing_amount || 0}
                          min={0}
                          onChange={() => document.getElementById('total-price')!.textContent = formatPrice(calculateEditTotalPrice())}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tổng tiền dự kiến</Label>
                        <div id="total-price" className="p-2 border rounded-md bg-slate-50 font-bold text-lg">
                          {formatPrice(calculateEditTotalPrice())}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          <div className="text-xs text-slate-500">
                            <span className="font-medium">Tiền bình:</span> {formatPrice(orderToEdit.bottle_qty * orderToEdit.bottle_price)}
                          </div>
                          <div className="text-xs text-slate-500">
                            <span className="font-medium">Tiền lóc:</span> {formatPrice((orderToEdit.loc_qty || 0) * (orderToEdit.loc_price || 0))}
                          </div>
                          {/* <div className="text-xs text-slate-500">
                            <span className="font-medium">Tiền vỏ:</span> {formatPrice((orderToEdit.sell_vo_qty || 0) * (orderToEdit.sell_vo_price || 35000))}
                          </div>
                          <div className="text-xs text-slate-500">
                            <span className="font-medium">Tiền thiếu:</span> {formatPrice(orderToEdit.missing_amount || 0)}
                          </div> */}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" onClick={handleUpdateOrder}>
                      Lưu thay đổi
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog xem chi tiết đơn hàng */}
        <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết đơn hàng</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về đơn hàng
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {orderToEdit && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Khách hàng</Label>
                      <p className="font-medium">{orderToEdit.customer_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Ngày chuyến đi</Label>
                      <p className="font-medium">{formatDate(orderToEdit.trip_date)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tài xế</Label>
                      <p className="font-medium">{orderToEdit.driver_name}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Thông tin bình</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Số lượng bình</Label>
                        <p className="font-medium">{orderToEdit.bottle_qty}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Đơn giá</Label>
                        <p className="font-medium">{formatPrice(orderToEdit.bottle_price)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Trạng thái trả hàng</Label>
                        <p className="font-medium">{calculateReturnStatus(orderToEdit)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Thông tin lóc nước</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Số lóc</Label>
                        <p className="font-medium">{orderToEdit.loc_qty || 0}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Tiền lóc</Label>
                        <p className="font-medium">{formatPrice(orderToEdit.loc_price || 0)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Thông tin vỏ bình</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Bán vỏ (số lượng)</Label>
                        <p className="font-medium">{orderToEdit.sell_vo_qty || 0}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Tiền vỏ</Label>
                        <p className="font-medium">{formatPrice(orderToEdit.sell_vo_price || 35000)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Mượn vỏ (số lượng)</Label>
                        <p className="font-medium">{orderToEdit.return_vo_qty || 0}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Số lượng bình bị hư</Label>
                        <p className="font-medium">{orderToEdit.broken_qty || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Thông tin thanh toán</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Tiền thiếu</Label>
                        <p className="font-medium">{formatPrice(orderToEdit.missing_amount || 0)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Tổng tiền</Label>
                        <p className="font-medium text-lg">{formatPrice(orderToEdit.total_price)}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          <div className="text-xs text-slate-500">
                            <span className="font-medium">Tiền bình:</span> {formatPrice(orderToEdit.bottle_qty * orderToEdit.bottle_price)}
                          </div>
                          <div className="text-xs text-slate-500">
                            <span className="font-medium">Tiền lóc:</span> {formatPrice((orderToEdit.loc_qty || 0) * (orderToEdit.loc_price || 0))}
                          </div>
                          {/* <div className="text-xs text-slate-500">
                            <span className="font-medium">Tiền vỏ:</span> {formatPrice((orderToEdit.sell_vo_qty || 0) * (orderToEdit.sell_vo_price || 35000))}
                          </div>
                          <div className="text-xs text-slate-500">
                            <span className="font-medium">Tiền thiếu:</span> {formatPrice(orderToEdit.missing_amount || 0)}
                          </div> */}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" onClick={() => setIsOrderDetailsOpen(false)}>
                      Đóng
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </TabsContent>
    </Tabs>
  );
};

export default OrderManagement; 