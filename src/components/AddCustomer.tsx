import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddCustomerProps {
  onSuccess?: () => void;
}

const AddCustomer = ({ onSuccess }: AddCustomerProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isOld, setIsOld] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("customers")
        .insert([
          {
            name,
            phone,
            address,
            is_old: isOld,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã thêm khách hàng mới",
      });

      setName("");
      setPhone("");
      setAddress("");
      setIsOld(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Lỗi khi thêm khách hàng:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm khách hàng mới",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tên khách hàng</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Số điện thoại</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Địa chỉ</Label>
        <Input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_old"
          checked={isOld}
          onCheckedChange={(checked) => setIsOld(checked === true)}
        />
        <Label htmlFor="is_old">Là khách hàng cũ (đã có vỏ bình)</Label>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang thêm...
          </>
        ) : (
          "Thêm khách hàng"
        )}
      </Button>
    </form>
  );
};

export default AddCustomer;
