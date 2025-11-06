import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Edit, MapPin, Phone, Users, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertBranchSchema, type Branch } from "@shared/schema";
import { useDeviceLayout } from "@/lib/mobileLayout";

const branchFormSchema = insertBranchSchema.extend({
  staff: z.string().min(1, "Staff count is required"),
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

export default function Branches() {
  const layout = useDeviceLayout();
  const [open, setOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const { toast } = useToast();

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      name: "",
      location: "",
      phone: "",
      manager: "",
      staff: "",
      status: "Active",
    },
  });

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const createBranchMutation = useMutation({
    mutationFn: async (data: BranchFormValues) => {
      const branchData = {
        ...data,
        staff: parseInt(data.staff),
      };
      return await apiRequest("POST", "/api/branches", branchData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Branch created",
        description: "The branch has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create branch",
        description: error.message || "Could not create branch",
        variant: "destructive",
      });
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BranchFormValues }) => {
      const branchData = {
        ...data,
        staff: parseInt(data.staff),
      };
      return await apiRequest("PATCH", `/api/branches/${id}`, branchData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      setOpen(false);
      setEditingBranch(null);
      form.reset();
      toast({
        title: "Branch updated",
        description: "The branch has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update branch",
        description: error.message || "Could not update branch",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BranchFormValues) => {
    if (editingBranch) {
      updateBranchMutation.mutate({ id: editingBranch.id, data });
    } else {
      createBranchMutation.mutate(data);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    form.reset({
      name: branch.name,
      location: branch.location,
      phone: branch.phone,
      manager: branch.manager,
      staff: branch.staff.toString(),
      status: branch.status,
    });
    setOpen(true);
  };

  const handleAddNew = () => {
    setEditingBranch(null);
    form.reset({
      name: "",
      location: "",
      phone: "",
      manager: "",
      staff: "",
      status: "Active",
    });
    setOpen(true);
  };

  if (isLoading) {
    return (
      <div className={layout.padding}>
        <h1 className={`${layout.text3Xl} font-bold mb-2`}>Branch Management</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div className={`flex ${layout.isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
        <div>
          <h1 className={`${layout.text3Xl} font-bold mb-2`}>Branch Management</h1>
          <p className="text-muted-foreground">Manage your restaurant locations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleAddNew} 
              data-testid="button-add-branch"
              className={layout.isMobile ? 'min-h-[44px] min-w-[44px] h-11' : ''}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBranch ? "Edit Branch" : "Add New Branch"}</DialogTitle>
              <DialogDescription>
                {editingBranch ? "Update branch information" : "Create a new restaurant branch"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Main Branch - Riyadh"
                            data-testid="input-branch-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-branch-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., King Fahd Road, Riyadh"
                          data-testid="input-branch-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., +966 11 234 5678"
                            data-testid="input-branch-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="manager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manager</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Ahmed Al-Rashid"
                            data-testid="input-branch-manager"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="staff"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staff Count</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="e.g., 15"
                          data-testid="input-branch-staff"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      setEditingBranch(null);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createBranchMutation.isPending || updateBranchMutation.isPending}
                    data-testid="button-save-branch"
                  >
                    {createBranchMutation.isPending || updateBranchMutation.isPending
                      ? "Saving..."
                      : editingBranch
                      ? "Update Branch"
                      : "Create Branch"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {branches.map((branch) => (
          <Card key={branch.id} data-testid={`card-branch-${branch.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-md bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl mb-1">{branch.name}</CardTitle>
                    <Badge variant={branch.status === "Active" ? "default" : "secondary"}>
                      {branch.status}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleEdit(branch)}
                  data-testid={`button-edit-branch-${branch.id}`}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Branch
                </Button>
              </div>
            </CardHeader>
            <CardContent className={layout.cardPadding}>
              <div className={`grid ${layout.gap} ${layout.gridCols({ desktop: 4, tablet: 2, mobile: 1 })}`}>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{branch.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium font-mono">{branch.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Manager</p>
                      <p className="font-medium">{branch.manager}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Staff Count</p>
                      <p className="font-medium font-mono">{branch.staff}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Today's Sales</p>
                      <p className="text-2xl font-bold font-mono">-</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Today's Orders</p>
                      <p className="text-2xl font-bold font-mono">-</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
