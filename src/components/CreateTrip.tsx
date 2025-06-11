import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateTripProps {
  onSuccess?: () => void;
}

const CreateTrip = ({ onSuccess }: CreateTripProps) => {
  const [date, setDate] = useState("");
  const [driverName, setDriverName] = useState("");
  const [totalBottles, setTotalBottles] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("trips")
        .insert([
          {
            date,
            driver_name: driverName,
            total_bottles: totalBottles,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã tạo chuyến đi mới",
      });

      setDate("");
      setDriverName("");
      setTotalBottles(0);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Lỗi khi tạo chuyến đi:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo chuyến đi mới",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Ngày chuyến đi</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="driver_name">Tên tài xế</Label>
        <Input
          id="driver_name"
          type="text"
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="total_bottles">Số lóc</Label>
        <Input
          id="total_bottles"
          type="number"
          value={totalBottles}
          onChange={(e) => setTotalBottles(parseInt(e.target.value) || 0)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo...
          </>
        ) : (
          "Tạo chuyến đi"
        )}
      </Button>
    </form>
  );
};

export default CreateTrip;
