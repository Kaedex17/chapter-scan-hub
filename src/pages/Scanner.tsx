import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Camera, Upload, CheckCircle2, Zap, Clock, CheckCheck, XCircle } from "lucide-react";
import { QrReader } from "react-qr-reader";

interface QueueItem {
  id: string;
  idNumber: string;
  timestamp: number;
  status: "pending" | "processing" | "success" | "error";
  name?: string;
  chapter?: string;
  error?: string;
  checksum?: string;
  verified?: boolean;
}

const Scanner = () => {
  const [scanMode, setScanMode] = useState<"camera" | "upload" | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [scanQueue, setScanQueue] = useState<QueueItem[]>([]);
  const [scannedData, setScannedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const lastScannedRef = useRef<{ id: string; timestamp: number } | null>(null);
  const SCAN_COOLDOWN = 1000; // 1 second cooldown in batch mode
  const processingRef = useRef(false);

  // Process queue items in batch mode
  useEffect(() => {
    if (!batchMode || processingRef.current) return;

    const processQueue = async () => {
      const pendingItems = scanQueue.filter(item => item.status === "pending");
      if (pendingItems.length === 0) return;

      processingRef.current = true;

      for (const item of pendingItems) {
        setScanQueue(prev => 
          prev.map(q => q.id === item.id ? { ...q, status: "processing" } : q)
        );

        try {
          const { data: missionary, error: fetchError } = await supabase
            .from("missionaries")
            .select("id, id_number, missionary_name, chapter")
            .eq("id_number", item.idNumber)
            .single();

          if (fetchError || !missionary) {
            setScanQueue(prev => 
              prev.map(q => q.id === item.id 
                ? { ...q, status: "error", error: "Not found" } 
                : q)
            );
            continue;
          }

          const { error: attendanceError } = await supabase
            .from("attendance_records")
            .insert({
              missionary_id: missionary.id,
              missionary_name: missionary.missionary_name,
              chapter: missionary.chapter,
              attendance_status: "Present",
            });

          if (attendanceError?.code === "23505") {
            setScanQueue(prev => 
              prev.map(q => q.id === item.id 
                ? { 
                    ...q, 
                    status: "error", 
                    name: missionary.missionary_name,
                    chapter: missionary.chapter,
                    error: "Already marked" 
                  } 
                : q)
            );
          } else if (attendanceError) {
            setScanQueue(prev => 
              prev.map(q => q.id === item.id 
                ? { ...q, status: "error", error: "Processing error" } 
                : q)
            );
          } else {
            setScanQueue(prev => 
              prev.map(q => q.id === item.id 
                ? { 
                    ...q, 
                    status: "success", 
                    name: missionary.missionary_name,
                    chapter: missionary.chapter 
                  } 
                : q)
            );
          }
        } catch (error) {
          setScanQueue(prev => 
            prev.map(q => q.id === item.id 
              ? { ...q, status: "error", error: "System error" } 
              : q)
          );
        }

        await new Promise(resolve => setTimeout(resolve, 300)); // Throttle requests
      }

      processingRef.current = false;
    };

    processQueue();
  }, [scanQueue, batchMode]);

  const processQRData = async (data: string) => {
    let idNumber: string;
    let checksum: string | undefined;
    let verified = false;

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(data.trim());
      if (parsed.idNumber) {
        idNumber = parsed.idNumber.toString().trim();
        checksum = parsed.checksum;
        
        // Simple checksum validation if present
        if (checksum) {
          const expectedChecksum = idNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0).toString(36);
          verified = checksum === expectedChecksum;
          
          if (!verified) {
            toast.warning("Checksum mismatch - proceeding with caution");
          } else {
            verified = true;
          }
        }
      } else {
        // JSON but no idNumber field - treat as plain text
        idNumber = data.trim();
      }
    } catch {
      // Not JSON, treat as plain text ID
      idNumber = data.trim();
    }

    const now = Date.now();
    
    // Check cooldown to prevent duplicate scans
    if (
      lastScannedRef.current?.id === idNumber &&
      now - lastScannedRef.current.timestamp < SCAN_COOLDOWN
    ) {
      return;
    }
    
    lastScannedRef.current = { id: idNumber, timestamp: now };

    if (batchMode) {
      // Add to queue in batch mode
      const queueItem: QueueItem = {
        id: `${idNumber}-${now}`,
        idNumber,
        timestamp: now,
        status: "pending",
        checksum,
        verified
      };
      
      setScanQueue(prev => [...prev, queueItem]);
      toast.success(verified ? "✓ Verified & queued" : "Added to queue");
      return;
    }

    // Normal single scan mode
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const { data: missionary, error: fetchError } = await supabase
        .from("missionaries")
        .select("id, id_number, missionary_name, chapter")
        .eq("id_number", idNumber)
        .single();

      if (fetchError || !missionary) {
        toast.error("Missionary not found!");
        setIsProcessing(false);
        return;
      }

      const { error: attendanceError } = await supabase
        .from("attendance_records")
        .insert({
          missionary_id: missionary.id,
          missionary_name: missionary.missionary_name,
          chapter: missionary.chapter,
          attendance_status: "Present",
        });

      if (attendanceError) {
        if (attendanceError.code === "23505") {
          toast.warning(`${missionary.missionary_name} already marked present today`);
        } else {
          throw attendanceError;
        }
      } else {
        toast.success(`Attendance marked for ${missionary.missionary_name}!`);
      }

      setScannedData({
        name: missionary.missionary_name,
        chapter: missionary.chapter,
        id: missionary.id_number,
      });

      setTimeout(() => {
        setScannedData(null);
        setScanMode("camera");
        setIsProcessing(false);
      }, 2000);
    } catch (error: any) {
      console.error("Scan error:", error);
      toast.error("Processing error. Please try again.");
      setIsProcessing(false);
    }
  };

  const clearQueue = () => {
    setScanQueue([]);
    toast.info("Queue cleared");
  };

  const stats = {
    total: scanQueue.length,
    pending: scanQueue.filter(q => q.status === "pending").length,
    processing: scanQueue.filter(q => q.status === "processing").length,
    success: scanQueue.filter(q => q.status === "success").length,
    error: scanQueue.filter(q => q.status === "error").length,
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
        <div className="flex justify-between items-center mb-8">
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {scanMode === "camera" && (
            <Button
              variant={batchMode ? "default" : "outline"}
              onClick={() => {
                setBatchMode(!batchMode);
                if (!batchMode) {
                  toast.success("Batch mode enabled");
                } else {
                  toast.info("Batch mode disabled");
                }
              }}
            >
              <Zap className="h-4 w-4 mr-2" />
              Batch Mode
            </Button>
          )}
        </div>

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className={batchMode ? "lg:col-span-2" : "lg:col-span-3"}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Camera Scanner</span>
                    <Button variant="outline" size="sm" onClick={() => {
                      setScanMode(null);
                      setBatchMode(false);
                      setScanQueue([]);
                    }}>
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
                    {batchMode 
                      ? "Scan multiple QR codes - they will be queued and processed automatically"
                      : "Position the QR code within the camera frame"}
                  </p>
                </CardContent>
              </Card>

              {batchMode && (
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Batch Queue</span>
                      {scanQueue.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearQueue}>
                          Clear
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Badge variant="secondary" className="justify-center py-2">
                        <Clock className="h-3 w-3 mr-1" />
                        {stats.pending}
                      </Badge>
                      <Badge variant="default" className="justify-center py-2">
                        <CheckCheck className="h-3 w-3 mr-1" />
                        {stats.success}
                      </Badge>
                    </div>

                    {stats.error > 0 && (
                      <Badge variant="destructive" className="w-full justify-center py-2">
                        <XCircle className="h-3 w-3 mr-1" />
                        {stats.error} Errors
                      </Badge>
                    )}

                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {scanQueue.slice().reverse().map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-lg border text-sm ${
                              item.status === "success"
                                ? "bg-secondary/20 border-secondary"
                                : item.status === "error"
                                ? "bg-destructive/10 border-destructive"
                                : item.status === "processing"
                                ? "bg-primary/10 border-primary animate-pulse"
                                : "bg-muted border-border"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium">
                                {item.name || `ID: ${item.idNumber}`}
                              </div>
                              {item.verified && (
                                <Badge variant="outline" className="text-xs">
                                  ✓ Verified
                                </Badge>
                              )}
                            </div>
                            {item.chapter && (
                              <div className="text-xs text-muted-foreground">
                                {item.chapter}
                              </div>
                            )}
                            {item.error && (
                              <div className="text-xs text-destructive mt-1">
                                {item.error}
                              </div>
                            )}
                          </div>
                        ))}
                        {scanQueue.length === 0 && (
                          <div className="text-center text-muted-foreground py-8">
                            No items in queue
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
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
