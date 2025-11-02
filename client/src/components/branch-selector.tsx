import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const branches = [
  { id: "1", name: "Main Branch - Riyadh" },
  { id: "2", name: "Al Khobar Branch" },
  { id: "3", name: "Jeddah Branch" },
];

export function BranchSelector() {
  return (
    <Select defaultValue="1">
      <SelectTrigger className="w-64" data-testid="select-branch">
        <Building2 className="h-4 w-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id} data-testid={`option-branch-${branch.id}`}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
