import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice, formatDate } from "@/utils/formatters";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Trip {
  id: string;
  date: string;
  driver_name: string;
}

interface Customer {
  id: string;
  name: string;
}

interface AddOrderToTripProps {
  onTripSelect?: (tripId: string) => void;
  onOrderAdded?: () => void;
}

const AddOrderToTrip = ({ onTripSelect, onOrderAdded }: AddOrderToTripProps) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [bottleQty, setBottleQty] = useState<number>(1);
  const [bottlePrice, setBottlePrice] = useState<number>(0);
  const [locQty, setLocQty] = useState<number>(0);
  const [locPrice, setLocPrice] = useState<number>(0);
  const [brokenQty, setBrokenQty] = useState<number>(0);
  const [sellVoQty, setSellVoQty] = useState<number>(0);
  const [sellVoPrice, setSellVoPrice] = useState<number>(0);
  const [returnVoQty, setReturnVoQty] = useState<number>(0);
  const [missingAmount, setMissingAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { toast } = useToast();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>("");

  useEffect(() => {
    fetchTrips();
    fetchCustomers();
  }, []);

  const fetchTrips = async () => {
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
      setIsLoadingData(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách khách hàng:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách khách hàng",
        variant: "destructive",
      });
    }
  };

  const handleTripChange = (value: string) => {
    setSelectedTrip(value);
    if (onTripSelect) {
      onTripSelect(value);
    }
  };

  const calculateTotalPrice = () => {
    const bottleTotal = bottleQty * bottlePrice;
    const locTotal = locQty * locPrice;
    const sellVoTotal = sellVoQty * sellVoPrice;
    return bottleTotal + locTotal + sellVoTotal - missingAmount;
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
    setSellVoPrice(0);
    setReturnVoQty(0);
    setMissingAmount(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip || !selectedCustomer) return;
    
    setIsLoading(true);
    setSuccessMessage(null);

    try {
      const totalPrice = calculateTotalPrice();

      const { error } = await supabase.from("trip_orders").insert([
        {
          trip_id: selectedTrip,
          customer_id: selectedCustomer,
          bottle_qty: bottleQty,
          bottle_price: bottlePrice,
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

      setSuccessMessage(`Đã thêm đơn hàng cho khách hàng ${selectedCustomerName}`);
      
      resetOrderForm();
      
      toast({
        title: "Thành công",
        description: `Đã thêm đơn hàng vào chuyến đi cho khách hàng ${selectedCustomerName}`,
      });

      if (onOrderAdded) {
        onOrderAdded();
      }
    } catch (error) {
      console.error("Lỗi khi thêm đơn hàng:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm đơn hàng vào chuyến đi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="trip">Chọn chuyến đi</Label>
          <Select value={selectedTrip || undefined} onValueChange={handleTripChange} required>
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
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || !selectedTrip || !selectedCustomer}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang thêm...
            </>
          ) : (
            "Thêm đơn hàng"
          )}
        </Button>
      </form>
    </div>
  );
};

export default AddOrderToTrip;
