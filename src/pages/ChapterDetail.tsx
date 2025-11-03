import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { RegistrationForm } from "@/components/RegistrationForm";
import { RecordsTable } from "@/components/RecordsTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, UserPlus, ScanLine, FileSpreadsheet } from "lucide-react";

const ChapterDetail = () => {
  const { chapter } = useParams<{ chapter: string }>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const chapterName = chapter
    ?.split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("/") || "";

  const handleRegistrationComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {chapterName} Chapter
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage missionaries and track attendance for {chapterName}
          </p>
        </div>

        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Register
            </TabsTrigger>
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <ScanLine className="h-4 w-4" />
              Scanner
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Records
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RegistrationForm
                chapter={chapterName}
                onRegistrationComplete={handleRegistrationComplete}
              />
              <RecordsTable chapter={chapterName} refreshTrigger={refreshTrigger} />
            </div>
          </TabsContent>

          <TabsContent value="scanner">
            <div className="flex justify-center">
              <Link to="/scanner" className="w-full max-w-md">
                <Button className="w-full h-32 text-xl bg-gradient-to-r from-secondary to-primary">
                  <ScanLine className="h-8 w-8 mr-4" />
                  Open QR Scanner
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="records">
            <RecordsTable chapter={chapterName} refreshTrigger={refreshTrigger} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChapterDetail;
