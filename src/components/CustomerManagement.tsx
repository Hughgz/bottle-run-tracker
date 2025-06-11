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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  UserPlus 
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import AddCustomer from "./AddCustomer";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  is_old: boolean;
  created_at?: string;
}

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedCustomers, setPaginatedCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  // Thêm effect để xử lý phân trang
  useEffect(() => {
    paginateCustomers();
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Hàm xử lý phân trang
  const paginateCustomers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedCustomers(filteredCustomers.slice(startIndex, endIndex));
  };

  // Hàm xử lý khi chuyển trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách khách hàng:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách khách hàng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(lowerSearchTerm) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.address && customer.address.toLowerCase().includes(lowerSearchTerm))
      );
      
      setFilteredCustomers(filtered);
    }
    
    // Reset về trang đầu tiên khi thay đổi bộ lọc
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khách hàng này không?")) {
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('customers')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setCustomers(customers.filter(customer => customer.id !== id));
        toast({
          title: "Thành công",
          description: "Đã xóa khách hàng",
        });
      } catch (error) {
        console.error('Lỗi khi xóa khách hàng:', error);
        toast({
          title: "Lỗi",
          description: "Không thể xóa khách hàng. Khách hàng có thể đã có đơn hàng liên kết.",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsEditDialogOpen(true);
  };

  const handleAddCustomer = () => {
    setIsAddDialogOpen(true);
  };

  const handleCustomerUpdated = () => {
    fetchCustomers();
    setIsEditDialogOpen(false);
    setIsAddDialogOpen(false);
  };

  const handleUpdateCustomer = async () => {
    if (!customerToEdit) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: (document.getElementById('edit-name') as HTMLInputElement).value,
          phone: (document.getElementById('edit-phone') as HTMLInputElement).value,
          address: (document.getElementById('edit-address') as HTMLInputElement).value,
          is_old: (document.getElementById('edit-is_old') as HTMLInputElement).checked
        })
        .eq('id', customerToEdit.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin khách hàng",
      });
      
      handleCustomerUpdated();
    } catch (error) {
      console.error('Lỗi khi cập nhật khách hàng:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin khách hàng",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Thanh tìm kiếm và thêm mới */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Tìm kiếm theo tên, số điện thoại hoặc địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button onClick={handleAddCustomer}>
          <UserPlus size={16} className="mr-2" /> Thêm khách hàng
        </Button>
      </div>

      <div className="flex justify-end">
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

      {/* Bảng danh sách khách hàng */}
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên khách hàng</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Khách hàng cũ</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone || "—"}</TableCell>
                  <TableCell>{customer.address || "—"}</TableCell>
                  <TableCell>{customer.is_old ? "Có" : "Không"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(customer.id)}
                        disabled={isDeleting}
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
              Hiển thị <span className="font-medium">{paginatedCustomers.length}</span> trên tổng số <span className="font-medium">{filteredCustomers.length}</span> khách hàng
            </div>
            
            {/* Component phân trang */}
            {filteredCustomers.length > itemsPerPage && (
              <Pagination 
                currentPage={currentPage}
                totalPages={Math.ceil(filteredCustomers.length / itemsPerPage)}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 border rounded-md bg-slate-50">
          <p className="text-muted-foreground">Không tìm thấy khách hàng nào</p>
        </div>
      )}

      {/* Dialog thêm khách hàng mới */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm khách hàng mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin khách hàng mới
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <AddCustomer onSuccess={handleCustomerUpdated} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog chỉnh sửa khách hàng */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin khách hàng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin khách hàng
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {customerToEdit && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Tên khách hàng</Label>
                  <Input
                    id="edit-name"
                    type="text"
                    defaultValue={customerToEdit.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Số điện thoại</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    defaultValue={customerToEdit.phone}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Địa chỉ</Label>
                  <Input
                    id="edit-address"
                    type="text"
                    defaultValue={customerToEdit.address}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-is_old"
                    defaultChecked={customerToEdit.is_old}
                  />
                  <Label htmlFor="edit-is_old">Là khách hàng cũ (đã có vỏ bình)</Label>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleUpdateCustomer}>
                    Lưu thay đổi
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerManagement; 