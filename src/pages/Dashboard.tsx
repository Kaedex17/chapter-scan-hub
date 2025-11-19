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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="mb-16 text-center space-y-6">
          <div className="flex justify-center mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative p-6 bg-gradient-to-br from-primary via-accent to-secondary rounded-full shadow-2xl">
                <BookOpen className="h-14 w-14 md:h-16 md:w-16 text-primary-foreground drop-shadow-lg" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3 animate-in fade-in slide-in-from-top-6 duration-700 delay-150">
            <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent drop-shadow-sm">
              QR Attendance Scanner
            </h1>
            <div className="h-1.5 w-32 mx-auto bg-gradient-to-r from-primary via-accent to-secondary rounded-full shadow-lg" />
          </div>
          
          <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed animate-in fade-in slide-in-from-top-8 duration-700 delay-300">
            Select a chapter to manage missionaries and track attendance with ease
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          {chapters.map((chapter, index) => (
            <div
              key={chapter.path}
              style={{ animationDelay: `${500 + index * 100}ms` }}
              className="animate-in fade-in slide-in-from-bottom-8 duration-700"
            >
              <ChapterCard name={chapter.name} path={chapter.path} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
