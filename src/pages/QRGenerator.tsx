import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Download, RefreshCw, QrCode, Shield } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Missionary {
  id: string;
  id_number: string;
  missionary_name: string;
  chapter: string;
}

const QRGenerator = () => {
  const [manualId, setManualId] = useState("");
  const [missionaries, setMissionaries] = useState<Missionary[]>([]);
  const [selectedMissionary, setSelectedMissionary] = useState<string>("");
  const [generatedData, setGeneratedData] = useState<string>("");
  const [checksum, setChecksum] = useState<string>("");
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMissionaries();
  }, []);

  const fetchMissionaries = async () => {
    const { data, error } = await supabase
      .from("missionaries")
      .select("id, id_number, missionary_name, chapter")
      .order("missionary_name");

    if (error) {
      toast.error("Failed to load missionaries");
      return;
    }

    setMissionaries(data || []);
  };

  const generateChecksum = (idNumber: string): string => {
    return idNumber
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
      .toString(36);
  };

  const generateQRData = (idNumber: string) => {
    if (!idNumber) {
      toast.error("Please provide an ID number");
      return;
    }

    const checksumValue = generateChecksum(idNumber);
    setChecksum(checksumValue);

    const jsonData = {
      idNumber: idNumber,
      checksum: checksumValue,
    };
    setGeneratedData(JSON.stringify(jsonData));

    toast.success("QR code generated!");
  };

  const handleManualGenerate = () => {
    if (!manualId.trim()) {
      toast.error("Please enter an ID number");
      return;
    }
    generateQRData(manualId.trim());
  };

  const handleMissionarySelect = (missionaryId: string) => {
    setSelectedMissionary(missionaryId);
    const missionary = missionaries.find((m) => m.id === missionaryId);
    if (missionary) {
      generateQRData(missionary.id_number);
    }
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const idLabel = selectedMissionary
          ? missionaries.find((m) => m.id === selectedMissionary)?.id_number
          : manualId;
        link.download = `qr-code-${idLabel || "generated"}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("QR code downloaded!");
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const selectedMissionaryData = missionaries.find((m) => m.id === selectedMissionary);

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
          <Link to="/scanner">
            <Button variant="secondary">
              <QrCode className="h-4 w-4 mr-2" />
              Open Scanner
            </Button>
          </Link>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              QR Code Generator
            </h1>
            <p className="text-muted-foreground">
              Generate QR codes for missionaries with optional checksum verification
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                  <Shield className="h-4 w-4 text-secondary" />
                  <span>JSON format with automatic checksum verification</span>
                </div>

                {/* Tabs for Manual or Select */}
                <Tabs defaultValue="select" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="select">Select Missionary</TabsTrigger>
                    <TabsTrigger value="manual">Manual ID</TabsTrigger>
                  </TabsList>

                  <TabsContent value="select" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Missionary</Label>
                      <Select value={selectedMissionary} onValueChange={handleMissionarySelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a missionary..." />
                        </SelectTrigger>
                        <SelectContent>
                          {missionaries.map((missionary) => (
                            <SelectItem key={missionary.id} value={missionary.id}>
                              {missionary.missionary_name} - {missionary.chapter} (ID: {missionary.id_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedMissionaryData && (
                      <div className="p-4 rounded-lg bg-muted space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Name:</span>
                          <span className="text-sm">{selectedMissionaryData.missionary_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Chapter:</span>
                          <Badge variant="secondary">{selectedMissionaryData.chapter}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">ID Number:</span>
                          <span className="text-sm font-mono">{selectedMissionaryData.id_number}</span>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="manualId">ID Number</Label>
                      <Input
                        id="manualId"
                        placeholder="Enter ID number..."
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleManualGenerate()}
                      />
                    </div>
                    <Button onClick={handleManualGenerate} className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate QR Code
                    </Button>
                  </TabsContent>
                </Tabs>

                {/* Generated Data Preview */}
                {generatedData && (
                  <div className="space-y-2">
                    <Label>Generated Data</Label>
                    <div className="p-3 rounded-lg bg-muted font-mono text-sm break-all">
                      {generatedData}
                    </div>
                    {checksum && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Checksum:</span>
                        <Badge variant="outline" className="font-mono">
                          {checksum}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Panel - QR Code Display */}
            <Card>
              <CardHeader>
                <CardTitle>QR Code Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-6 p-8">
                {generatedData ? (
                  <>
                    <div
                      ref={qrRef}
                      className="p-6 bg-white rounded-lg shadow-lg border-4 border-primary/20"
                    >
                      <QRCodeSVG
                        value={generatedData}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Badge variant="default" className="text-xs">
                        JSON Format with Checksum
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Scan this QR code with the scanner to mark attendance
                      </p>
                    </div>
                    <Button onClick={downloadQRCode} className="w-full" size="lg">
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="p-6 rounded-full bg-muted">
                      <QrCode className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">No QR Code Generated</p>
                      <p className="text-sm text-muted-foreground">
                        Select a missionary or enter an ID number to generate a QR code
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold">About Checksums</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    JSON format includes an automatic checksum for verification. The scanner validates
                    the checksum to ensure data integrity and prevent tampering. Plain text format is
                    simpler but doesn't include verification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
