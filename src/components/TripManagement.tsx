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
  CalendarIcon, 
  Loader2 
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import CreateTrip from "./CreateTrip";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { formatDate } from "@/utils/formatters";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Trip {
  id: string;
  date: string;
  driver_name: string;
  total_bottles: number;
  created_at?: string;
}

const TripManagement = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedTrips, setPaginatedTrips] = useState<Trip[]>([]);

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    filterTrips();
  }, [searchTerm, dateFilter, trips]);

  // Thêm effect để xử lý phân trang
  useEffect(() => {
    paginateTrips();
  }, [filteredTrips, currentPage, itemsPerPage]);

  // Hàm xử lý phân trang
  const paginateTrips = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedTrips(filteredTrips.slice(startIndex, endIndex));
  };

  // Hàm xử lý khi chuyển trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
      setFilteredTrips(data || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách chuyến đi:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách chuyến đi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTrips = () => {
    let result = [...trips];

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm) {
      result = result.filter(trip => 
        trip.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.date.includes(searchTerm)
      );
    }

    // Lọc theo khoảng ngày
    if (dateFilter?.from || dateFilter?.to) {
      result = result.filter(trip => {
        const tripDate = new Date(trip.date);
        
        if (dateFilter?.from && dateFilter?.to) {
          return tripDate >= dateFilter.from && tripDate <= dateFilter.to;
        } else if (dateFilter?.from) {
          return tripDate >= dateFilter.from;
        } else if (dateFilter?.to) {
          return tripDate <= dateFilter.to;
        }
        
        return true;
      });
    }

    setFilteredTrips(result);
    // Reset về trang đầu tiên khi thay đổi bộ lọc
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa chuyến đi này không?")) {
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('trips')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setTrips(trips.filter(trip => trip.id !== id));
        toast({
          title: "Thành công",
          description: "Đã xóa chuyến đi",
        });
      } catch (error) {
        console.error('Lỗi khi xóa chuyến đi:', error);
        toast({
          title: "Lỗi",
          description: "Không thể xóa chuyến đi",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setTripToEdit(trip);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!tripToEdit) return;
    
    const editDateInput = document.getElementById('edit-date') as HTMLInputElement;
    const editDriverInput = document.getElementById('edit-driver') as HTMLInputElement;
    const editBottlesInput = document.getElementById('edit-bottles') as HTMLInputElement;
    
    const updatedTrip = {
      date: editDateInput.value,
      driver_name: editDriverInput.value,
      total_bottles: parseInt(editBottlesInput.value) || 0
    };
    
    try {
      const { error } = await supabase
        .from('trips')
        .update(updatedTrip)
        .eq('id', tripToEdit.id);
        
      if (error) throw error;
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật chuyến đi",
      });
      
      handleTripUpdated();
    } catch (error) {
      console.error('Lỗi khi cập nhật chuyến đi:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật chuyến đi",
        variant: "destructive",
      });
    }
  };

  const handleAddTrip = () => {
    setIsAddDialogOpen(true);
  };

  const handleTripUpdated = () => {
    fetchTrips();
    setIsEditDialogOpen(false);
    setIsAddDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Tìm kiếm theo tên tài xế hoặc ngày..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateFilter?.from && !dateFilter?.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter?.from || dateFilter?.to ? (
                  dateFilter.from && dateFilter.to ? (
                    <>
                      {format(dateFilter.from, "dd/MM/yyyy")} -{" "}
                      {format(dateFilter.to, "dd/MM/yyyy")}
                    </>
                  ) : dateFilter.from ? (
                    `Từ ${format(dateFilter.from, "dd/MM/yyyy")}`
                  ) : (
                    `Đến ${format(dateFilter.to as Date, "dd/MM/yyyy")}`
                  )
                ) : (
                  "Lọc theo ngày"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateFilter?.from}
                selected={dateFilter}
                onSelect={setDateFilter}
                numberOfMonths={2}
                locale={vi}
              />
              <div className="flex justify-end gap-2 p-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateFilter({ from: undefined, to: undefined })}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={handleAddTrip}>
            <Plus size={16} className="mr-2" />
            Thêm chuyến đi
          </Button>
        </div>
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

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTrips.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Tên tài xế</TableHead>
                <TableHead>Số lóc</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>{formatDate(trip.date)}</TableCell>
                  <TableCell>{trip.driver_name}</TableCell>
                  <TableCell>{trip.total_bottles}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditTrip(trip)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(trip.id)}
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
              Hiển thị <span className="font-medium">{paginatedTrips.length}</span> trên tổng số <span className="font-medium">{filteredTrips.length}</span> chuyến đi
            </div>
            
            {/* Component phân trang */}
            {filteredTrips.length > itemsPerPage && (
              <Pagination 
                currentPage={currentPage}
                totalPages={Math.ceil(filteredTrips.length / itemsPerPage)}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 border rounded-md bg-slate-50">
          <p className="text-muted-foreground">Không tìm thấy chuyến đi nào</p>
        </div>
      )}

      {/* Dialog thêm chuyến đi mới */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm chuyến đi mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin để tạo chuyến đi mới
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <CreateTrip onSuccess={handleTripUpdated} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog chỉnh sửa chuyến đi */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa chuyến đi</DialogTitle>
            <DialogDescription>
              Chỉnh sửa thông tin chuyến đi
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {tripToEdit && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Ngày chuyến đi</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    defaultValue={tripToEdit.date}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-driver">Tên tài xế</Label>
                  <Input
                    id="edit-driver"
                    type="text"
                    defaultValue={tripToEdit.driver_name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-bottles">Tổng số bình</Label>
                  <Input
                    id="edit-bottles"
                    type="number"
                    defaultValue={tripToEdit.total_bottles}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleSaveEdit}>
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

export default TripManagement; 