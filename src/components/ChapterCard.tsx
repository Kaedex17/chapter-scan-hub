import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface ChapterCardProps {
  name: string;
  path: string;
}

export const ChapterCard = ({ name, path }: ChapterCardProps) => {
  return (
    <Link to={`/chapter/${path}`} className="block h-full">
      <Card className="group relative cursor-pointer h-full overflow-hidden border-2 border-border/50 bg-gradient-to-br from-card via-card to-muted/30 backdrop-blur-sm transition-all duration-500 hover:border-primary hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-accent/0 to-secondary/0 group-hover:from-primary/10 group-hover:via-accent/10 group-hover:to-secondary/10 transition-all duration-500" />
        
        {/* Animated border gradient */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-[-2px] bg-gradient-to-r from-primary via-accent to-secondary rounded-lg blur-sm" />
        </div>
        
        <CardContent className="relative flex flex-col items-center justify-center p-10 space-y-5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full blur-md opacity-0 group-hover:opacity-60 transition-all duration-500" />
            <div className="relative p-5 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
              <Users className="h-10 w-10 text-primary group-hover:text-accent transition-colors duration-500" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-center text-foreground group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-primary group-hover:via-accent group-hover:to-secondary group-hover:bg-clip-text transition-all duration-500">
            {name}
          </h3>
          
          {/* Arrow indicator */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
            <div className="w-6 h-6 border-r-2 border-b-2 border-primary rotate-[-45deg]" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
