import { useState, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, UserCircle, Trash2, DollarSign, TrendingUp, FileDown, Banknote, ChefHat, FileText, Upload, Eye, X, Calendar, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeviceLayout } from "@/lib/mobileLayout";

interface Investor {
  id: string;
  name: string;
  nationalId?: string | null;
  contactNumber?: string | null;
  investorType: string; // "money" or "recipe"
  recipeId?: string | null;
  amountInvested: string;
  interestPercentage: string;
  monthlyEarnings?: string; // Calculated field based on net profit
  active: boolean;
  notes?: string;
  documentPath?: string | null;
  iban?: string | null;
  bankName?: string | null;
  ibanCertificateFilename?: string | null;
  agreementFilename?: string | null;
  agreementGeneratedAt?: string | null;
  signedAgreementFilename?: string | null;
  signedAgreementUploadedAt?: string | null;
  createdAt: string;
}

const SAUDI_BANKS = [
  { value: "snb", label: "Saudi National Bank (SNB)", labelAr: "البنك الأهلي السعودي" },
  { value: "alrajhi", label: "Al Rajhi Bank", labelAr: "مصرف الراجحي" },
  { value: "riyad", label: "Riyad Bank", labelAr: "بنك الرياض" },
  { value: "sabb", label: "Saudi British Bank (SABB)", labelAr: "البنك السعودي البريطاني" },
  { value: "bsf", label: "Banque Saudi Fransi", labelAr: "البنك السعودي الفرنسي" },
  { value: "anb", label: "Arab National Bank", labelAr: "البنك العربي الوطني" },
  { value: "alinma", label: "Alinma Bank", labelAr: "مصرف الإنماء" },
  { value: "aljazira", label: "Bank AlJazira", labelAr: "بنك الجزيرة" },
  { value: "albilad", label: "Bank AlBilad", labelAr: "بنك البلاد" },
  { value: "gib", label: "Gulf International Bank", labelAr: "بنك الخليج الدولي" },
  { value: "saib", label: "Saudi Investment Bank", labelAr: "البنك السعودي للاستثمار" },
  { value: "fab", label: "First Abu Dhabi Bank (FAB)", labelAr: "بنك أبوظبي الأول" },
  { value: "enbd", label: "Emirates NBD", labelAr: "الإمارات دبي الوطني" },
];

interface Transaction {
  id: number;
  amount: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface Order {
  id: number;
  total: string;
  items: Array<{ id: string; name: string; quantity: number; price: string }>;
}

interface Recipe {
  id: string;
  name: string;
  cost: string;
}

interface MenuItem {
  id: string;
  recipeId: string | null;
  portionSize: string;
}

interface Salary {
  amount: string;
}

interface ShopBill {
  amount: string;
}

type InvestorFormValues = {
  name: string;
  nationalId?: string;
  contactNumber?: string;
  investorType: string;
  recipeId?: string;
  amountInvested: string;
  interestPercentage: string;
  notes?: string;
  iban?: string;
  bankName?: string;
};

export default function Investors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [deletingInvestor, setDeletingInvestor] = useState<Investor | null>(null);
  const [uploadingDocumentFor, setUploadingDocumentFor] = useState<string | null>(null);
  const [deletingDocumentFor, setDeletingDocumentFor] = useState<Investor | null>(null);
  const [uploadingIbanCertFor, setUploadingIbanCertFor] = useState<string | null>(null);
  const [deletingIbanCertFor, setDeletingIbanCertFor] = useState<Investor | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [generatingAgreementFor, setGeneratingAgreementFor] = useState<string | null>(null);
  const [uploadingSignedFor, setUploadingSignedFor] = useState<string | null>(null);
  const [deletingSignedFor, setDeletingSignedFor] = useState<Investor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ibanCertInputRef = useRef<HTMLInputElement>(null);
  const formFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const layout = useDeviceLayout();
  const pdfLang = (language === 'Arabic' || language === 'Urdu') ? 'ar' : 'en';

  const investorFormSchema = z.object({
    name: z.string().min(1, t.investorNameRequired),
    nationalId: z.string().optional(),
    contactNumber: z.string().optional(),
    investorType: z.enum(["money", "recipe"]),
    recipeId: z.string().optional(),
    amountInvested: z.string().refine(
      (val) => {
        if (!val || val === "" || val === "0" || val === "0.00") return true; // Allow empty/zero for recipe investors
        return !isNaN(parseFloat(val)) && parseFloat(val) >= 0;
      },
      { message: t.investmentAmountMustBePositive }
    ),
    interestPercentage: z.string().min(1, t.interestPercentageRequired).refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 100;
      },
      { message: t.interestRateMustBeBetween0And100 }
    ),
    notes: z.string().optional(),
    iban: z.string().optional(),
    bankName: z.string().optional(),
  }).refine(
    (data) => {
      // If recipe type, recipeId is required
      if (data.investorType === "recipe") {
        return !!data.recipeId;
      }
      // If money type, amountInvested is required and must be > 0
      if (data.investorType === "money") {
        const amount = parseFloat(data.amountInvested || "0");
        return amount > 0;
      }
      return true;
    },
    {
      message: t.selectRecipeForRecipeInvestor || "Please select a recipe for recipe investors or enter an amount for money investors",
      path: ["recipeId"],
    }
  );

  const form = useForm<InvestorFormValues>({
    resolver: zodResolver(investorFormSchema),
    defaultValues: {
      name: "",
      nationalId: "",
      contactNumber: "+966",
      investorType: "money",
      recipeId: "",
      amountInvested: "",
      interestPercentage: "",
      notes: "",
      iban: "",
      bankName: "",
    },
  });
  
  const watchedInvestorType = form.watch("investorType");

  const { data: investors = [], isLoading } = useQuery<Investor[]>({
    queryKey: ["/api/investors"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    retry: false,
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
    retry: false,
  });

  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
    retry: false,
  });

  const { data: salaries = [] } = useQuery<Salary[]>({
    queryKey: ["/api/shop/salaries"],
    retry: false,
  });

  const { data: shopBills = [] } = useQuery<ShopBill[]>({
    queryKey: ["/api/shop/bills"],
    retry: false,
  });

  const createInvestorMutation = useMutation({
    mutationFn: async (data: InvestorFormValues) => {
      const payload = {
        name: data.name,
        nationalId: data.nationalId || null,
        contactNumber: data.contactNumber || null,
        investorType: data.investorType,
        recipeId: data.investorType === "recipe" ? data.recipeId : null,
        amountInvested: data.investorType === "recipe" ? "0.00" : parseFloat(data.amountInvested || "0").toFixed(2),
        interestPercentage: parseFloat(data.interestPercentage).toFixed(2),
        notes: data.notes,
        iban: data.iban || null,
        bankName: data.bankName || null,
      };
      return await apiRequest("POST", "/api/investors", payload);
    },
    onSuccess: async (response: any) => {
      // If there's a pending file, upload it
      if (pendingFile && response?.id) {
        try {
          const formData = new FormData();
          formData.append("document", pendingFile);
          const uploadResponse = await fetch(`/api/investors/${response.id}/document`, {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          if (!uploadResponse.ok) {
            console.error("Failed to upload document");
          }
        } catch (err) {
          console.error("Document upload error:", err);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      setOpen(false);
      form.reset();
      setPendingFile(null);
      toast({
        title: t.investorCreated || "Investor Created",
        description: t.investorCreatedDesc || "New investor has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToCreateInvestor || "Failed to Create Investor",
        description: error.message || "Could not create investor",
        variant: "destructive",
      });
    },
  });

  const updateInvestorMutation = useMutation({
    mutationFn: async (data: InvestorFormValues & { id: string }) => {
      return await apiRequest("PATCH", `/api/investors/${data.id}`, {
        name: data.name,
        nationalId: data.nationalId || null,
        contactNumber: data.contactNumber || null,
        investorType: data.investorType,
        recipeId: data.investorType === "recipe" ? data.recipeId : null,
        amountInvested: data.investorType === "recipe" ? "0.00" : parseFloat(data.amountInvested || "0").toFixed(2),
        interestPercentage: parseFloat(data.interestPercentage).toFixed(2),
        notes: data.notes,
        iban: data.iban || null,
        bankName: data.bankName || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      setOpen(false);
      setEditingInvestor(null);
      form.reset();
      toast({
        title: t.investorUpdated || "Investor Updated",
        description: t.investorUpdatedDesc || "Investor details have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToUpdateInvestor || "Failed to Update Investor",
        description: error.message || "Could not update investor",
        variant: "destructive",
      });
    },
  });

  const deleteInvestorMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/investors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      setDeletingInvestor(null);
      toast({
        title: t.investorDeleted || "Investor Deleted",
        description: t.investorDeletedDesc || "Investor has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToDeleteInvestor || "Failed to Delete Investor",
        description: error.message || "Could not delete investor",
        variant: "destructive",
      });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ investorId, file }: { investorId: string; file: File }) => {
      const formData = new FormData();
      formData.append("document", file);
      const response = await fetch(`/api/investors/${investorId}/document`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      setUploadingDocumentFor(null);
      toast({
        title: t.documentUploaded || "Document Uploaded",
        description: t.documentUploadedDesc || "Document has been uploaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToUploadDocument || "Failed to Upload Document",
        description: error.message || "Could not upload document",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (investorId: string) => {
      await apiRequest("DELETE", `/api/investors/${investorId}/document`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      setDeletingDocumentFor(null);
      toast({
        title: t.documentDeleted || "Document Deleted",
        description: t.documentDeletedDesc || "Document has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToDeleteDocument || "Failed to Delete Document",
        description: error.message || "Could not delete document",
        variant: "destructive",
      });
    },
  });

  // IBAN Certificate Mutations
  const uploadIbanCertMutation = useMutation({
    mutationFn: async ({ investorId, file }: { investorId: string; file: File }) => {
      const formData = new FormData();
      formData.append("document", file);
      const response = await fetch(`/api/investors/${investorId}/iban-certificate`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      setUploadingIbanCertFor(null);
      toast({
        title: t.ibanCertUploaded || "IBAN Certificate Uploaded",
        description: t.ibanCertUploadedDesc || "IBAN certificate has been uploaded successfully.",
      });
    },
    onError: (error: any) => {
      setUploadingIbanCertFor(null);
      toast({
        title: t.failedToUploadIbanCert || "Failed to Upload IBAN Certificate",
        description: error.message || "Could not upload IBAN certificate",
        variant: "destructive",
      });
    },
  });

  const deleteIbanCertMutation = useMutation({
    mutationFn: async (investorId: string) => {
      await apiRequest("DELETE", `/api/investors/${investorId}/iban-certificate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      setDeletingIbanCertFor(null);
      toast({
        title: t.ibanCertDeleted || "IBAN Certificate Deleted",
        description: t.ibanCertDeletedDesc || "IBAN certificate has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.failedToDeleteIbanCert || "Failed to Delete IBAN Certificate",
        description: error.message || "Could not delete IBAN certificate",
        variant: "destructive",
      });
    },
  });

  const handleIbanCertUpload = (investorId: string, file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: t.invalidFileType || "Invalid File Type",
        description: t.onlyPdfAllowed || "Only PDF files are allowed",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t.fileTooLarge || "File Too Large",
        description: t.maxFileSize10MB || "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }
    setUploadingIbanCertFor(investorId);
    uploadIbanCertMutation.mutate({ investorId, file });
  };

  const handlePreviewIbanCert = async (investor: Investor) => {
    if (investor.ibanCertificateFilename) {
      try {
        const response = await fetch(`/api/investors/${investor.id}/iban-certificate?mode=inline`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch IBAN certificate');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 5000);
      } catch (error) {
        console.error("Error previewing IBAN certificate:", error);
        toast({
          title: t.error || "Error",
          description: t.ibanCertPreviewFailed || "Could not preview the IBAN certificate.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadIbanCert = async (investor: Investor) => {
    if (investor.ibanCertificateFilename) {
      try {
        const response = await fetch(`/api/investors/${investor.id}/iban-certificate`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to download IBAN certificate');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = investor.ibanCertificateFilename || 'iban_certificate.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading IBAN certificate:", error);
        toast({
          title: t.error || "Error",
          description: t.ibanCertDownloadFailed || "Could not download the IBAN certificate.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileUpload = (investorId: string, file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        title: t.invalidFileType || "Invalid File Type",
        description: t.onlyPdfAllowed || "Only PDF files are allowed",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t.fileTooLarge || "File Too Large",
        description: t.maxFileSize10MB || "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }
    setUploadingDocumentFor(investorId);
    uploadDocumentMutation.mutate({ investorId, file });
  };

  const handlePreviewDocument = async (investor: Investor) => {
    if (investor.documentPath) {
      try {
        const response = await fetch(`/api/investors/${investor.id}/document?mode=inline`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 5000);
      } catch (error) {
        console.error("Error previewing document:", error);
        toast({
          title: t.error || "Error",
          description: t.documentPreviewFailed || "Could not preview the document.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadDocument = async (investor: Investor) => {
    if (investor.documentPath) {
      try {
        const response = await fetch(`/api/investors/${investor.id}/document`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${investor.name.replace(/[^a-zA-Z0-9]/g, '_')}_document.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: t.success || "Success",
          description: t.documentDownloaded || "Document downloaded successfully.",
        });
      } catch (error) {
        console.error("Error downloading document:", error);
        toast({
          title: t.error || "Error",
          description: t.documentDownloadFailed || "Could not download the document.",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = (data: InvestorFormValues) => {
    if (editingInvestor) {
      updateInvestorMutation.mutate({ ...data, id: editingInvestor.id });
    } else {
      createInvestorMutation.mutate(data);
    }
  };

  const handleEdit = (investor: Investor) => {
    setEditingInvestor(investor);
    form.reset({
      name: investor.name,
      nationalId: investor.nationalId || "",
      contactNumber: investor.contactNumber || "+966",
      investorType: investor.investorType || "money",
      recipeId: investor.recipeId || "",
      amountInvested: investor.amountInvested,
      interestPercentage: investor.interestPercentage,
      notes: investor.notes || "",
      iban: investor.iban || "",
      bankName: investor.bankName || "",
    });
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingInvestor(null);
      form.reset();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingInvestor(null);
    form.reset();
    setPendingFile(null);
  };

  // =========================================================================
  // Investment Agreement: per-investor generated/signed PDFs
  // (Templates are managed on the dedicated /investment-agreement-templates page.)
  // =========================================================================

  const handleGenerateAgreement = async (investor: Investor) => {
    setGeneratingAgreementFor(investor.id);
    try {
      const response = await fetch(`/api/investors/${investor.id}/agreement/pdf?lang=${pdfLang}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to generate agreement' }));
        throw new Error(err.error || 'Failed to generate agreement');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const filename = `Investment_Agreement_${investor.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ['/api/investors'] });
      toast({
        title: t.agreementGenerated || 'Agreement Generated',
        description: t.agreementGeneratedDesc || 'Investment agreement was generated and saved to the investor file.',
      });
    } catch (error: any) {
      toast({
        title: t.error || 'Error',
        description: error?.message || 'Failed to generate agreement',
        variant: 'destructive',
      });
    } finally {
      setGeneratingAgreementFor(null);
    }
  };

  const handlePreviewAgreement = async (investor: Investor) => {
    try {
      const response = await fetch(`/api/investors/${investor.id}/agreement?mode=inline`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('No agreement available');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error: any) {
      toast({
        title: t.error || 'Error',
        description: error?.message || 'Failed to preview agreement',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadSavedAgreement = async (investor: Investor) => {
    try {
      const response = await fetch(`/api/investors/${investor.id}/agreement`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('No agreement available');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = investor.agreementFilename ||
        `Investment_Agreement_${investor.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: t.error || 'Error',
        description: error?.message || 'Failed to download agreement',
        variant: 'destructive',
      });
    }
  };

  const handleSignedAgreementUpload = async (investorId: string, file: File) => {
    setUploadingSignedFor(investorId);
    try {
      const formData = new FormData();
      formData.append('document', file);
      const response = await fetch(`/api/investors/${investorId}/signed-agreement`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Upload failed');
      }
      queryClient.invalidateQueries({ queryKey: ['/api/investors'] });
      toast({
        title: t.signedAgreementUploaded || 'Signed Agreement Uploaded',
        description: t.signedAgreementUploadedDesc || 'The signed agreement has been saved to the investor file.',
      });
    } catch (error: any) {
      toast({
        title: t.error || 'Error',
        description: error?.message || 'Failed to upload signed agreement',
        variant: 'destructive',
      });
    } finally {
      setUploadingSignedFor(null);
    }
  };

  const handlePreviewSignedAgreement = async (investor: Investor) => {
    try {
      const response = await fetch(`/api/investors/${investor.id}/signed-agreement?mode=inline`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('No signed agreement available');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error: any) {
      toast({
        title: t.error || 'Error',
        description: error?.message || 'Failed to preview signed agreement',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadSignedAgreement = async (investor: Investor) => {
    try {
      const response = await fetch(`/api/investors/${investor.id}/signed-agreement`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('No signed agreement available');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = investor.signedAgreementFilename ||
        `Signed_Investment_Agreement_${investor.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: t.error || 'Error',
        description: error?.message || 'Failed to download signed agreement',
        variant: 'destructive',
      });
    }
  };

  const deleteSignedAgreementMutation = useMutation({
    mutationFn: async (investorId: string) => {
      await apiRequest('DELETE', `/api/investors/${investorId}/signed-agreement`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/investors'] });
      setDeletingSignedFor(null);
      toast({
        title: t.signedAgreementDeleted || 'Signed Agreement Deleted',
        description: t.signedAgreementDeletedDesc || 'The signed agreement has been removed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: t.error || 'Error',
        description: error?.message || 'Failed to delete signed agreement',
        variant: 'destructive',
      });
    },
  });

  const handleFormFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== "application/pdf") {
      toast({
        title: t.invalidFileType || "Invalid File Type",
        description: t.onlyPdfAllowed || "Only PDF files are allowed",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t.fileTooLarge || "File Too Large",
        description: t.maxFileSize10MB || "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }
    setPendingFile(file);
  };

  const filteredInvestors = investors.filter((investor) =>
    investor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate net profit after all costs
  const calculateNetProfit = () => {
    // Total revenue from transactions
    const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);

    // Calculate costs of goods sold (COGS) from orders
    let totalCOGS = 0;
    orders.forEach(order => {
      order.items.forEach(item => {
        const menuItem = menuItems.find(m => m.id === item.id);
        if (menuItem && menuItem.recipeId) {
          const recipe = recipes.find(r => r.id === menuItem.recipeId);
          if (recipe) {
            const recipeCost = parseFloat(recipe.cost);
            const portionSize = parseFloat(menuItem.portionSize || "1.00");
            const itemCost = recipeCost * portionSize;
            totalCOGS += itemCost * item.quantity;
          }
        }
      });
    });

    // Calculate total salaries
    const totalSalaries = salaries.reduce((sum, s) => sum + parseFloat(s.amount || "0"), 0);

    // Calculate total shop bills
    const totalShopBills = shopBills.reduce((sum, b) => sum + parseFloat(b.amount || "0"), 0);

    // Net profit = Revenue - COGS - Salaries - Shop Bills
    const netProfit = totalRevenue - totalCOGS - totalSalaries - totalShopBills;

    return netProfit;
  };

  // Calculate monthly earnings for an investor
  const calculateMonthlyEarnings = (investor: Investor) => {
    const netProfit = calculateNetProfit();
    const interestPercentage = parseFloat(investor.interestPercentage || "0");
    const monthlyEarnings = (netProfit * interestPercentage) / 100;
    return monthlyEarnings;
  };

  // Monthly Report State
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [downloadingReport, setDownloadingReport] = useState(false);

  interface MonthlyReport {
    month: number;
    year: number;
    monthName: string;
    netProfit: string;
    totalRevenue: string;
    totalCOGS: string;
    totalSalaries: string;
    totalBills: string;
    investors: Array<{
      id: string;
      name: string;
      investorType: string;
      interestPercentage: string;
      earnings: string;
      amountInvested: string;
    }>;
  }

  const { data: monthlyReport, isLoading: isLoadingReport } = useQuery<MonthlyReport>({
    queryKey: ["/api/investors/monthly-report", selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/investors/monthly-report?month=${selectedMonth}&year=${selectedYear}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch monthly report');
      return response.json();
    },
  });

  // Download monthly report as PDF
  const handleDownloadMonthlyReport = async () => {
    if (!monthlyReport || monthlyReport.investors.length === 0) return;
    
    try {
      setDownloadingReport(true);
      
      // Generate PDF using jspdf
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text(`Investor Earnings Report - ${monthlyReport.monthName} ${monthlyReport.year}`, 14, 20);
      
      // Summary
      doc.setFontSize(12);
      doc.text(`Net Profit: SAR ${parseFloat(monthlyReport.netProfit).toLocaleString()}`, 14, 35);
      
      // Table header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const startY = 50;
      doc.text('Investor Name', 14, startY);
      doc.text('Interest %', 80, startY);
      doc.text('Earnings (SAR)', 130, startY);
      
      // Table rows
      doc.setFont('helvetica', 'normal');
      let y = startY + 10;
      monthlyReport.investors.forEach((inv) => {
        doc.text(inv.name, 14, y);
        doc.text(`${inv.interestPercentage}%`, 80, y);
        doc.text(parseFloat(inv.earnings).toLocaleString(), 130, y);
        y += 8;
        
        // Add new page if needed
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
      
      // Total earnings
      const totalEarnings = monthlyReport.investors.reduce((sum, inv) => sum + parseFloat(inv.earnings), 0);
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', 14, y);
      doc.text(totalEarnings.toLocaleString(), 130, y);
      
      // Save the PDF
      doc.save(`investor-earnings-${monthlyReport.monthName}-${monthlyReport.year}.pdf`);
      
      toast({
        title: t.reportDownloaded || "Report Downloaded",
        description: t.reportDownloadedDesc || "Monthly earnings report has been downloaded.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: t.reportDownloadFailed || "Download Failed",
        description: t.reportDownloadFailedDesc || "Could not download the report.",
        variant: "destructive",
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  // Download investor statement PDF
  const [downloadingStatement, setDownloadingStatement] = useState<string | null>(null);
  
  const handleDownloadStatement = async (investor: Investor) => {
    try {
      setDownloadingStatement(investor.id);
      
      const response = await fetch(`/api/investors/${investor.id}/statement`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate statement');
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `investor-statement-${investor.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: t.statementDownloaded || "Statement Downloaded",
        description: `Statement for ${investor.name} has been downloaded.`,
      });
    } catch (error) {
      console.error("Error downloading statement:", error);
      toast({
        title: t.statementDownloadFailed || "Download Failed",
        description: "Could not download the investor statement.",
        variant: "destructive",
      });
    } finally {
      setDownloadingStatement(null);
    }
  };

  // Preview investor statement PDF
  const [previewInvestorName, setPreviewInvestorName] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  const handlePreviewStatement = async (investor: Investor) => {
    try {
      setLoadingPreview(true);
      setPreviewInvestorName(investor.name);
      
      const response = await fetch(`/api/investors/${investor.id}/statement?mode=inline`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate statement');
      }
      
      // Get the PDF blob and open in new tab (more reliable than iframe embedding)
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the blob URL after a short delay (give browser time to load)
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 5000);
    } catch (error) {
      console.error("Error previewing statement:", error);
      toast({
        title: t.statementPreviewFailed || "Preview Failed",
        description: "Could not preview the investor statement.",
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const netProfit = calculateNetProfit();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">{t.loading || "Loading..."}</div>
      </div>
    );
  }

  return (
    <div className={`${layout.padding} ${layout.spaceY}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`${layout.text3Xl} font-bold`}>{t.investors || "Investors"}</h1>
          <p className="text-muted-foreground mt-1">
            {t.manageInvestors || "Manage investors and track their earnings"}
          </p>
        </div>
        <div className={`flex flex-col sm:flex-row gap-2 ${layout.isMobile ? "w-full" : ""}`}>
          <Link href="/investment-agreement-templates">
            <Button
              variant="outline"
              className={layout.isMobile ? "w-full" : ""}
              data-testid="button-edit-agreement-template"
            >
              <FileText className="h-4 w-4 mr-2" />
              {t.editAgreementTemplate || "Edit Agreement Template"}
            </Button>
          </Link>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className={layout.isMobile ? "w-full" : ""} data-testid="button-add-investor">
              <Plus className="h-4 w-4 mr-2" />
              {t.addInvestor || "Add Investor"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInvestor
                  ? t.editInvestor || "Edit Investor"
                  : t.addInvestor || "Add Investor"}
              </DialogTitle>
              <DialogDescription>
                {editingInvestor
                  ? t.editInvestorDesc || "Update investor details."
                  : t.addInvestorDesc || "Add a new investor to track their earnings."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.investorName || "Investor Name"}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t.enterInvestorName || "Enter investor name"}
                          {...field}
                          className="h-[44px]"
                          data-testid="input-investor-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.investorNationalId || "ID (National/Iqama)"}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t.enterNationalId || "Enter ID number"}
                          {...field}
                          className="h-[44px]"
                          data-testid="input-investor-national-id"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.investorContactNumber || "Contact Number"}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+966 5XXXXXXXX"
                          {...field}
                          className="h-[44px]"
                          data-testid="input-investor-contact-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="investorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.investorType || "Investor Type"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-[44px]" data-testid="select-investor-type">
                            <SelectValue placeholder={t.selectInvestorType || "Select investor type"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="money" data-testid="option-money-investor">
                            <div className="flex items-center gap-2">
                              <Banknote className="h-4 w-4" />
                              {t.moneyInvestor || "Money Investor"}
                            </div>
                          </SelectItem>
                          <SelectItem value="recipe" data-testid="option-recipe-owner">
                            <div className="flex items-center gap-2">
                              <ChefHat className="h-4 w-4" />
                              {t.recipeOwner || "Recipe Owner"}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedInvestorType === "recipe" && (
                  <FormField
                    control={form.control}
                    name="recipeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.selectRecipe || "Select Recipe"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-[44px]" data-testid="select-recipe">
                              <SelectValue placeholder={t.selectRecipePlaceholder || "Select a recipe"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {recipes.map((recipe) => (
                              <SelectItem key={recipe.id} value={recipe.id} data-testid={`option-recipe-${recipe.id}`}>
                                {recipe.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground">
                          {t.recipeOwnerHelp || "The investor will receive a percentage of net sales from this recipe"}
                        </p>
                      </FormItem>
                    )}
                  />
                )}

                {watchedInvestorType === "money" && (
                  <FormField
                    control={form.control}
                    name="amountInvested"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.amountInvested || "Amount Invested (SAR)"}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            className="h-[44px]"
                            data-testid="input-amount-invested"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="interestPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.interestPercentage || "Interest Percentage (%)"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          className="h-[44px]"
                          data-testid="input-interest-percentage"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">
                        {t.interestPercentageHelp || "Percentage of net profit to be earned"}
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.notes || "Notes"} (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional notes"
                          {...field}
                          data-testid="input-investor-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.bankName || "Bank Name"} ({t.optional || "Optional"})</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="h-[44px]" data-testid="select-bank-name">
                            <SelectValue placeholder={t.selectBank || "Select a bank"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SAUDI_BANKS.map((bank) => (
                            <SelectItem key={bank.value} value={bank.label}>
                              {bank.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.ibanAccount || "IBAN Account"} ({t.optional || "Optional"})</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="SA0000000000000000000000"
                          {...field}
                          className="h-[44px] font-mono"
                          data-testid="input-iban"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">
                        {t.ibanHelp || "Saudi IBAN format: SA followed by 22 digits"}
                      </p>
                    </FormItem>
                  )}
                />

                {/* Transaction Document Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t.transactionDocument || "Transaction Document"} ({t.optional || "Optional"})
                  </label>
                  <input
                    ref={formFileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFormFileSelect}
                    className="hidden"
                    data-testid="input-transaction-document"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => formFileInputRef.current?.click()}
                      className="h-[44px]"
                      data-testid="button-select-document"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {t.selectPdf || "Select PDF"}
                    </Button>
                    {pendingFile && (
                      <div className="flex items-center gap-2 flex-1 bg-muted/50 rounded-md px-3 py-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm truncate flex-1">{pendingFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setPendingFile(null)}
                          data-testid="button-remove-selected-file"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t.transactionDocumentHelp || "Upload a PDF of the transaction proof (max 10MB)"}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    className="flex-1 h-[44px]"
                    data-testid="button-cancel"
                  >
                    {t.cancel || "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createInvestorMutation.isPending || updateInvestorMutation.isPending}
                    className="flex-1 h-[44px]"
                    data-testid="button-save-investor"
                  >
                    {createInvestorMutation.isPending || updateInvestorMutation.isPending
                      ? t.saving || "Saving..."
                      : editingInvestor
                        ? t.updateInvestor || "Update Investor"
                        : t.createInvestor || "Create Investor"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Net Profit Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className={layout.textXl + " font-semibold"}>{t.netProfitSummary || "Net Profit Summary"}</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="text-net-profit">
            {netProfit.toFixed(2)} {t.sar || "SAR"}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t.netProfitDesc || "Total net profit after all costs (used for investor earnings calculation)"}
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={t.searchInvestors || "Search investors..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-[44px]"
          data-testid="input-search-investors"
        />
      </div>

      {/* Investors List */}
      <div className={`grid ${layout.gridCols({ desktop: 3, tablet: 2, mobile: 1 })} gap-4`}>
        {filteredInvestors.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t.noInvestorsFound || "No investors found"}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchQuery
                  ? "Try a different search term"
                  : t.addFirstInvestor || "Add your first investor to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredInvestors.map((investor) => {
            const monthlyEarnings = calculateMonthlyEarnings(investor);
            return (
              <Card key={investor.id} data-testid={`card-investor-${investor.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <UserCircle className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{investor.name}</h3>
                            <Badge variant="outline" className="shrink-0" data-testid={`badge-investor-type-${investor.id}`}>
                              {(investor.investorType || "money") === "recipe" ? (
                                <span className="flex items-center gap-1">
                                  <ChefHat className="h-3 w-3" />
                                  {t.recipeOwner || "Recipe"}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Banknote className="h-3 w-3" />
                                  {t.moneyInvestor || "Money"}
                                </span>
                              )}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {investor.investorType === "recipe" && investor.recipeId
                              ? (recipes.find((r) => r.id === investor.recipeId)?.name || t.unknownRecipe || "Unknown Recipe")
                              : new Date(investor.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handlePreviewStatement(investor)}
                          disabled={loadingPreview && previewInvestorName === investor.name}
                          className="h-[44px] w-[44px] shrink-0 text-blue-600 hover:text-blue-700"
                          data-testid={`button-preview-statement-${investor.id}`}
                          title={t.previewStatement || "Preview Statement"}
                        >
                          <Eye className={`h-4 w-4 ${loadingPreview && previewInvestorName === investor.name ? 'animate-pulse' : ''}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownloadStatement(investor)}
                          disabled={downloadingStatement === investor.id}
                          className="h-[44px] w-[44px] shrink-0 text-primary hover:text-primary"
                          data-testid={`button-download-statement-${investor.id}`}
                          title={t.downloadStatement || "Download Statement"}
                        >
                          <FileDown className={`h-4 w-4 ${downloadingStatement === investor.id ? 'animate-pulse' : ''}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(investor)}
                          className="h-[44px] w-[44px] shrink-0"
                          data-testid={`button-edit-${investor.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingInvestor(investor)}
                          className="h-[44px] w-[44px] shrink-0 text-destructive hover:text-destructive"
                          data-testid={`button-delete-${investor.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(investor.investorType || "money") === "money" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{t.amountInvested || "Amount Invested"}</span>
                          <span className="font-medium">{parseFloat(investor.amountInvested).toFixed(2)} {t.sar || "SAR"}</span>
                        </div>
                      )}
                      {investor.investorType === "recipe" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{t.earningsSource || "Earnings Source"}</span>
                          <span className="font-medium">{t.recipeSales || "Recipe Sales"}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{investor.investorType === "recipe" ? (t.profitShare || "Profit Share") : (t.interestPercentage || "Interest %")}</span>
                        <Badge variant="secondary">{parseFloat(investor.interestPercentage).toFixed(2)}%</Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm font-medium">{t.monthlyEarnings || "Monthly Earnings"}</span>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span 
                            className="font-bold text-green-600"
                            data-testid={`text-monthly-earnings-${investor.id}`}
                          >
                            {monthlyEarnings.toFixed(2)} {t.sar || "SAR"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {investor.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">{investor.notes}</p>
                      </div>
                    )}

                    {/* Document Section */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {t.investorDocument || "Document"}
                        </span>
                      </div>
                      {investor.documentPath ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            PDF
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewDocument(investor)}
                            className="h-8"
                            data-testid={`button-preview-document-${investor.id}`}
                            title={t.previewDocument || "Preview Document"}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {t.preview || "Preview"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDocument(investor)}
                            className="h-8"
                            data-testid={`button-download-document-${investor.id}`}
                            title={t.downloadDocument || "Download Document"}
                          >
                            <FileDown className="h-3 w-3 mr-1" />
                            {t.download || "Download"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingDocumentFor(investor)}
                            className="h-8 text-destructive hover:text-destructive"
                            data-testid={`button-delete-document-${investor.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            id={`file-upload-${investor.id}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(investor.id, file);
                              }
                              e.target.value = "";
                            }}
                            data-testid={`input-file-${investor.id}`}
                          />
                          <label htmlFor={`file-upload-${investor.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 cursor-pointer"
                              disabled={uploadingDocumentFor === investor.id}
                              asChild
                            >
                              <span>
                                {uploadingDocumentFor === investor.id ? (
                                  <>{t.uploading || "Uploading..."}</>
                                ) : (
                                  <>
                                    <Upload className="h-3 w-3 mr-1" />
                                    {t.uploadPdf || "Upload PDF"}
                                  </>
                                )}
                              </span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Investment Agreement Section */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {t.investmentAgreement || "Investment Agreement"}
                      </span>
                      {investor.agreementGeneratedAt && (
                        <span className="text-xs text-muted-foreground">
                          ({new Date(investor.agreementGeneratedAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateAgreement(investor)}
                        disabled={generatingAgreementFor === investor.id}
                        className="h-8"
                        data-testid={`button-generate-agreement-${investor.id}`}
                        title={t.generateAgreement || "Generate Agreement"}
                      >
                        <FileDown className="h-3 w-3 mr-1" />
                        {generatingAgreementFor === investor.id
                          ? (t.generating || "Generating...")
                          : (t.generateAgreement || "Generate Agreement")}
                      </Button>
                      {investor.agreementFilename && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewAgreement(investor)}
                            className="h-8"
                            data-testid={`button-preview-agreement-${investor.id}`}
                            title={t.preview || "Preview"}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {t.preview || "Preview"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadSavedAgreement(investor)}
                            className="h-8"
                            data-testid={`button-download-agreement-${investor.id}`}
                            title={t.download || "Download"}
                          >
                            <FileDown className="h-3 w-3 mr-1" />
                            {t.download || "Download"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Signed Investment Agreement Section */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {t.signedAgreement || "Signed Agreement"}
                      </span>
                      {investor.signedAgreementUploadedAt && (
                        <span className="text-xs text-muted-foreground">
                          ({new Date(investor.signedAgreementUploadedAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {investor.signedAgreementFilename ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewSignedAgreement(investor)}
                            className="h-8"
                            data-testid={`button-preview-signed-agreement-${investor.id}`}
                            title={t.preview || "Preview"}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {t.preview || "Preview"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadSignedAgreement(investor)}
                            className="h-8"
                            data-testid={`button-download-signed-agreement-${investor.id}`}
                            title={t.download || "Download"}
                          >
                            <FileDown className="h-3 w-3 mr-1" />
                            {t.download || "Download"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingSignedFor(investor)}
                            className="h-8 text-destructive hover:text-destructive"
                            data-testid={`button-delete-signed-agreement-${investor.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            id={`signed-agreement-upload-${investor.id}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleSignedAgreementUpload(investor.id, file);
                              }
                              e.target.value = "";
                            }}
                            data-testid={`input-signed-agreement-${investor.id}`}
                          />
                          <label htmlFor={`signed-agreement-upload-${investor.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 cursor-pointer"
                              disabled={uploadingSignedFor === investor.id}
                              asChild
                            >
                              <span>
                                {uploadingSignedFor === investor.id ? (
                                  <>{t.uploading || "Uploading..."}</>
                                ) : (
                                  <>
                                    <Upload className="h-3 w-3 mr-1" />
                                    {t.uploadSignedAgreement || "Upload Signed"}
                                  </>
                                )}
                              </span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* IBAN Certificate Section */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t.ibanCertificate || "IBAN Certificate"}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {investor.ibanCertificateFilename ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewIbanCert(investor)}
                            className="h-8"
                            data-testid={`button-preview-iban-cert-${investor.id}`}
                            title={t.previewIbanCert || "Preview IBAN Certificate"}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {t.preview || "Preview"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadIbanCert(investor)}
                            className="h-8"
                            data-testid={`button-download-iban-cert-${investor.id}`}
                            title={t.downloadIbanCert || "Download IBAN Certificate"}
                          >
                            <FileDown className="h-3 w-3 mr-1" />
                            {t.download || "Download"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingIbanCertFor(investor)}
                            className="h-8 text-destructive hover:text-destructive"
                            data-testid={`button-delete-iban-cert-${investor.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            id={`iban-cert-upload-${investor.id}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleIbanCertUpload(investor.id, file);
                              }
                              e.target.value = "";
                            }}
                            data-testid={`input-iban-cert-${investor.id}`}
                          />
                          <label htmlFor={`iban-cert-upload-${investor.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 cursor-pointer"
                              disabled={uploadingIbanCertFor === investor.id}
                              asChild
                            >
                              <span>
                                {uploadingIbanCertFor === investor.id ? (
                                  <>{t.uploading || "Uploading..."}</>
                                ) : (
                                  <>
                                    <Upload className="h-3 w-3 mr-1" />
                                    {t.uploadIbanCert || "Upload Certificate"}
                                  </>
                                )}
                              </span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Monthly Investor Earnings Card */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <div>
            <h2 className={`${layout.textXl} font-bold flex items-center gap-2`}>
              <Calendar className="h-5 w-5" />
              {t.monthlyInvestorEarnings || "Monthly Investor Earnings"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t.monthlyInvestorEarningsDesc || "View earnings breakdown for each investor by month"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(val) => setSelectedMonth(parseInt(val))}
            >
              <SelectTrigger className="w-[140px] h-[44px]" data-testid="select-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t.january || "January"}</SelectItem>
                <SelectItem value="2">{t.february || "February"}</SelectItem>
                <SelectItem value="3">{t.march || "March"}</SelectItem>
                <SelectItem value="4">{t.april || "April"}</SelectItem>
                <SelectItem value="5">{t.may || "May"}</SelectItem>
                <SelectItem value="6">{t.june || "June"}</SelectItem>
                <SelectItem value="7">{t.july || "July"}</SelectItem>
                <SelectItem value="8">{t.august || "August"}</SelectItem>
                <SelectItem value="9">{t.september || "September"}</SelectItem>
                <SelectItem value="10">{t.october || "October"}</SelectItem>
                <SelectItem value="11">{t.november || "November"}</SelectItem>
                <SelectItem value="12">{t.december || "December"}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedYear.toString()}
              onValueChange={(val) => setSelectedYear(parseInt(val))}
            >
              <SelectTrigger className="w-[100px] h-[44px]" data-testid="select-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...Array(5)].map((_, i) => {
                  const year = currentDate.getFullYear() - 2 + i;
                  return (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleDownloadMonthlyReport}
              disabled={downloadingReport || !monthlyReport?.investors?.length}
              data-testid="button-download-monthly-report"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloadingReport ? (t.downloading || "Downloading...") : (t.downloadPdf || "Download PDF")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingReport ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">{t.loading || "Loading..."}</div>
            </div>
          ) : monthlyReport ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">{t.netProfit || "Net Profit"}</div>
                  <div className={`text-lg font-bold ${parseFloat(monthlyReport.netProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    SAR {parseFloat(monthlyReport.netProfit).toLocaleString()}
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">{t.totalRevenue || "Total Revenue"}</div>
                  <div className="text-lg font-bold">SAR {parseFloat(monthlyReport.totalRevenue).toLocaleString()}</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">{t.totalCOGS || "Total COGS"}</div>
                  <div className="text-lg font-bold">SAR {parseFloat(monthlyReport.totalCOGS).toLocaleString()}</div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">{t.totalExpenses || "Total Expenses"}</div>
                  <div className="text-lg font-bold">
                    SAR {(parseFloat(monthlyReport.totalSalaries) + parseFloat(monthlyReport.totalBills)).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Earnings Table */}
              {monthlyReport.investors.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.investorName || "Investor Name"}</TableHead>
                        <TableHead className="text-center">{t.type || "Type"}</TableHead>
                        <TableHead className="text-right">{t.interestPercentage || "Interest %"}</TableHead>
                        <TableHead className="text-right">{t.monthlyEarnings || "Monthly Earnings"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyReport.investors.map((inv) => (
                        <TableRow key={inv.id} data-testid={`row-investor-earnings-${inv.id}`}>
                          <TableCell className="font-medium">{inv.name}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-xs">
                              {inv.investorType === 'money' ? (
                                <><Banknote className="h-3 w-3 mr-1" />{t.money || "Money"}</>
                              ) : (
                                <><ChefHat className="h-3 w-3 mr-1" />{t.recipe || "Recipe"}</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{inv.interestPercentage}%</TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={parseFloat(inv.earnings) > 0 ? 'text-green-600' : ''}>
                              SAR {parseFloat(inv.earnings).toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Total Row */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={3} className="text-right">{t.total || "Total"}:</TableCell>
                        <TableCell className="text-right">
                          <span className="text-green-600">
                            SAR {monthlyReport.investors.reduce((sum, inv) => sum + parseFloat(inv.earnings), 0).toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t.noActiveInvestors || "No active investors found"}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t.selectMonthToViewEarnings || "Select a month to view earnings"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={!!deletingDocumentFor} onOpenChange={() => setDeletingDocumentFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDeleteDocument || "Delete Document"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDeleteDocumentDesc || `Are you sure you want to delete the document for ${deletingDocumentFor?.name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-[44px]" data-testid="button-cancel-delete-document">
              {t.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDocumentFor && deleteDocumentMutation.mutate(deletingDocumentFor.id)}
              className="h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-document"
            >
              {t.delete || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete IBAN Certificate Confirmation Dialog */}
      <AlertDialog open={!!deletingIbanCertFor} onOpenChange={() => setDeletingIbanCertFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDeleteIbanCert || "Delete IBAN Certificate"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDeleteIbanCertDesc || `Are you sure you want to delete the IBAN certificate for ${deletingIbanCertFor?.name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-[44px]" data-testid="button-cancel-delete-iban-cert">
              {t.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingIbanCertFor && deleteIbanCertMutation.mutate(deletingIbanCertFor.id)}
              className="h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-iban-cert"
            >
              {t.delete || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Signed Agreement Confirmation Dialog */}
      <AlertDialog open={!!deletingSignedFor} onOpenChange={() => setDeletingSignedFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.confirmDeleteSignedAgreement || "Delete Signed Agreement"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDeleteSignedAgreementDesc ||
                `Are you sure you want to delete the signed agreement for ${deletingSignedFor?.name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-[44px]" data-testid="button-cancel-delete-signed">
              {t.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSignedFor && deleteSignedAgreementMutation.mutate(deletingSignedFor.id)}
              className="h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-signed"
            >
              {t.delete || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingInvestor} onOpenChange={() => setDeletingInvestor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete || "Confirm Delete"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDeleteInvestorDesc || `Are you sure you want to delete ${deletingInvestor?.name}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-[44px]" data-testid="button-cancel-delete">
              {t.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingInvestor && deleteInvestorMutation.mutate(deletingInvestor.id)}
              className="h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {t.delete || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
