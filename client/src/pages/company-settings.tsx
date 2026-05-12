import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileText, Building2, ScrollText, Save, FolderOpen, Info, Upload, Download, Trash2 } from "lucide-react";

export default function CompanySettingsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [agreementTemplate, setAgreementTemplate] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const { data: settings, isLoading } = useQuery<any>({
    queryKey: ["/api/company-settings"],
  });

  useEffect(() => {
    if (settings && settings.id) {
      setCompanyName(settings.companyName || "");
      setCompanyEmail(settings.companyEmail || "");
      setCompanyPhone(settings.companyPhone || "");
      setCompanyAddress(settings.companyAddress || "");
      setAgreementTemplate(settings.agreementTemplate || "");
      setTermsAndConditions(settings.termsAndConditions || "");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", "/api/company-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      toast({
        title: t.settingsSaved || "Settings Saved",
        description: t.settingsSavedDesc || "Company settings have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveCompanyInfo = () => {
    saveMutation.mutate({ companyName, companyEmail, companyPhone, companyAddress });
  };

  const handleSaveTemplate = () => {
    saveMutation.mutate({ agreementTemplate });
  };

  const handleSaveTerms = () => {
    saveMutation.mutate({ termsAndConditions });
  };

  const uploadDocMutation = useMutation({
    mutationFn: async (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const result = await apiRequest("POST", "/api/company-settings/documents", {
              name: file.name,
              type: file.type,
              size: file.size,
              content: reader.result as string,
            });
            resolve(result);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      toast({
        title: t.documentUploaded || "Document Uploaded",
        description: t.documentUploadedDesc || "Document has been uploaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({ title: t.error, description: error.message, variant: "destructive" });
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      return await apiRequest("DELETE", `/api/company-settings/documents/${docId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      toast({
        title: t.documentDeleted || "Document Deleted",
        description: t.documentDeletedDesc || "Document has been removed.",
      });
    },
    onError: (error: any) => {
      toast({ title: t.error, description: error.message, variant: "destructive" });
    },
  });

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: t.error, description: `Invalid file type: ${file.name}`, variant: "destructive" });
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: t.error, description: `File too large: ${file.name} (max 10MB)`, variant: "destructive" });
        continue;
      }
      uploadDocMutation.mutate(file);
    }
  };

  const downloadDocument = (doc: any) => {
    const link = document.createElement("a");
    link.href = doc.content;
    link.download = doc.name;
    link.click();
  };

  const documents = Array.isArray(settings?.companyDocuments) ? settings.companyDocuments : [];

  const placeholders = [
    { key: "{{clientName}}", desc: "Client name / اسم العميل" },
    { key: "{{clientPhone}}", desc: "Client phone / هاتف العميل" },
    { key: "{{clientEmail}}", desc: "Client email / بريد العميل الإلكتروني" },
    { key: "{{clientCrNumber}}", desc: "Client CR / National ID / السجل التجاري أو الهوية الوطنية للعميل" },
    { key: "{{clientVatNumber}}", desc: "Client VAT number / الرقم الضريبي للعميل" },
    { key: "{{clientAddress}}", desc: "Client address / عنوان العميل" },
    { key: "{{clientLegalRepresentative}}", desc: "Client legal representative / الممثل القانوني للعميل" },
    { key: "{{projectName}}", desc: t.placeholderProjectName || "Project name" },
    { key: "{{projectNumber}}", desc: t.placeholderProjectNumber || "Project number" },
    { key: "{{totalAmount}}", desc: t.placeholderTotalAmount || "Total amount" },
    { key: "{{startDate}}", desc: t.placeholderStartDate || "Project start date" },
    { key: "{{endDate}}", desc: t.placeholderEndDate || "Project end date" },
    { key: "{{companyName}}", desc: t.placeholderCompanyName || "Your company name" },
    { key: "{{companyAddress}}", desc: t.placeholderCompanyAddress || "Your company address" },
    { key: "{{companyPhone}}", desc: t.placeholderCompanyPhone || "Your company phone" },
    { key: "{{companyEmail}}", desc: t.placeholderCompanyEmail || "Your company email" },
    { key: "{{date}}", desc: t.placeholderCurrentDate || "Current date" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full" data-testid="page-company-settings">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            {t.companySettings || "Company Settings"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.companySettingsDesc || "Manage your company information, agreement templates, and terms."}
          </p>
        </div>
      </div>

      <Tabs defaultValue="company-info" className="space-y-4">
        <TabsList data-testid="tabs-company-settings">
          <TabsTrigger value="company-info" data-testid="tab-company-info">
            <Building2 className="h-4 w-4 mr-2" />
            {t.companyInfo || "Company Info"}
          </TabsTrigger>
          <TabsTrigger value="agreement" data-testid="tab-agreement">
            <FileText className="h-4 w-4 mr-2" />
            {t.agreementTemplate || "Agreement Template"}
          </TabsTrigger>
          <TabsTrigger value="terms" data-testid="tab-terms">
            <ScrollText className="h-4 w-4 mr-2" />
            {t.termsConditions || "Terms & Conditions"}
          </TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">
            <FolderOpen className="h-4 w-4 mr-2" />
            {t.companyDocuments || "Documents"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company-info">
          <Card>
            <CardHeader>
              <CardTitle>{t.companyInformation || "Company Information"}</CardTitle>
              <CardDescription>
                {t.companyInfoDesc || "Basic information about your company used in documents and communications."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">{t.companyName || "Company Name"}</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t.enterCompanyName || "Enter company name"}
                  data-testid="input-company-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">{t.companyEmail || "Company Email"}</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder={t.enterCompanyEmail || "Enter company email"}
                  data-testid="input-company-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">{t.companyPhone || "Company Phone"}</Label>
                <Input
                  id="companyPhone"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder={t.enterCompanyPhone || "Enter company phone"}
                  data-testid="input-company-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">{t.companyAddress || "Company Address"}</Label>
                <Textarea
                  id="companyAddress"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder={t.enterCompanyAddress || "Enter company address"}
                  rows={3}
                  data-testid="input-company-address"
                />
              </div>
              <Button
                onClick={handleSaveCompanyInfo}
                disabled={saveMutation.isPending}
                data-testid="button-save-company-info"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? (t.saving || "Saving...") : (t.saveChanges || "Save Changes")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agreement">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.agreementTemplate || "Agreement Template"}</CardTitle>
                <CardDescription>
                  {t.agreementTemplateDesc || "Define the template for client agreements. Use placeholders that will be replaced with actual values."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={agreementTemplate}
                  onChange={(e) => setAgreementTemplate(e.target.value)}
                  placeholder={t.enterAgreementTemplate || "Enter your agreement template text here..."}
                  rows={12}
                  className="font-mono text-sm"
                  data-testid="input-agreement-template"
                />
                <Button
                  onClick={handleSaveTemplate}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-agreement"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? (t.saving || "Saving...") : (t.saveChanges || "Save Changes")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  {t.availablePlaceholders || "Available Placeholders"}
                </CardTitle>
                <CardDescription>
                  {t.placeholdersDesc || "These placeholders will be automatically replaced with actual values when generating agreements."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {placeholders.map((p) => (
                    <Badge
                      key={p.key}
                      variant="secondary"
                      className="font-mono text-xs"
                      data-testid={`badge-placeholder-${p.key.replace(/[{}]/g, '')}`}
                    >
                      {p.key}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 space-y-1">
                  {placeholders.map((p) => (
                    <div key={p.key} className="flex items-center gap-2 text-sm" data-testid={`text-placeholder-desc-${p.key.replace(/[{}]/g, '')}`}>
                      <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{p.key}</code>
                      <span className="text-muted-foreground">- {p.desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle>{t.termsConditions || "Terms & Conditions"}</CardTitle>
              <CardDescription>
                {t.termsDesc || "Define the terms and conditions that will be included in your agreements and quotations."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder={t.enterTerms || "Enter your terms and conditions here..."}
                rows={12}
                className="text-sm"
                data-testid="input-terms-conditions"
              />
              <Button
                onClick={handleSaveTerms}
                disabled={saveMutation.isPending}
                data-testid="button-save-terms"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? (t.saving || "Saving...") : (t.saveChanges || "Save Changes")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FolderOpen className="h-5 w-5" />{t.companyDocuments || "Company Documents"}</CardTitle>
              <CardDescription>{t.companyDocumentsDesc || "Upload and manage company logos, letterheads, and certificates."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-md p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileUpload(e.dataTransfer.files); }}
                data-testid="dropzone-documents"
              >
                <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">{t.dragDropFiles || "Drag & drop files here"}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.supportedFormats || "PDF, JPEG, PNG, GIF, WebP (max 10MB)"}</p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => document.getElementById('doc-upload-input')?.click()}
                  data-testid="button-browse-files"
                >
                  {t.browseFiles || "Browse Files"}
                </Button>
                <input
                  id="doc-upload-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  data-testid="input-file-upload"
                />
              </div>

              {documents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">{t.uploadedDocuments || "Uploaded Documents"} ({documents.length})</h4>
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between gap-2 p-3 border rounded-md" data-testid={`document-${doc.id}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''} 
                            {doc.uploadedAt ? ` • ${new Date(doc.uploadedAt).toLocaleDateString()}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => downloadDocument(doc)} data-testid={`button-download-doc-${doc.id}`}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteDocMutation.mutate(doc.id)} data-testid={`button-delete-doc-${doc.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
