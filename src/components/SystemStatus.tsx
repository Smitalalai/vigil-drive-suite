import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Wifi } from "lucide-react";

const SystemStatus = () => {
  return (
    <div className="flex items-center gap-3">
      <Badge variant="outline" className="bg-success/10 border-success/30 text-success">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        System Online
      </Badge>
      <Badge variant="outline" className="bg-accent/10 border-accent/30 text-accent">
        <Wifi className="w-3 h-3 mr-1" />
        Connected
      </Badge>
    </div>
  );
};

export default SystemStatus;
