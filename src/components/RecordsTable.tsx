import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Trash2, FileSpreadsheet, Save, QrCode } from "lucide-react";
import * as XLSX from "xlsx";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Missionary {
  id: string;
  missionary_name: string;
  age: number;
  chapter: string;
  id_number: string;
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  missionary_name: string;
  attendance_status: string;
  scanned_at: string;
}

interface RecordsTableProps {
  chapter: string;
  refreshTrigger?: number;
}

export const RecordsTable = ({ chapter, refreshTrigger }: RecordsTableProps) => {
  const [missionaries, setMissionaries] = useState<Missionary[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Missionary>>({});
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});

  const fetchData = async () => {
    try {
      // Fetch missionaries for this chapter
      const { data: missionariesData, error: missionariesError } = await supabase
        .from("missionaries")
        .select("*")
        .eq("chapter", chapter)
        .order("created_at", { ascending: false });

      if (missionariesError) throw missionariesError;
      setMissionaries(missionariesData || []);

      // Fetch latest attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("chapter", chapter)
        .order("scanned_at", { ascending: false });

      if (attendanceError) throw attendanceError;

      // Create a map of missionary_id to latest attendance record
      const attendanceMap: Record<string, AttendanceRecord> = {};
      (attendanceData || []).forEach((record: any) => {
        if (!attendanceMap[record.missionary_id]) {
          attendanceMap[record.missionary_id] = record;
        }
      });
      setAttendanceRecords(attendanceMap);
    } catch (error: any) {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("missionaries-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "missionaries",
          filter: `chapter=eq.${chapter}`,
        },
        () => {
          fetchData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_records",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chapter, refreshTrigger]);

  const handleEdit = (missionary: Missionary) => {
    setEditingId(missionary.id);
    setEditData({
      missionary_name: missionary.missionary_name,
      age: missionary.age,
      id_number: missionary.id_number,
    });
  };

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from("missionaries")
        .update(editData)
        .eq("id", id);

      if (error) throw error;

      toast.success("Record updated successfully!");
      setEditingId(null);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update record");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this missionary?")) return;

    try {
      const { error } = await supabase.from("missionaries").delete().eq("id", id);

      if (error) throw error;

      toast.success("Missionary deleted successfully!");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete missionary");
    }
  };

  const exportToExcel = () => {
    const exportData = missionaries.map((missionary) => {
      const attendance = attendanceRecords[missionary.id];
      return {
        Name: missionary.missionary_name,
        Age: missionary.age,
        Chapter: missionary.chapter,
        "ID Number": missionary.id_number,
        "Attendance Status": attendance ? attendance.attendance_status : "Not Scanned",
        "Last Scan": attendance ? new Date(attendance.scanned_at).toLocaleString() : "Never",
        "Registered At": new Date(missionary.created_at).toLocaleString(),
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Missionaries");
    XLSX.writeFile(wb, `${chapter}_missionaries_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Exported successfully!");
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-secondary to-primary text-secondary-foreground">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Records - {chapter}
          </CardTitle>
          <Button onClick={exportToExcel} variant="outline" size="sm" className="bg-white text-primary hover:bg-white/90">
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>QR Code</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Last Scan</TableHead>
              <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missionaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No missionaries registered yet
                  </TableCell>
                </TableRow>
              ) : (
                missionaries.map((missionary) => {
                  const isEditing = editingId === missionary.id;
                  const attendance = attendanceRecords[missionary.id];

                  return (
                    <TableRow key={missionary.id}>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editData.missionary_name || ""}
                            onChange={(e) => setEditData({ ...editData, missionary_name: e.target.value })}
                          />
                        ) : (
                          missionary.missionary_name
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editData.age || ""}
                            onChange={(e) => setEditData({ ...editData, age: parseInt(e.target.value) })}
                          />
                        ) : (
                          missionary.age
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editData.id_number || ""}
                            onChange={(e) => setEditData({ ...editData, id_number: e.target.value })}
                          />
                        ) : (
                          missionary.id_number
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>{missionary.missionary_name} - QR Code</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col items-center gap-4 p-4">
                              <QRCodeSVG value={missionary.id_number} size={250} level="H" />
                              <p className="text-sm text-muted-foreground">ID: {missionary.id_number}</p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            attendance
                              ? "bg-secondary/20 text-secondary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {attendance ? "Present" : "Not Scanned"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {attendance ? new Date(attendance.scanned_at).toLocaleString() : "Never"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {isEditing ? (
                          <Button onClick={() => handleSave(missionary.id)} size="sm" variant="outline">
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button onClick={() => handleEdit(missionary)} size="sm" variant="outline">
                            Edit
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDelete(missionary.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
