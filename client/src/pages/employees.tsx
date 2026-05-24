import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, UserCheck, UserX, Calendar, FileText, Plane, Award, Shield, Briefcase, Clock, Info, Key, LogIn, Trash2, CalendarDays } from "lucide-react";
import type { User } from "@shared/schema";
import { 
  DEFAULT_EMPLOYEE_PERMISSIONS, 
  ALL_PERMISSION_ACTIONS,
  getPermissionsForBusinessType,
  type Permission,
  type PermissionAction,
  type GranularPermission,
  type PermissionValue,
  type BusinessType,
  normalizePermission,
  NO_PERMISSION
} from "@shared/permissions";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/lib/auth";
import { useDeviceLayout } from "@/lib/mobileLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { InfoTip } from "@/components/ui/info-tip";

// Default weekly schedule (Saudi weekend: Friday off)
const DEFAULT_WEEKLY_SCHEDULE = {
  sunday: true,
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: false,
  saturday: true,
};

// Helper function to get permission labels using translations.
// Some labels change wording per business type to match the sidebar.
function getPermissionLabels(t: any, businessType: BusinessType): Record<Permission, string> {
  const isServiceBusiness =
    businessType === 'design_services' ||
    businessType === 'installation_services' ||
    businessType === 'it_services';
  const isRealEstate = businessType === 'real_estate';
  const isFactory = businessType === 'factory';

  const posLabel = isRealEstate
    ? (t.dealProcessing || "Deal Processing")
    : isServiceBusiness
      ? (t.serviceDesk || "Service Desk")
      : (t.pos || "POS");

  const ordersLabel = isRealEstate
    ? (t.clientInquiries || "Client Inquiries")
    : (t.orders || "Orders");

  const menuLabel = isRealEstate
    ? (t.propertyListings || "Property Listings")
    : isServiceBusiness
      ? (t.serviceCatalog || "Service Catalog")
      : isFactory
        ? (t.products || "Products")
        : `${t.menu || "Menu"} / ${t.products || "Products"}`;

  const customersLabel = isServiceBusiness
    ? `${t.customers || "Customers"} / ${t.contractors || "Contractors"}`
    : (t.customers || "Customers");

  const branchesLabel = isRealEstate
    ? (t.offices || "Offices")
    : (t.branches || "Branches");

  const reportsLabel = isRealEstate
    ? (t.valuations || "Valuations")
    : isServiceBusiness
      ? (t.profitability || "Service Profitability")
      : `${t.reports || "Reports"} & ${t.analytics || "Analytics"}`;

  const salesLabel = isRealEstate
    ? (t.commissions || "Commissions")
    : (t.sales || "Sales");

  const workingHoursLabel = isFactory
    ? `${t.factory || "Factory"} / ${t.workingHours || "Working Hours"}`
    : isRealEstate
      ? `${t.office || "Office"} / ${t.workingHours || "Working Hours"}`
      : isServiceBusiness
        ? `${t.company || "Company"} / ${t.workingHours || "Working Hours"}`
        : `${t.shop || "Shop"} / ${t.workingHours || "Working Hours"}`;

  return {
    dashboard: t.dashboard || "Dashboard",
    inventory: t.inventory || "Inventory",
    menu: menuLabel,
    recipes: t.recipes || "Recipes",
    branches: branchesLabel,
    procurement: t.procurement || "Procurement",
    pos: posLabel,
    orders: ordersLabel,
    kitchen: isFactory ? (t.workshop || "Workshop") : `${t.kitchen || "Kitchen"} / ${t.workshop || "Workshop"}`,
    sales: salesLabel,
    reports: reportsLabel,
    customers: customersLabel,
    settings: t.settings || "Settings",
    users: t.employees || "Employees",
    workingHours: workingHoursLabel,
    bills: t.bills || "Bills",
    deliveryApps: t.deliveryApps || "Delivery Apps",
    licenses: t.licenses || "Licenses",
    investors: t.investors || "Investors",
    activityLog: t.activityLog || "Activity Log",
    marketing: t.marketing || "Marketing",
    mealSubscriptions: t.mealSubscriptions || "Meal Subscriptions",
    catering: (t as any).cateringContracts || "Catering Contracts",
    projects: t.projects || "Projects",
    quotations: t.quotations || "Quotations",
  };
}

// Helper function to get action labels using translations
function getActionLabels(t: any): Record<PermissionAction, string> {
  return {
    view: t.view || "View",
    add: t.add || "Add",
    edit: t.edit || "Edit",
    delete: t.delete || "Delete",
  };
}

// Helper function to get day labels using translations
function getDayLabels(t: any) {
  return {
    sunday: t.sunday || "Sunday",
    monday: t.monday || "Monday",
    tuesday: t.tuesday || "Tuesday",
    wednesday: t.wednesday || "Wednesday",
    thursday: t.thursday || "Thursday",
    friday: t.friday || "Friday",
    saturday: t.saturday || "Saturday",
  };
}

export default function Employees() {
  const { t, isRTL } = useLanguage();
  const layout = useDeviceLayout();
  const { restaurant } = useAuth();

  // Determine the active account's business type — used to scope the
  // Permissions grid so it mirrors the sidebar for that business.
  const businessType: BusinessType = ((restaurant as any)?.businessType as BusinessType) || 'restaurant';
  const VISIBLE_PERMISSIONS = getPermissionsForBusinessType(businessType);

  // Get translated labels
  const PERMISSION_LABELS = getPermissionLabels(t, businessType);
  const ACTION_LABELS = getActionLabels(t);
  const DAY_LABELS = getDayLabels(t);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<any>({
    username: "",
    password: "",
    fullName: "",
    email: "",
    phone: "",
    role: "employee",
    permissions: { ...DEFAULT_EMPLOYEE_PERMISSIONS },
    branchId: null,
    active: true,
    // Recruitment Data
    employeeNumber: "",
    hireDate: "",
    recruitmentSource: "",
    probationEndDate: "",
    contractType: "",
    salary: "",
    // Vacation Days
    vacationDaysTotal: 0,
    vacationDaysUsed: 0,
    // Visa Information
    visaNumber: "",
    visaFees: "",
    visaExpiryDate: "",
    visaStatus: "",
    // Ticket Information
    ticketAmount: "",
    ticketDestination: "",
    ticketDate: "",
    ticketStatus: "",
    // Performance
    performanceRating: "",
    lastReviewDate: "",
    performanceNotes: "",
    // Compliance
    documents: [],
    certifications: [],
    trainingCompleted: [],
    // Weekly Schedule
    weeklySchedule: { ...DEFAULT_WEEKLY_SCHEDULE },
  });

  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: t.employeeCreated || "Employee Created",
        description: t.employeeCreatedDesc || "Employee has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.error || "Error",
        description: error.message || t.failedToCreateEmployee || "Failed to create employee",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: t.employeeUpdated || "Employee Updated",
        description: t.employeeUpdatedDesc || "Employee information has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.error || "Error",
        description: error.message || t.failedToUpdateEmployee || "Failed to update employee",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setUserToDelete(null);
      toast({
        title: t.employeeDeleted || "Employee Deleted",
        description: t.employeeDeletedDesc || "Employee has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.error || "Error",
        description: error.message || t.failedToDeleteEmployee || "Failed to delete employee",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      fullName: "",
      email: "",
      phone: "",
      role: "employee",
      permissions: { ...DEFAULT_EMPLOYEE_PERMISSIONS },
      branchId: null,
      active: true,
      employeeNumber: "",
      hireDate: "",
      recruitmentSource: "",
      probationEndDate: "",
      contractType: "",
      salary: "",
      vacationDaysTotal: 0,
      vacationDaysUsed: 0,
      visaNumber: "",
      visaFees: "",
      visaExpiryDate: "",
      visaStatus: "",
      ticketAmount: "",
      ticketDestination: "",
      ticketDate: "",
      ticketStatus: "",
      performanceRating: "",
      lastReviewDate: "",
      performanceNotes: "",
      documents: [],
      certifications: [],
      trainingCompleted: [],
      weeklySchedule: { ...DEFAULT_WEEKLY_SCHEDULE },
    });
  };

  const handleCreate = () => {
    if (!formData.username || !formData.password || !formData.fullName) {
      toast({
        title: t.missingFields || "Missing fields",
        description: t.missingFieldsDesc || "Please fill in username, password, and full name",
        variant: "destructive",
      });
      return;
    }
    
    // Convert numeric fields to proper types before sending
    const createData: any = {
      ...formData,
      vacationDaysTotal: formData.vacationDaysTotal ? parseInt(formData.vacationDaysTotal.toString()) : 0,
      vacationDaysUsed: formData.vacationDaysUsed ? parseInt(formData.vacationDaysUsed.toString()) : 0,
      visaFees: formData.visaFees ? parseFloat(formData.visaFees.toString()).toFixed(2) : null,
      ticketAmount: formData.ticketAmount ? parseFloat(formData.ticketAmount.toString()).toFixed(2) : null,
      performanceRating: formData.performanceRating ? parseFloat(formData.performanceRating.toString()).toFixed(2) : null,
      salary: formData.salary ? parseFloat(formData.salary.toString()).toFixed(2) : null,
      employeeNumber: formData.employeeNumber || null,
      hireDate: formData.hireDate || null,
      recruitmentSource: formData.recruitmentSource || null,
      probationEndDate: formData.probationEndDate || null,
      contractType: formData.contractType || null,
      visaNumber: formData.visaNumber || null,
      visaExpiryDate: formData.visaExpiryDate || null,
      visaStatus: formData.visaStatus || null,
      ticketDestination: formData.ticketDestination || null,
      ticketDate: formData.ticketDate || null,
      ticketStatus: formData.ticketStatus || null,
      lastReviewDate: formData.lastReviewDate || null,
      performanceNotes: formData.performanceNotes || null,
      weeklySchedule: formData.weeklySchedule,
    };
    
    createMutation.mutate(createData);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "",
      fullName: user.fullName,
      email: user.email || "",
      phone: user.phone || "",
      role: user.role,
      permissions: (() => {
        // Backwards-compat: for legacy records saved before the
        // projects/quotations split, seed the new keys from the legacy
        // 'orders' grant so existing employees keep their access until the
        // owner edits them. Once the owner saves, explicit values are
        // persisted and the fallback no longer applies.
        const userPerms: any = user.permissions || {};
        const seeded: any = { ...userPerms };
        if (seeded.orders !== undefined) {
          if (seeded.projects === undefined) seeded.projects = seeded.orders;
          if (seeded.quotations === undefined) seeded.quotations = seeded.orders;
        }
        return { ...DEFAULT_EMPLOYEE_PERMISSIONS, ...seeded };
      })(),
      branchId: user.branchId || null,
      active: user.active,
      employeeNumber: user.employeeNumber || "",
      hireDate: user.hireDate ? new Date(user.hireDate).toISOString().split('T')[0] : "",
      recruitmentSource: user.recruitmentSource || "",
      probationEndDate: user.probationEndDate ? new Date(user.probationEndDate).toISOString().split('T')[0] : "",
      contractType: user.contractType || "",
      salary: user.salary != null ? String(user.salary) : "",
      vacationDaysTotal: user.vacationDaysTotal || 0,
      vacationDaysUsed: user.vacationDaysUsed || 0,
      visaNumber: user.visaNumber || "",
      visaFees: user.visaFees || "",
      visaExpiryDate: user.visaExpiryDate ? new Date(user.visaExpiryDate).toISOString().split('T')[0] : "",
      visaStatus: user.visaStatus || "",
      ticketAmount: user.ticketAmount || "",
      ticketDestination: user.ticketDestination || "",
      ticketDate: user.ticketDate ? new Date(user.ticketDate).toISOString().split('T')[0] : "",
      ticketStatus: user.ticketStatus || "",
      performanceRating: user.performanceRating || "",
      lastReviewDate: user.lastReviewDate ? new Date(user.lastReviewDate).toISOString().split('T')[0] : "",
      performanceNotes: user.performanceNotes || "",
      documents: user.documents || [],
      certifications: user.certifications || [],
      trainingCompleted: user.trainingCompleted || [],
      weeklySchedule: user.weeklySchedule || { ...DEFAULT_WEEKLY_SCHEDULE },
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedUser) return;
    
    const updateData: any = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      permissions: formData.permissions,
      branchId: formData.branchId,
      active: formData.active,
      employeeNumber: formData.employeeNumber || null,
      hireDate: formData.hireDate || null,
      recruitmentSource: formData.recruitmentSource || null,
      probationEndDate: formData.probationEndDate || null,
      contractType: formData.contractType || null,
      salary: formData.salary ? parseFloat(formData.salary.toString()).toFixed(2) : null,
      vacationDaysTotal: formData.vacationDaysTotal ? parseInt(formData.vacationDaysTotal.toString()) : 0,
      vacationDaysUsed: formData.vacationDaysUsed ? parseInt(formData.vacationDaysUsed.toString()) : 0,
      visaNumber: formData.visaNumber || null,
      visaFees: formData.visaFees ? parseFloat(formData.visaFees.toString()).toFixed(2) : null,
      visaExpiryDate: formData.visaExpiryDate || null,
      visaStatus: formData.visaStatus || null,
      ticketAmount: formData.ticketAmount ? parseFloat(formData.ticketAmount.toString()).toFixed(2) : null,
      ticketDestination: formData.ticketDestination || null,
      ticketDate: formData.ticketDate || null,
      ticketStatus: formData.ticketStatus || null,
      performanceRating: formData.performanceRating ? parseFloat(formData.performanceRating.toString()).toFixed(2) : null,
      lastReviewDate: formData.lastReviewDate || null,
      performanceNotes: formData.performanceNotes || null,
      documents: formData.documents,
      certifications: formData.certifications,
      trainingCompleted: formData.trainingCompleted,
      weeklySchedule: formData.weeklySchedule,
    };
    
    if (formData.password) {
      updateData.password = formData.password;
    }
    
    updateMutation.mutate({ id: selectedUser.id, data: updateData });
  };

  // Toggle a specific action for a permission
  const togglePermissionAction = (permission: Permission, action: PermissionAction) => {
    const currentPerm = normalizePermission(formData.permissions[permission]);
    const newPerm: GranularPermission = {
      ...currentPerm,
      [action]: !currentPerm[action],
    };
    // If view is disabled, disable all other actions too
    if (action === 'view' && !newPerm.view) {
      newPerm.add = false;
      newPerm.edit = false;
      newPerm.delete = false;
    }
    // If any action is enabled, view must be enabled
    if ((action === 'add' || action === 'edit' || action === 'delete') && newPerm[action]) {
      newPerm.view = true;
    }
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: newPerm,
      },
    });
  };

  // Toggle all actions for a permission at once
  const toggleAllActions = (permission: Permission, enabled: boolean) => {
    const newPerm: GranularPermission = enabled 
      ? { view: true, add: true, edit: true, delete: true }
      : { view: false, add: false, edit: false, delete: false };
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: newPerm,
      },
    });
  };

  // Check if all actions are enabled for a permission
  const allActionsEnabled = (permission: Permission): boolean => {
    const perm = normalizePermission(formData.permissions[permission]);
    return perm.view && perm.add && perm.edit && perm.delete;
  };

  const filteredUsers = users?.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.employeeNumber?.toLowerCase().includes(query)
    );
  }) || [];

  const vacationDaysRemaining = (formData.vacationDaysTotal || 0) - (formData.vacationDaysUsed || 0);

  if (isLoading) {
    return <div className={layout.padding}>{t.loading || "Loading..."}</div>;
  }

  return (
    <TooltipProvider delayDuration={150}>
    <div className={layout.padding + " space-y-6"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={layout.text3Xl + " font-bold"}>{t.employeeManagement || "Employee Management"}</h1>
          <p className="text-muted-foreground">{t.manageEmployees || "Manage employees and their information"}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-[44px]" data-testid="button-create-employee">
              <Plus className="mr-2 h-4 w-4" />
              {t.addEmployee || "Add Employee"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.createNewEmployee || "Create New Employee"}</DialogTitle>
              <DialogDescription>{t.addNewEmployeeDesc || "Add a new employee to your system"}</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
                <TabsTrigger value="basic" className="h-[44px]">{t.basic || "Basic"}</TabsTrigger>
                <TabsTrigger value="recruitment" className="h-[44px]">{t.recruitment || "Recruitment"}</TabsTrigger>
                <TabsTrigger value="vacation" className="h-[44px]">{t.vacation || "Vacation"}</TabsTrigger>
                <TabsTrigger value="visa" className="h-[44px]">{t.visa || "Visa"}</TabsTrigger>
                <TabsTrigger value="ticket" className="h-[44px]">{t.ticket || "Ticket"}</TabsTrigger>
                <TabsTrigger value="performance" className="h-[44px]">{t.performance || "Performance"}</TabsTrigger>
                <TabsTrigger value="schedule" className="h-[44px]">
                  <CalendarDays className="mr-1 h-4 w-4" />
                  {t.schedule || "Schedule"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t.empFullName || "Full Name"} *</Label>
                    <Input
                      id="fullName"
                      className="h-[44px]"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      data-testid="input-fullname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">{t.empUsername || "Username"} *</Label>
                    <Input
                      id="username"
                      className="h-[44px]"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      data-testid="input-username"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.empEmail || "Email"}</Label>
                    <Input
                      id="email"
                      type="email"
                      className="h-[44px]"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t.empPhone || "Phone"}</Label>
                    <Input
                      id="phone"
                      className="h-[44px]"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">{t.empPassword || "Password"} *</Label>
                    <Input
                      id="password"
                      type="password"
                      className="h-[44px]"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      data-testid="input-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">{t.role || "Role"}</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger className="h-[44px]" data-testid="select-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">{t.employee || "Employee"}</SelectItem>
                        <SelectItem value="admin">{t.admin || "Admin"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">{t.permissions || "Permissions"}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t.permissionsDescription || "Control what actions sub-accounts can perform in each feature"}
                  </p>
                  
                  {/* Header row */}
                  <div className="grid grid-cols-[1fr,repeat(4,60px),40px] gap-2 items-center pb-2 border-b text-xs font-medium text-muted-foreground">
                    <div>{t.feature || "Feature"}</div>
                    <div className="text-center">{t.view || "View"}</div>
                    <div className="text-center">{t.add || "Add"}</div>
                    <div className="text-center">{t.edit || "Edit"}</div>
                    <div className="text-center">{t.delete || "Delete"}</div>
                    <div className="text-center">{t.all || "All"}</div>
                  </div>
                  
                  {/* Permission rows */}
                  <div className="space-y-2">
                    {VISIBLE_PERMISSIONS.map((perm) => {
                      const permValue = normalizePermission(formData.permissions[perm]);
                      return (
                        <div key={perm} className="grid grid-cols-[1fr,repeat(4,60px),40px] gap-2 items-center py-1">
                          <Label className="text-sm font-medium">{PERMISSION_LABELS[perm]}</Label>
                          {ALL_PERMISSION_ACTIONS.map((action) => (
                            <div key={action} className="flex justify-center">
                              <Checkbox
                                checked={permValue[action]}
                                onCheckedChange={() => togglePermissionAction(perm, action)}
                                data-testid={`checkbox-${perm}-${action}`}
                              />
                            </div>
                          ))}
                          <div className="flex justify-center">
                            <Checkbox
                              checked={allActionsEnabled(perm)}
                              onCheckedChange={(checked) => toggleAllActions(perm, !!checked)}
                              data-testid={`checkbox-${perm}-all`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recruitment" className="space-y-4 mt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="employeeNumber">{t.employeeNumber || "Employee Number"}</Label>
                    <Input
                      id="employeeNumber"
                      className="h-[44px]"
                      value={formData.employeeNumber}
                      onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                      data-testid="input-employee-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">{t.hireDate || "Hire Date"}</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      className="h-[44px]"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                      data-testid="input-hire-date"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="recruitmentSource">{t.recruitmentSource || "Recruitment Source"}<InfoTip>{isRTL ? "كيف تم توظيف هذا الموظف." : "How this employee was recruited."}</InfoTip></Label>
                    <Select value={formData.recruitmentSource} onValueChange={(value) => setFormData({ ...formData, recruitmentSource: value })}>
                      <SelectTrigger className="h-[44px]" data-testid="select-recruitment-source">
                        <SelectValue placeholder={t.selectSource || "Select source"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="referral">{t.referral || "Referral"}</SelectItem>
                        <SelectItem value="job_board">{t.jobBoard || "Job Board"}</SelectItem>
                        <SelectItem value="agency">{t.agency || "Agency"}</SelectItem>
                        <SelectItem value="walk_in">{t.walkIn || "Walk-in"}</SelectItem>
                        <SelectItem value="other">{t.other || "Other"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractType">{t.contractType || "Contract Type"}<InfoTip>{isRTL ? "نوع عقد العمل." : "Employment contract type."}</InfoTip></Label>
                    <Select value={formData.contractType} onValueChange={(value) => setFormData({ ...formData, contractType: value })}>
                      <SelectTrigger className="h-[44px]" data-testid="select-contract-type">
                        <SelectValue placeholder={t.selectType || "Select type"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">{t.fullTime || "Full Time"}</SelectItem>
                        <SelectItem value="part_time">{t.partTime || "Part Time"}</SelectItem>
                        <SelectItem value="contract">{t.contract || "Contract"}</SelectItem>
                        <SelectItem value="temporary">{t.temporary || "Temporary"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="probationEndDate">{t.probationEndDate || "Probation End Date"}<InfoTip>{isRTL ? "تاريخ انتهاء فترة التجربة." : "Date when probation period ends."}</InfoTip></Label>
                    <Input
                      id="probationEndDate"
                      type="date"
                      className="h-[44px]"
                      value={formData.probationEndDate}
                      onChange={(e) => setFormData({ ...formData, probationEndDate: e.target.value })}
                      data-testid="input-probation-end-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">{t.monthlySalary || "Monthly Salary"} ({t.sar || "SAR"})<InfoTip>{isRTL ? "إجمالي الراتب الشهري بالريال السعودي." : "Gross monthly salary in SAR."}</InfoTip></Label>
                    <Input
                      id="salary"
                      type="number"
                      step="0.01"
                      min="0"
                      className="h-[44px]"
                      placeholder="0.00"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      data-testid="input-salary"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="vacation" className="space-y-4 mt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vacationDaysTotal">{t.vacationDaysTotal || "Total Vacation Days"}<InfoTip>{isRTL ? "إجمالي أيام الإجازة السنوية المستحقة." : "Total annual vacation days granted."}</InfoTip></Label>
                    <Input
                      id="vacationDaysTotal"
                      type="number"
                      className="h-[44px]"
                      value={formData.vacationDaysTotal}
                      onChange={(e) => setFormData({ ...formData, vacationDaysTotal: parseInt(e.target.value) || 0 })}
                      data-testid="input-vacation-days-total"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vacationDaysUsed">{t.vacationDaysUsed || "Vacation Days Used"}<InfoTip>{isRTL ? "عدد أيام الإجازة المستخدمة هذا العام." : "Vacation days already used this year."}</InfoTip></Label>
                    <Input
                      id="vacationDaysUsed"
                      type="number"
                      className="h-[44px]"
                      value={formData.vacationDaysUsed}
                      onChange={(e) => setFormData({ ...formData, vacationDaysUsed: parseInt(e.target.value) || 0 })}
                      data-testid="input-vacation-days-used"
                    />
                  </div>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{t.vacationDaysRemaining || "Vacation Days Remaining"}<InfoTip>{isRTL ? "إجمالي الأيام ناقص الأيام المستخدمة." : "Total days minus used days."}</InfoTip></p>
                        <p className="text-2xl font-bold">{vacationDaysRemaining}</p>
                      </div>
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visa" className="space-y-4 mt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="visaNumber">{t.visaNumber || "Visa Number"}</Label>
                    <Input
                      id="visaNumber"
                      className="h-[44px]"
                      value={formData.visaNumber}
                      onChange={(e) => setFormData({ ...formData, visaNumber: e.target.value })}
                      data-testid="input-visa-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visaFees">{t.visaFees || "Visa Fees"} ({t.sar || "SAR"})</Label>
                    <Input
                      id="visaFees"
                      type="number"
                      step="0.01"
                      className="h-[44px]"
                      value={formData.visaFees}
                      onChange={(e) => setFormData({ ...formData, visaFees: e.target.value })}
                      data-testid="input-visa-fees"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="visaExpiryDate">{t.visaExpiryDate || "Visa Expiry Date"}<InfoTip>{isRTL ? "تاريخ انتهاء صلاحية التأشيرة." : "Date the work visa expires."}</InfoTip></Label>
                    <Input
                      id="visaExpiryDate"
                      type="date"
                      className="h-[44px]"
                      value={formData.visaExpiryDate}
                      onChange={(e) => setFormData({ ...formData, visaExpiryDate: e.target.value })}
                      data-testid="input-visa-expiry-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visaStatus">{t.visaStatus || "Visa Status"}<InfoTip>{isRTL ? "الحالة الحالية للتأشيرة." : "Current status of the visa."}</InfoTip></Label>
                    <Select value={formData.visaStatus} onValueChange={(value) => setFormData({ ...formData, visaStatus: value })}>
                      <SelectTrigger className="h-[44px]" data-testid="select-visa-status">
                        <SelectValue placeholder={t.selectStatus || "Select status"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="valid">{t.valid || "Valid"}</SelectItem>
                        <SelectItem value="expired">{t.expired || "Expired"}</SelectItem>
                        <SelectItem value="pending">{t.pending || "Pending"}</SelectItem>
                        <SelectItem value="not_applicable">{t.notApplicable || "Not Applicable"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ticket" className="space-y-4 mt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ticketAmount">{t.ticketAmount || "Ticket Amount"} ({t.sar || "SAR"})</Label>
                    <Input
                      id="ticketAmount"
                      type="number"
                      step="0.01"
                      className="h-[44px]"
                      value={formData.ticketAmount}
                      onChange={(e) => setFormData({ ...formData, ticketAmount: e.target.value })}
                      data-testid="input-ticket-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticketDestination">{t.ticketDestination || "Ticket Destination"}</Label>
                    <Input
                      id="ticketDestination"
                      className="h-[44px]"
                      value={formData.ticketDestination}
                      onChange={(e) => setFormData({ ...formData, ticketDestination: e.target.value })}
                      data-testid="input-ticket-destination"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ticketDate">{t.ticketDate || "Ticket Date"}</Label>
                    <Input
                      id="ticketDate"
                      type="date"
                      className="h-[44px]"
                      value={formData.ticketDate}
                      onChange={(e) => setFormData({ ...formData, ticketDate: e.target.value })}
                      data-testid="input-ticket-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticketStatus">{t.ticketStatus || "Ticket Status"}<InfoTip>{isRTL ? "حالة تذكرة سفر الموظف." : "Status of the employee travel ticket."}</InfoTip></Label>
                    <Select value={formData.ticketStatus} onValueChange={(value) => setFormData({ ...formData, ticketStatus: value })}>
                      <SelectTrigger className="h-[44px]" data-testid="select-ticket-status">
                        <SelectValue placeholder={t.selectStatus || "Select status"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t.pending || "Pending"}</SelectItem>
                        <SelectItem value="booked">{t.booked || "Booked"}</SelectItem>
                        <SelectItem value="used">{t.used || "Used"}</SelectItem>
                        <SelectItem value="not_applicable">{t.notApplicable || "Not Applicable"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4 mt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="performanceRating">{t.performanceRating || "Performance Rating"} (0.00 - 5.00)<InfoTip>{isRTL ? "تقييم الأداء من 0 إلى 5." : "Performance rating on a 0–5 scale."}</InfoTip></Label>
                    <Input
                      id="performanceRating"
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      className="h-[44px]"
                      value={formData.performanceRating}
                      onChange={(e) => setFormData({ ...formData, performanceRating: e.target.value })}
                      data-testid="input-performance-rating"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastReviewDate">{t.lastReviewDate || "Last Review Date"}</Label>
                    <Input
                      id="lastReviewDate"
                      type="date"
                      className="h-[44px]"
                      value={formData.lastReviewDate}
                      onChange={(e) => setFormData({ ...formData, lastReviewDate: e.target.value })}
                      data-testid="input-last-review-date"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="performanceNotes">{t.performanceNotes || "Performance Notes"}</Label>
                  <Textarea
                    id="performanceNotes"
                    value={formData.performanceNotes}
                    onChange={(e) => setFormData({ ...formData, performanceNotes: e.target.value })}
                    placeholder={t.enterPerformanceNotes || "Enter performance notes and feedback"}
                    rows={4}
                    data-testid="input-performance-notes"
                  />
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{t.weeklySchedule || "Weekly Schedule"}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t.scheduleDescription || "Set which days the employee works. Toggle OFF for days off."}
                  </p>
                  <div className="space-y-3">
                    {(Object.keys(DAY_LABELS) as Array<keyof typeof DAY_LABELS>).map((day) => (
                      <div key={day} className="flex items-center justify-between h-[44px] p-3 rounded-lg border">
                        <Label htmlFor={`schedule-${day}`} className="text-sm font-medium capitalize">
                          {t[day] || DAY_LABELS[day]}
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formData.weeklySchedule?.[day] ? (t.working || "Working") : (t.dayOff || "Day Off")}
                          </span>
                          <Switch
                            id={`schedule-${day}`}
                            checked={formData.weeklySchedule?.[day] ?? true}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              weeklySchedule: { ...formData.weeklySchedule, [day]: checked }
                            })}
                            data-testid={`switch-schedule-${day}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" className="h-[44px]" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-create">
                {t.cancel || "Cancel"}
              </Button>
              <Button className="h-[44px]" onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-save-employee">
                {createMutation.isPending ? (t.creating || "Creating...") : (t.createEmployee || "Create Employee")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Guide Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{t.employeeAccountQuickGuide || "Employee Account Quick Guide"}</CardTitle>
              <CardDescription className="mt-2">
                {t.followStepsToManageEmployees || "Follow these simple steps to manage employee accounts"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs">1</div>
                <span>{t.createEmployeeAccount || "Create Employee Account"}</span>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                {t.createEmployeeAccountDesc || 'Click "Add Employee" button above. Fill in their name, username, and password. Save the credentials to share with them.'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs">2</div>
                <LogIn className="h-4 w-4" />
                <span>{t.employeeLogin || "Employee Login"}</span>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                {t.employeeLoginDesc || "Employees can log in using their username and password (not email). They use the same login page as admins."}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs">3</div>
                <Key className="h-4 w-4" />
                <span>{t.resetPassword || "Reset Password"}</span>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                {t.resetPasswordDesc || "Forgot a password? Go to Password Manager in the sidebar to reset any account password instantly."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <div className="flex gap-4">
        <Input
          placeholder={t.searchEmployees || "Search employees by name, username, email, phone, or employee number..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-[44px]"
          data-testid="input-search-employees"
        />
      </div>

      {/* Employee Cards */}
      <div className={`grid ${layout.gridCols({ desktop: 3, tablet: 2, mobile: 1 })} gap-4`}>
        {filteredUsers.map((user) => {
          const vacationRemaining = (user.vacationDaysTotal || 0) - (user.vacationDaysUsed || 0);
          
          return (
            <Card key={user.id} data-testid={`card-employee-${user.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{user.fullName}</CardTitle>
                    <CardDescription>@{user.username}</CardDescription>
                    {user.employeeNumber && (
                      <p className="text-xs text-muted-foreground mt-1">{t.employeeId || "ID"}: {user.employeeNumber}</p>
                    )}
                  </div>
                  <Badge variant={user.active ? "default" : "secondary"}>
                    {user.active ? (t.active || "Active") : (t.inactive || "Inactive")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t.role || "Role"}:</span>
                    <Badge variant="outline" className="capitalize">{user.role === 'admin' ? (t.admin || "Admin") : (t.employee || "Employee")}</Badge>
                  </div>
                  {user.hireDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t.hireDate || "Hire Date"}:</span>
                      <span>{new Date(user.hireDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {user.vacationDaysTotal !== null && user.vacationDaysTotal !== undefined && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t.vacation || "Vacation"}:</span>
                      <Badge variant="secondary">{vacationRemaining} {t.daysLeft || "days left"}</Badge>
                    </div>
                  )}
                  {user.visaStatus && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t.visa || "Visa"}:</span>
                      <Badge 
                        variant={user.visaStatus === 'valid' ? 'default' : user.visaStatus === 'expired' ? 'destructive' : 'secondary'}
                      >
                        {user.visaStatus === 'valid' ? (t.valid || "Valid") : 
                         user.visaStatus === 'expired' ? (t.expired || "Expired") : 
                         user.visaStatus === 'pending' ? (t.pending || "Pending") : 
                         (t.notApplicable || "Not Applicable")}
                      </Badge>
                    </div>
                  )}
                  {user.performanceRating && (
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t.performance || "Performance"}:</span>
                      <Badge variant="outline">{user.performanceRating}/5.00</Badge>
                    </div>
                  )}
                  {user.weeklySchedule && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t.daysOff || "Days Off"}:</span>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(user.weeklySchedule as Record<string, boolean>)
                          .filter(([_, isWorking]) => !isWorking)
                          .map(([day]) => (
                            <Badge key={day} variant="secondary" className="text-xs capitalize">
                              {(t as any)[day] || day}
                            </Badge>
                          ))}
                        {Object.values(user.weeklySchedule as Record<string, boolean>).every(v => v) && (
                          <span className="text-xs text-muted-foreground">{t.noDaysOff || "None"}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-[44px]"
                    onClick={() => handleEdit(user)}
                    data-testid={`button-edit-${user.id}`}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {t.editEmployee || "Edit"}
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-[44px]"
                        onClick={() => setUserToDelete(user)}
                        data-testid={`button-delete-${user.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isRTL ? "حذف الموظف نهائيًا" : "Delete employee permanently"}</TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.editEmployee || "Edit Employee"}</DialogTitle>
            <DialogDescription>{t.updateEmployeeInfo || "Update employee information and settings"}</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
              <TabsTrigger value="basic" className="h-[44px]">{t.basic || "Basic"}</TabsTrigger>
              <TabsTrigger value="recruitment" className="h-[44px]">{t.recruitment || "Recruitment"}</TabsTrigger>
              <TabsTrigger value="vacation" className="h-[44px]">{t.vacation || "Vacation"}</TabsTrigger>
              <TabsTrigger value="visa" className="h-[44px]">{t.visa || "Visa"}</TabsTrigger>
              <TabsTrigger value="ticket" className="h-[44px]">{t.ticket || "Ticket"}</TabsTrigger>
              <TabsTrigger value="performance" className="h-[44px]">{t.performance || "Performance"}</TabsTrigger>
              <TabsTrigger value="schedule" className="h-[44px]">
                <CalendarDays className="mr-1 h-4 w-4" />
                {t.schedule || "Schedule"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-fullName">{t.empFullName || "Full Name"}</Label>
                  <Input
                    id="edit-fullName"
                    className="h-[44px]"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    data-testid="input-edit-fullname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-username">{t.empUsername || "Username"}</Label>
                  <Input
                    id="edit-username"
                    className="h-[44px]"
                    value={formData.username}
                    disabled
                    data-testid="input-edit-username"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">{t.empEmail || "Email"}</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    className="h-[44px]"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    data-testid="input-edit-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">{t.empPhone || "Phone"}</Label>
                  <Input
                    id="edit-phone"
                    className="h-[44px]"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="input-edit-phone"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-password">{t.newPassword || "New Password"} ({t.leaveEmpty || "leave empty to keep current"})</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    className="h-[44px]"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={t.enterNewPassword || "Enter new password or leave blank"}
                    data-testid="input-edit-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">{t.role || "Role"}</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger className="h-[44px]" data-testid="select-edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">{t.employee || "Employee"}</SelectItem>
                      <SelectItem value="admin">{t.admin || "Admin"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between h-[44px]">
                <Label htmlFor="edit-active">{t.activeStatus || "Active Status"}</Label>
                <Switch
                  id="edit-active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  data-testid="switch-edit-active"
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">{t.permissions || "Permissions"}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t.permissionsDescription || "Control what actions sub-accounts can perform in each feature"}
                </p>
                
                {/* Header row */}
                <div className="grid grid-cols-[1fr,repeat(4,60px),40px] gap-2 items-center pb-2 border-b text-xs font-medium text-muted-foreground">
                  <div>{t.feature || "Feature"}</div>
                  <div className="text-center">{t.view || "View"}</div>
                  <div className="text-center">{t.add || "Add"}</div>
                  <div className="text-center">{t.edit || "Edit"}</div>
                  <div className="text-center">{t.delete || "Delete"}</div>
                  <div className="text-center">{t.all || "All"}</div>
                </div>
                
                {/* Permission rows */}
                <div className="space-y-2">
                  {VISIBLE_PERMISSIONS.map((perm) => {
                    const permValue = normalizePermission(formData.permissions[perm]);
                    return (
                      <div key={perm} className="grid grid-cols-[1fr,repeat(4,60px),40px] gap-2 items-center py-1">
                        <Label className="text-sm font-medium">{PERMISSION_LABELS[perm]}</Label>
                        {ALL_PERMISSION_ACTIONS.map((action) => (
                          <div key={action} className="flex justify-center">
                            <Checkbox
                              checked={permValue[action]}
                              onCheckedChange={() => togglePermissionAction(perm, action)}
                              data-testid={`checkbox-edit-${perm}-${action}`}
                            />
                          </div>
                        ))}
                        <div className="flex justify-center">
                          <Checkbox
                            checked={allActionsEnabled(perm)}
                            onCheckedChange={(checked) => toggleAllActions(perm, !!checked)}
                            data-testid={`checkbox-edit-${perm}-all`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recruitment" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-employeeNumber">{t.employeeNumber || "Employee Number"}</Label>
                  <Input
                    id="edit-employeeNumber"
                    className="h-[44px]"
                    value={formData.employeeNumber}
                    onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                    data-testid="input-edit-employee-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-hireDate">{t.hireDate || "Hire Date"}</Label>
                  <Input
                    id="edit-hireDate"
                    type="date"
                    className="h-[44px]"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    data-testid="input-edit-hire-date"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-recruitmentSource">{t.recruitmentSource || "Recruitment Source"}<InfoTip>{isRTL ? "كيف تم توظيف هذا الموظف." : "How this employee was recruited."}</InfoTip></Label>
                  <Select value={formData.recruitmentSource} onValueChange={(value) => setFormData({ ...formData, recruitmentSource: value })}>
                    <SelectTrigger className="h-[44px]" data-testid="select-edit-recruitment-source">
                      <SelectValue placeholder={t.selectSource || "Select source"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="referral">{t.referral || "Referral"}</SelectItem>
                      <SelectItem value="job_board">{t.jobBoard || "Job Board"}</SelectItem>
                      <SelectItem value="agency">{t.agency || "Agency"}</SelectItem>
                      <SelectItem value="walk_in">{t.walkIn || "Walk-in"}</SelectItem>
                      <SelectItem value="other">{t.other || "Other"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contractType">{t.contractType || "Contract Type"}<InfoTip>{isRTL ? "نوع عقد العمل." : "Employment contract type."}</InfoTip></Label>
                  <Select value={formData.contractType} onValueChange={(value) => setFormData({ ...formData, contractType: value })}>
                    <SelectTrigger className="h-[44px]" data-testid="select-edit-contract-type">
                      <SelectValue placeholder={t.selectType || "Select type"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">{t.fullTime || "Full Time"}</SelectItem>
                      <SelectItem value="part_time">{t.partTime || "Part Time"}</SelectItem>
                      <SelectItem value="contract">{t.contract || "Contract"}</SelectItem>
                      <SelectItem value="temporary">{t.temporary || "Temporary"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-probationEndDate">{t.probationEndDate || "Probation End Date"}<InfoTip>{isRTL ? "تاريخ انتهاء فترة التجربة." : "Date when probation period ends."}</InfoTip></Label>
                  <Input
                    id="edit-probationEndDate"
                    type="date"
                    className="h-[44px]"
                    value={formData.probationEndDate}
                    onChange={(e) => setFormData({ ...formData, probationEndDate: e.target.value })}
                    data-testid="input-edit-probation-end-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-salary">{t.monthlySalary || "Monthly Salary"} ({t.sar || "SAR"})<InfoTip>{isRTL ? "إجمالي الراتب الشهري بالريال السعودي." : "Gross monthly salary in SAR."}</InfoTip></Label>
                  <Input
                    id="edit-salary"
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-[44px]"
                    placeholder="0.00"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    data-testid="input-edit-salary"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vacation" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-vacationDaysTotal">{t.vacationDaysTotal || "Total Vacation Days"}<InfoTip>{isRTL ? "إجمالي أيام الإجازة السنوية المستحقة." : "Total annual vacation days granted."}</InfoTip></Label>
                  <Input
                    id="edit-vacationDaysTotal"
                    type="number"
                    className="h-[44px]"
                    value={formData.vacationDaysTotal}
                    onChange={(e) => setFormData({ ...formData, vacationDaysTotal: parseInt(e.target.value) || 0 })}
                    data-testid="input-edit-vacation-days-total"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-vacationDaysUsed">{t.vacationDaysUsed || "Vacation Days Used"}<InfoTip>{isRTL ? "عدد أيام الإجازة المستخدمة هذا العام." : "Vacation days already used this year."}</InfoTip></Label>
                  <Input
                    id="edit-vacationDaysUsed"
                    type="number"
                    className="h-[44px]"
                    value={formData.vacationDaysUsed}
                    onChange={(e) => setFormData({ ...formData, vacationDaysUsed: parseInt(e.target.value) || 0 })}
                    data-testid="input-edit-vacation-days-used"
                  />
                </div>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.vacationDaysRemaining || "Vacation Days Remaining"}<InfoTip>{isRTL ? "إجمالي الأيام ناقص الأيام المستخدمة." : "Total days minus used days."}</InfoTip></p>
                      <p className="text-2xl font-bold">{vacationDaysRemaining}</p>
                    </div>
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visa" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-visaNumber">{t.visaNumber || "Visa Number"}</Label>
                  <Input
                    id="edit-visaNumber"
                    className="h-[44px]"
                    value={formData.visaNumber}
                    onChange={(e) => setFormData({ ...formData, visaNumber: e.target.value })}
                    data-testid="input-edit-visa-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-visaFees">{t.visaFees || "Visa Fees"} ({t.sar || "SAR"})</Label>
                  <Input
                    id="edit-visaFees"
                    type="number"
                    step="0.01"
                    className="h-[44px]"
                    value={formData.visaFees}
                    onChange={(e) => setFormData({ ...formData, visaFees: e.target.value })}
                    data-testid="input-edit-visa-fees"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-visaExpiryDate">{t.visaExpiryDate || "Visa Expiry Date"}<InfoTip>{isRTL ? "تاريخ انتهاء صلاحية التأشيرة." : "Date the work visa expires."}</InfoTip></Label>
                  <Input
                    id="edit-visaExpiryDate"
                    type="date"
                    className="h-[44px]"
                    value={formData.visaExpiryDate}
                    onChange={(e) => setFormData({ ...formData, visaExpiryDate: e.target.value })}
                    data-testid="input-edit-visa-expiry-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-visaStatus">{t.visaStatus || "Visa Status"}<InfoTip>{isRTL ? "الحالة الحالية للتأشيرة." : "Current status of the visa."}</InfoTip></Label>
                  <Select value={formData.visaStatus} onValueChange={(value) => setFormData({ ...formData, visaStatus: value })}>
                    <SelectTrigger className="h-[44px]" data-testid="select-edit-visa-status">
                      <SelectValue placeholder={t.selectStatus || "Select status"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="valid">{t.valid || "Valid"}</SelectItem>
                      <SelectItem value="expired">{t.expired || "Expired"}</SelectItem>
                      <SelectItem value="pending">{t.pending || "Pending"}</SelectItem>
                      <SelectItem value="not_applicable">{t.notApplicable || "Not Applicable"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ticket" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-ticketAmount">{t.ticketAmount || "Ticket Amount"} ({t.sar || "SAR"})</Label>
                  <Input
                    id="edit-ticketAmount"
                    type="number"
                    step="0.01"
                    className="h-[44px]"
                    value={formData.ticketAmount}
                    onChange={(e) => setFormData({ ...formData, ticketAmount: e.target.value })}
                    data-testid="input-edit-ticket-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ticketDestination">{t.ticketDestination || "Ticket Destination"}</Label>
                  <Input
                    id="edit-ticketDestination"
                    className="h-[44px]"
                    value={formData.ticketDestination}
                    onChange={(e) => setFormData({ ...formData, ticketDestination: e.target.value })}
                    data-testid="input-edit-ticket-destination"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-ticketDate">{t.ticketDate || "Ticket Date"}</Label>
                  <Input
                    id="edit-ticketDate"
                    type="date"
                    className="h-[44px]"
                    value={formData.ticketDate}
                    onChange={(e) => setFormData({ ...formData, ticketDate: e.target.value })}
                    data-testid="input-edit-ticket-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ticketStatus">{t.ticketStatus || "Ticket Status"}<InfoTip>{isRTL ? "حالة تذكرة سفر الموظف." : "Status of the employee travel ticket."}</InfoTip></Label>
                  <Select value={formData.ticketStatus} onValueChange={(value) => setFormData({ ...formData, ticketStatus: value })}>
                    <SelectTrigger className="h-[44px]" data-testid="select-edit-ticket-status">
                      <SelectValue placeholder={t.selectStatus || "Select status"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t.pending || "Pending"}</SelectItem>
                      <SelectItem value="booked">{t.booked || "Booked"}</SelectItem>
                      <SelectItem value="used">{t.used || "Used"}</SelectItem>
                      <SelectItem value="not_applicable">{t.notApplicable || "Not Applicable"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-performanceRating">{t.performanceRating || "Performance Rating"} (0.00 - 5.00)<InfoTip>{isRTL ? "تقييم الأداء من 0 إلى 5." : "Performance rating on a 0–5 scale."}</InfoTip></Label>
                  <Input
                    id="edit-performanceRating"
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    className="h-[44px]"
                    value={formData.performanceRating}
                    onChange={(e) => setFormData({ ...formData, performanceRating: e.target.value })}
                    data-testid="input-edit-performance-rating"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastReviewDate">{t.lastReviewDate || "Last Review Date"}</Label>
                  <Input
                    id="edit-lastReviewDate"
                    type="date"
                    className="h-[44px]"
                    value={formData.lastReviewDate}
                    onChange={(e) => setFormData({ ...formData, lastReviewDate: e.target.value })}
                    data-testid="input-edit-last-review-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-performanceNotes">{t.performanceNotes || "Performance Notes"}</Label>
                <Textarea
                  id="edit-performanceNotes"
                  value={formData.performanceNotes}
                  onChange={(e) => setFormData({ ...formData, performanceNotes: e.target.value })}
                  placeholder={t.enterPerformanceNotes || "Enter performance notes and feedback"}
                  rows={4}
                  data-testid="input-edit-performance-notes"
                />
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">{t.weeklySchedule || "Weekly Schedule"}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.scheduleDescription || "Set which days the employee works. Toggle OFF for days off."}
                </p>
                <div className="space-y-3">
                  {(Object.keys(DAY_LABELS) as Array<keyof typeof DAY_LABELS>).map((day) => (
                    <div key={day} className="flex items-center justify-between h-[44px] p-3 rounded-lg border">
                      <Label htmlFor={`edit-schedule-${day}`} className="text-sm font-medium capitalize">
                        {t[day] || DAY_LABELS[day]}
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formData.weeklySchedule?.[day] ? (t.working || "Working") : (t.dayOff || "Day Off")}
                        </span>
                        <Switch
                          id={`edit-schedule-${day}`}
                          checked={formData.weeklySchedule?.[day] ?? true}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            weeklySchedule: { ...formData.weeklySchedule, [day]: checked }
                          })}
                          data-testid={`switch-edit-schedule-${day}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" className="h-[44px]" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit">
              {t.cancel || "Cancel"}
            </Button>
            <Button className="h-[44px]" onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-update-employee">
              {updateMutation.isPending ? (t.updating || "Updating...") : (t.updateEmployee || "Update Employee")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteEmployee || "Delete Employee"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteEmployeeConfirm || "Are you sure you want to delete"} <strong>{userToDelete?.fullName}</strong>?
              {" "}{t.actionCannotBeUndone || "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-[44px]" data-testid="button-cancel-delete">
              {t.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-[44px]"
              onClick={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (t.deleting || "Deleting...") : (t.delete || "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
