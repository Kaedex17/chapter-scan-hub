import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Download } from "lucide-react";

interface RegistrationFormProps {
  chapter: string;
  onRegistrationComplete: () => void;
}

export const RegistrationForm = ({ chapter, onRegistrationComplete }: RegistrationFormProps) => {
  const [formData, setFormData] = useState({
    missionaryName: "",
    age: "",
    idNumber: "",
  });
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const qrData = JSON.stringify({
        id: formData.idNumber,
        name: formData.missionaryName,
        chapter: chapter,
      });

      const { error } = await supabase.from("missionaries").insert({
        missionary_name: formData.missionaryName,
        age: parseInt(formData.age),
        chapter: chapter,
        id_number: formData.idNumber,
        qr_code: qrData,
      });

      if (error) throw error;

      setGeneratedQR(qrData);
      toast.success("Missionary registered successfully!");
      onRegistrationComplete();
      
      // Reset form after short delay
      setTimeout(() => {
        setFormData({ missionaryName: "", age: "", idNumber: "" });
        setGeneratedQR(null);
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || "Failed to register missionary");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${formData.idNumber}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Register Missionary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="missionaryName">Missionary Name</Label>
            <Input
              id="missionaryName"
              value={formData.missionaryName}
              onChange={(e) => setFormData({ ...formData, missionaryName: e.target.value })}
              required
              placeholder="Enter full name"
            />
          </div>
          
          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              required
              min="1"
              max="150"
              placeholder="Enter age"
            />
          </div>

          <div>
            <Label htmlFor="idNumber">ID Number</Label>
            <Input
              id="idNumber"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              required
              placeholder="Enter unique ID"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-primary to-accent">
            {isSubmitting ? "Registering..." : "Generate QR Code"}
          </Button>
        </form>

        {generatedQR && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/20 text-center space-y-4">
            <p className="font-semibold text-primary">QR Code Generated!</p>
            <div className="flex justify-center">
              <QRCodeSVG id="qr-code" value={generatedQR} size={200} level="H" />
            </div>
            <Button onClick={downloadQR} variant="outline" className="w-full" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
