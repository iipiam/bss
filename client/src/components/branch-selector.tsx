import { Building2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBranch } from "@/contexts/BranchContext";
import { useLanguage } from "@/contexts/LanguageContext";

export function BranchSelector() {
  const { currentBranch, branches, setCurrentBranch, isLoading } = useBranch();
  const { t } = useLanguage();

  if (isLoading || !currentBranch) {
    return (
      <div className="flex items-center gap-2 w-64 h-10 px-3 border rounded-md bg-background">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t.loadingBranches || "Loading branches..."}</span>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="flex items-center gap-2 w-64 h-10 px-3 border rounded-md bg-background">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t.noBranchesAvailable || "No branches available"}</span>
      </div>
    );
  }

  return (
    <Select value={currentBranch.id} onValueChange={setCurrentBranch}>
      <SelectTrigger className="w-64" data-testid="select-branch">
        <Building2 className="h-4 w-4 mr-2" />
        <SelectValue>
          <span className="font-medium">{currentBranch.name}</span>
          {currentBranch.location && (
            <span className="text-xs text-muted-foreground ml-2">• {currentBranch.location}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id} data-testid={`option-branch-${branch.id}`}>
            <div className="flex flex-col">
              <span className="font-medium">{branch.name}</span>
              {branch.location && (
                <span className="text-xs text-muted-foreground">{branch.location}</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
