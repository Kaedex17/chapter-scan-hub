import { ChapterCard } from "@/components/ChapterCard";
import { BookOpen } from "lucide-react";

const chapters = [
  { name: "Main", path: "main" },
  { name: "Gensan", path: "gensan" },
  { name: "Kiamba/Maitum", path: "kiamba-maitum" },
  { name: "Pasorio", path: "pasorio" },
  { name: "Pangasinan", path: "pangasinan" },
  { name: "Negros Oriental", path: "negros-oriental" },
  { name: "Manila", path: "manila" },
  { name: "Cagayan/Isabela", path: "cagayan-isabela" },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-primary to-accent rounded-full">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            QR Attendance Scanner
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select a chapter to manage missionaries and track attendance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {chapters.map((chapter) => (
            <ChapterCard key={chapter.path} name={chapter.name} path={chapter.path} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
