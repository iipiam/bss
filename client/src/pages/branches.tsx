import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Edit, MapPin, Phone, Users } from "lucide-react";

const branches = [
  {
    id: 1,
    name: "Main Branch",
    location: "King Fahd Road, Riyadh",
    phone: "+966 11 234 5678",
    manager: "Ahmed Al-Rashid",
    staff: 24,
    status: "Active",
    todaySales: 6850,
    todayOrders: 47,
  },
  {
    id: 2,
    name: "Al Khobar Branch",
    location: "Corniche Road, Al Khobar",
    phone: "+966 13 345 6789",
    manager: "Mohammed Al-Qahtani",
    staff: 18,
    status: "Active",
    todaySales: 4920,
    todayOrders: 35,
  },
  {
    id: 3,
    name: "Jeddah Branch",
    location: "Tahlia Street, Jeddah",
    phone: "+966 12 456 7890",
    manager: "Khalid Al-Maliki",
    staff: 20,
    status: "Active",
    todaySales: 5340,
    todayOrders: 38,
  },
];

export default function Branches() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Branch Management</h1>
          <p className="text-muted-foreground">Manage your restaurant locations</p>
        </div>
        <Button data-testid="button-add-branch">
          <Plus className="h-4 w-4 mr-2" />
          Add Branch
        </Button>
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
                <Button variant="outline" data-testid={`button-edit-branch-${branch.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Branch
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <p className="font-medium font-mono">{branch.staff} employees</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-md bg-secondary/30">
                  <p className="text-sm text-muted-foreground mb-1">Today's Sales</p>
                  <p className="text-2xl font-bold font-mono text-primary">{branch.todaySales.toLocaleString()} SAR</p>
                </div>

                <div className="p-4 rounded-md bg-secondary/30">
                  <p className="text-sm text-muted-foreground mb-1">Today's Orders</p>
                  <p className="text-2xl font-bold font-mono">{branch.todayOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
