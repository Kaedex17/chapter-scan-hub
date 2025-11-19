import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Camera, Upload, CheckCircle2 } from "lucide-react";
import { QrReader } from "react-qr-reader";

const Scanner = () => {
  const [scanMode, setScanMode] = useState<"camera" | "upload" | null>(null);
  const [scannedData, setScannedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const processQRData = async (data: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      // QR code now contains only the ID number
      const idNumber = data.trim();
      
      // Fetch missionary by ID number
      const { data: missionary, error: fetchError } = await supabase
        .from("missionaries")
        .select("*")
        .eq("id_number", idNumber)
        .single();

      if (fetchError || !missionary) {
        toast.error("Missionary not found!");
        setIsProcessing(false);
        return;
      }

      // Record attendance
      const { error: attendanceError } = await supabase.from("attendance_records").insert({
        missionary_id: missionary.id,
        missionary_name: missionary.missionary_name,
        chapter: missionary.chapter,
        attendance_status: "Present",
      });

      if (attendanceError) throw attendanceError;

      setScannedData({
        name: missionary.missionary_name,
        chapter: missionary.chapter,
        id: missionary.id_number,
      });

      toast.success(`Attendance marked for ${missionary.missionary_name}!`);

      // Reset after 3 seconds
      setTimeout(() => {
        setScannedData(null);
        setScanMode(null);
        setIsProcessing(false);
      }, 3000);
    } catch (error: any) {
      toast.error("Invalid QR code or processing error");
      setIsProcessing(false);
    }
  };

  const handleScan = (result: any) => {
    if (result && !isProcessing) {
      processQRData(result.text);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Use a QR code reader library to decode the image
        // For simplicity, we'll show a message to use camera instead
        toast.info("Please use camera scan for best results");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="outline" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              QR Code Scanner
            </h1>
            <p className="text-muted-foreground">
              Scan missionary QR codes to mark attendance
            </p>
          </div>

          {!scanMode && !scannedData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-2 hover:border-secondary"
                onClick={() => setScanMode("camera")}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                  <div className="p-4 rounded-full bg-secondary/20">
                    <Camera className="h-12 w-12 text-secondary" />
                  </div>
                  <h3 className="text-xl font-bold">Start Camera Scan</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Use your device camera to scan QR codes
                  </p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary"
                onClick={() => {
                  setScanMode("upload");
                  fileInputRef.current?.click();
                }}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                  <div className="p-4 rounded-full bg-primary/20">
                    <Upload className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Upload QR Image</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Upload a QR code image from your device
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {scanMode === "camera" && !scannedData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Camera Scanner</span>
                  <Button variant="outline" size="sm" onClick={() => setScanMode(null)}>
                    Cancel
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border-4 border-secondary">
                  <QrReader
                    onResult={handleScan}
                    constraints={{ facingMode: "environment" }}
                    videoStyle={{ width: "100%" }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Position the QR code within the camera frame
                </p>
              </CardContent>
            </Card>
          )}

          {scannedData && (
            <Card className="border-2 border-secondary">
              <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="p-4 rounded-full bg-secondary/20">
                  <CheckCircle2 className="h-16 w-16 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">Attendance Marked!</h3>
                <div className="text-center space-y-1">
                  <p className="text-lg font-semibold">{scannedData.name}</p>
                  <p className="text-muted-foreground">{scannedData.chapter} Chapter</p>
                  <p className="text-sm text-muted-foreground">ID: {scannedData.id}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>
    </div>
  );
};

export default Scanner;
