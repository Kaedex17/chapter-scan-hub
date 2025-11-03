import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface ChapterCardProps {
  name: string;
  path: string;
}

export const ChapterCard = ({ name, path }: ChapterCardProps) => {
  return (
    <Link to={`/chapter/${path}`}>
      <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-card to-muted/20 border-2 border-border hover:border-primary">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-center group-hover:text-primary transition-colors">
            {name}
          </h3>
        </CardContent>
      </Card>
    </Link>
  );
};
