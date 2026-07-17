import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap, CheckCircle2, Copy, Database, Mail, CreditCard, Shield,
  Terminal, Stethoscope, AlertTriangle, KeyRound, Server, FileCheck, Network,
} from "lucide-react";

function CopyButton({ value }: { value: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onCopy}
      data-testid="button-copy-command"
      aria-label="Copy"
    >
      {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function CommandBlock({ commands }: { commands: { cmd: string; note?: string }[] }) {
  return (
    <div className="space-y-2">
      {commands.map((c, i) => (
        <div key={i} className="space-y-1">
          {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 pl-3 pr-1 py-1" data-testid={`row-command-${i}`}>
            <code className="flex-1 font-mono text-xs md:text-sm overflow-x-auto whitespace-pre">{c.cmd}</code>
            <CopyButton value={c.cmd} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CheckItem({ text, hint }: { text: string; hint?: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm">{text}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
    </li>
  );
}

function EnvVar({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 flex-wrap">
      <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{name}</code>
      <span className="text-xs text-muted-foreground flex-1 min-w-[12rem] text-right">{desc}</span>
    </div>
  );
}

export default function ITTutorial() {
  const { isRTL } = useLanguage();
  const tr = (en: string, ar: string) => (isRTL ? ar : en);

  return (
    <div className="h-full overflow-auto p-6" data-testid="page-it-tutorial">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold" data-testid="text-title">
              {tr("IT Operations Guide", "دليل عمليات تقنية المعلومات")}
            </h1>
          </div>
          <p className="text-muted-foreground" data-testid="text-subtitle">
            {tr(
              "Everything an IT account needs: pre-flight checks, integration setup, deployment commands, and how to use the inspection tools. This page is visible to IT accounts only.",
              "كل ما يحتاجه حساب تقنية المعلومات: الفحوصات الأولية، إعداد التكاملات، أوامر النشر، وكيفية استخدام أدوات الفحص. هذه الصفحة مرئية لحسابات تقنية المعلومات فقط.",
            )}
          </p>
        </div>

        <Tabs defaultValue="checks" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="checks" data-testid="tab-checks">
              <CheckCircle2 className="h-4 w-4 mr-2" />{tr("Checks", "الفحوصات")}
            </TabsTrigger>
            <TabsTrigger value="integrations" data-testid="tab-integrations">
              <Network className="h-4 w-4 mr-2" />{tr("Integrations", "التكاملات")}
            </TabsTrigger>
            <TabsTrigger value="commands" data-testid="tab-commands">
              <Terminal className="h-4 w-4 mr-2" />{tr("Commands", "الأوامر")}
            </TabsTrigger>
            <TabsTrigger value="inspection" data-testid="tab-inspection">
              <Stethoscope className="h-4 w-4 mr-2" />{tr("Inspection Tools", "أدوات الفحص")}
            </TabsTrigger>
            <TabsTrigger value="troubleshooting" data-testid="tab-troubleshooting">
              <AlertTriangle className="h-4 w-4 mr-2" />{tr("Troubleshooting", "حل المشاكل")}
            </TabsTrigger>
          </TabsList>

          {/* ===================== CHECKS ===================== */}
          <TabsContent value="checks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />{tr("Daily / Startup Health Checks", "فحوصات الصحة اليومية / عند الإقلاع")}
                </CardTitle>
                <CardDescription>
                  {tr("Run through these every morning and after each deployment.", "راجع هذه القائمة كل صباح وبعد كل عملية نشر.")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <CheckItem
                    text={tr("Server is online and responding.", "الخادم متصل ويستجيب.")}
                    hint={tr("Inspection Tools → Overview → Server Status shows \"Online\".", "أدوات الفحص ← نظرة عامة ← حالة الخادم تظهر \"متصل\".")}
                  />
                  <CheckItem
                    text={tr("Database is reachable with low latency.", "قاعدة البيانات متاحة بزمن استجابة منخفض.")}
                    hint={tr("Inspection Tools → Overview → Database card is green (latency < 100ms is healthy).", "بطاقة قاعدة البيانات خضراء (زمن استجابة أقل من 100 مللي ثانية يعتبر سليماً).")}
                  />
                  <CheckItem
                    text={tr("Memory usage is within a safe range.", "استخدام الذاكرة ضمن النطاق الآمن.")}
                    hint={tr("Watch the Memory card; a steadily climbing heap can mean a leak.", "راقب بطاقة الذاكرة؛ الارتفاع المستمر قد يعني تسرباً.")}
                  />
                  <CheckItem
                    text={tr("All required environment variables are set.", "جميع متغيرات البيئة المطلوبة مضبوطة.")}
                    hint={tr("See the Integrations tab for the full list per service.", "راجع تبويب التكاملات للقائمة الكاملة لكل خدمة.")}
                  />
                  <CheckItem
                    text={tr("Sessions look normal (no sudden spikes).", "الجلسات تبدو طبيعية (بدون ارتفاعات مفاجئة).")}
                    hint={tr("Inspection Tools → Overview → Active Sessions.", "أدوات الفحص ← نظرة عامة ← الجلسات النشطة.")}
                  />
                  <CheckItem
                    text={tr("No new browser console errors.", "لا توجد أخطاء جديدة في وحدة تحكم المتصفح.")}
                    hint={tr("Inspection Tools → Browser Errors tab.", "أدوات الفحص ← تبويب أخطاء المتصفح.")}
                  />
                  <CheckItem
                    text={tr("Delivery fee parity passes 6/6.", "تطابق رسوم التوصيل يجتاز 6/6.")}
                    hint={tr("Inspection Tools → Delivery Parity → Run parity check.", "أدوات الفحص ← تطابق التوصيل ← تشغيل فحص التطابق.")}
                  />
                  <CheckItem
                    text={tr("ZATCA environment matches the Fatoora portal.", "بيئة ZATCA تطابق بوابة فاتورة.")}
                    hint={tr("ZATCA Settings → Environment must equal the portal you got the OTP from (sandbox / simulation / production).", "إعدادات ZATCA ← البيئة يجب أن تساوي البوابة التي حصلت منها على رمز OTP.")}
                  />
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />{tr("Before You Go Live (Deployment Checklist)", "قبل الإطلاق (قائمة فحص النشر)")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <CheckItem text={tr("Latest code pulled and built without errors.", "تم سحب أحدث كود وبناؤه بدون أخطاء.")} />
                  <CheckItem text={tr("Database schema pushed (drizzle) and migrations applied.", "تم دفع مخطط قاعدة البيانات (drizzle) وتطبيق الترحيلات.")} />
                  <CheckItem text={tr("Secrets present in the production environment, not committed to git.", "الأسرار موجودة في بيئة الإنتاج وليست في git.")} />
                  <CheckItem text={tr("ZATCA set to production with a valid production CSID.", "ZATCA مضبوطة على الإنتاج مع CSID إنتاج صالح.")} />
                  <CheckItem text={tr("Process manager restarted and process is online.", "تمت إعادة تشغيل مدير العمليات والعملية متصلة.")} />
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== INTEGRATIONS ===================== */}
          <TabsContent value="integrations" className="space-y-4">
            <Alert>
              <KeyRound className="h-4 w-4" />
              <AlertTitle>{tr("Manage secrets safely", "إدارة الأسرار بأمان")}</AlertTitle>
              <AlertDescription>
                {tr(
                  "Set every value below as an environment variable / secret on the server. Never hard-code them or commit them to git.",
                  "اضبط كل قيمة أدناه كمتغير بيئة / سر على الخادم. لا تكتبها داخل الكود أبداً ولا ترفعها إلى git.",
                )}
              </AlertDescription>
            </Alert>

            <Accordion type="single" collapsible className="space-y-2">
              {/* DATABASE */}
              <AccordionItem value="database" className="border rounded-md px-4" data-testid="accordion-database">
                <AccordionTrigger className="hover:no-underline">
                  <span className="flex items-center gap-2 font-semibold">
                    <Database className="h-4 w-4" />{tr("Database — PostgreSQL (AWS RDS)", "قاعدة البيانات — PostgreSQL (AWS RDS)")}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    {tr(
                      "Production data lives in AWS RDS PostgreSQL with SSL. The app connects through node-postgres and uses Drizzle ORM.",
                      "بيانات الإنتاج في AWS RDS PostgreSQL مع SSL. يتصل التطبيق عبر node-postgres ويستخدم Drizzle ORM.",
                    )}
                  </p>
                  <div className="rounded-md border p-3">
                    <p className="text-xs font-semibold mb-1">{tr("Environment variables", "متغيرات البيئة")}</p>
                    <EnvVar name="DATABASE_URL" desc={tr("Full Postgres connection string (with SSL).", "سلسلة اتصال Postgres كاملة (مع SSL).")} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2">{tr("Setup / verify steps", "خطوات الإعداد / التحقق")}</p>
                    <CommandBlock commands={[
                      { note: tr("Push the schema to the database (creates/updates tables).", "ادفع المخطط إلى قاعدة البيانات (ينشئ/يحدّث الجداول)."), cmd: "npm run db:push" },
                      { note: tr("Force-push if a column rename is blocked.", "ادفع بالقوة إذا تعذّر تغيير اسم عمود."), cmd: "npm run db:push -- --force" },
                    ]} />
                    <p className="text-xs text-muted-foreground mt-2">
                      {tr("Verify the live connection in Inspection Tools → Overview (Database card) and browse tables in the Database tab.",
                        "تحقق من الاتصال الحي في أدوات الفحص ← نظرة عامة (بطاقة قاعدة البيانات) وتصفّح الجداول في تبويب قاعدة البيانات.")}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* EMAIL */}
              <AccordionItem value="email" className="border rounded-md px-4" data-testid="accordion-email">
                <AccordionTrigger className="hover:no-underline">
                  <span className="flex items-center gap-2 font-semibold">
                    <Mail className="h-4 w-4" />{tr("Email — Resend / SMTP", "البريد الإلكتروني — Resend / SMTP")}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    {tr(
                      "Email is used for password recovery and invoice delivery. The provider is selected by EMAIL_PROVIDER (Resend API or classic SMTP).",
                      "يُستخدم البريد لاستعادة كلمة المرور وإرسال الفواتير. يتم اختيار المزوّد عبر EMAIL_PROVIDER (واجهة Resend أو SMTP التقليدي).",
                    )}
                  </p>
                  <div className="rounded-md border p-3">
                    <p className="text-xs font-semibold mb-1">{tr("Environment variables", "متغيرات البيئة")}</p>
                    <EnvVar name="EMAIL_PROVIDER" desc={tr("'resend' or 'smtp'.", "'resend' أو 'smtp'.")} />
                    <EnvVar name="RESEND_API_KEY" desc={tr("Required when provider is Resend.", "مطلوب عند استخدام Resend.")} />
                    <EnvVar name="SMTP_HOST / SMTP_PORT" desc={tr("Required when provider is SMTP.", "مطلوب عند استخدام SMTP.")} />
                    <EnvVar name="SMTP_USER / SMTP_PASSWORD" desc={tr("SMTP credentials.", "بيانات اعتماد SMTP.")} />
                    <EnvVar name="EMAIL_FROM" desc={tr("Verified sender address.", "عنوان المرسل الموثّق.")} />
                    <EnvVar name="IT_EMAIL" desc={tr("Inbox that receives IT/support notifications.", "البريد الذي يستقبل إشعارات الدعم/تقنية المعلومات.")} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tr("Test it end-to-end by triggering a password recovery email, then confirm delivery.",
                      "اختبره من البداية للنهاية بتشغيل بريد استعادة كلمة المرور ثم تأكيد الوصول.")}
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* PAYMENTS */}
              <AccordionItem value="payments" className="border rounded-md px-4" data-testid="accordion-payments">
                <AccordionTrigger className="hover:no-underline">
                  <span className="flex items-center gap-2 font-semibold">
                    <CreditCard className="h-4 w-4" />{tr("Payments — Geidea", "المدفوعات — جيديا")}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    {tr(
                      "Geidea handles signup and subscription payments with secure tokenization and server-to-server verification.",
                      "تتولى جيديا مدفوعات التسجيل والاشتراك مع ترميز آمن وتحقق من خادم إلى خادم.",
                    )}
                  </p>
                  <div className="rounded-md border p-3">
                    <p className="text-xs font-semibold mb-1">{tr("Environment variables", "متغيرات البيئة")}</p>
                    <EnvVar name="GEIDEA_PUBLIC_KEY" desc={tr("Merchant public key.", "المفتاح العام للتاجر.")} />
                    <EnvVar name="GEIDEA_API_PASSWORD" desc={tr("Merchant API password (secret).", "كلمة مرور واجهة التاجر (سر).")} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tr("Validate a test subscription end-to-end and confirm the server-side verification + callback complete.",
                      "تحقق من اشتراك تجريبي كامل وتأكد من اكتمال التحقق من جهة الخادم ومعالجة الـ callback.")}
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* ZATCA */}
              <AccordionItem value="zatca" className="border rounded-md px-4" data-testid="accordion-zatca">
                <AccordionTrigger className="hover:no-underline">
                  <span className="flex items-center gap-2 font-semibold">
                    <Shield className="h-4 w-4" />{tr("ZATCA E-Invoicing (Phase 2)", "ZATCA الفوترة الإلكترونية (المرحلة 2)")}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    {tr(
                      "Full onboarding is done from the ZATCA Settings page. Follow the steps in order — each one depends on the previous.",
                      "تتم عملية الإعداد الكاملة من صفحة إعدادات ZATCA. اتبع الخطوات بالترتيب — كل خطوة تعتمد على ما قبلها.",
                    )}
                  </p>
                  <ol className="space-y-3">
                    {[
                      tr("Pick the Environment (sandbox / simulation / production). It must match the Fatoora portal you log into.",
                        "اختر البيئة (sandbox / simulation / production). يجب أن تطابق بوابة فاتورة التي تسجّل الدخول إليها."),
                      tr("Fill the CSR Configuration: Common Name, Serial Number, Commercial Registration (e.g. 1-... | 2-... | 3-...), VAT number, and address fields.",
                        "املأ إعدادات CSR: الاسم الشائع، الرقم التسلسلي، السجل التجاري (مثال 1-... | 2-... | 3-...)، الرقم الضريبي، وحقول العنوان."),
                      tr("Generate the CSR — this creates the private key + signing request.",
                        "أنشئ CSR — يُنشئ المفتاح الخاص وطلب التوقيع."),
                      tr("Get a fresh OTP from the Fatoora portal (same environment). OTPs expire quickly and are single-use.",
                        "احصل على رمز OTP جديد من بوابة فاتورة (نفس البيئة). تنتهي صلاحية الرموز بسرعة وتُستخدم مرة واحدة."),
                      tr("Onboard with the OTP to receive the Compliance CSID.",
                        "أكمل الإعداد باستخدام OTP لاستلام Compliance CSID."),
                      tr("Submit the compliance test invoices to pass compliance checks.",
                        "أرسل فواتير الامتثال التجريبية لاجتياز فحوصات الامتثال."),
                      tr("Receive the Production CSID, then use Clearance (standard) and Reporting (simplified) for live invoices.",
                        "استلم Production CSID، ثم استخدم Clearance (قياسية) وReporting (مبسطة) للفواتير الحية."),
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                        <p className="text-sm pt-0.5">{step}</p>
                      </li>
                    ))}
                  </ol>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold mb-2">{tr("Format reference (paste credentials clean)", "مرجع التنسيق (الصق البيانات نظيفة)")}</p>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      <li>• {tr("Private key must start with -----BEGIN.", "يجب أن يبدأ المفتاح الخاص بـ -----BEGIN.")}</li>
                      <li>• {tr("CSID / secret fields are base64 only — no spaces, line breaks, or wrapping quotes.", "حقول CSID / السر بصيغة base64 فقط — بدون مسافات أو أسطر جديدة أو علامات اقتباس.")}</li>
                      <li>• {tr("The Compliance Request ID links onboarding to invoice submission.", "معرّف طلب الامتثال يربط الإعداد بإرسال الفواتير.")}</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      {tr("The Settings page auto-strips stray spaces/quotes on save and shows inline format hints.",
                        "تقوم صفحة الإعدادات تلقائياً بإزالة المسافات/الاقتباسات الزائدة عند الحفظ وتعرض تلميحات التنسيق.")}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* ===================== COMMANDS ===================== */}
          <TabsContent value="commands" className="space-y-4">
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>{tr("Use the one-shot deploy script", "استخدم سكربت النشر الموحّد")}</AlertTitle>
              <AlertDescription>
                {tr(
                  "On the production VM, deploy with ./deploy.sh from the repo root. It pulls, installs, migrates, builds, and restarts safely (aborts on the first failed step). The manual commands below are only for troubleshooting individual steps.",
                  "على خادم الإنتاج، انشر باستخدام ./deploy.sh من جذر المستودع. يقوم بالسحب والتثبيت والترحيل والبناء وإعادة التشغيل بأمان (يتوقف عند أول خطوة فاشلة). الأوامر اليدوية أدناه للتشخيص فقط.",
                )}
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />{tr("Deployment (server / VM)", "النشر (الخادم / VM)")}
                </CardTitle>
                <CardDescription>
                  {tr("Run from the repo root. Click the copy icon on any command.",
                    "نفّذ من جذر المستودع. اضغط أيقونة النسخ بجانب أي أمر.")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CommandBlock commands={[
                  { note: tr("Full deploy: pull → install → migrate → build → restart.", "نشر كامل: سحب ← تثبيت ← ترحيل ← بناء ← إعادة تشغيل."), cmd: "./deploy.sh" },
                  { note: tr("Config-only change (skip the build).", "تغيير إعدادات فقط (تخطّ البناء)."), cmd: "./deploy.sh --no-build" },
                  { note: tr("Schema unchanged (skip db:push).", "المخطط لم يتغير (تخطّ db:push)."), cmd: "./deploy.sh --no-migrate" },
                  { note: tr("Deploy even if the PDF engine check fails (NOT recommended — PDF downloads will be blank).", "انشر حتى لو فشل فحص محرك PDF (غير موصى به — ستكون ملفات PDF فارغة)."), cmd: "./deploy.sh --no-pdf-check" },
                  { note: tr("Test the PDF engine (headless Chromium) manually.", "اختبر محرك PDF (كروميوم بدون واجهة) يدوياً."), cmd: "node scripts/check-pdf-engine.mjs" },
                ]} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />{tr("Process management (pm2 — process name \"BSS\")", "إدارة العمليات (pm2 — اسم العملية \"BSS\")")}
                </CardTitle>
                <CardDescription>
                  {tr("There must be exactly one pm2 process named BSS.", "يجب أن تكون هناك عملية pm2 واحدة فقط باسم BSS.")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CommandBlock commands={[
                  { note: tr("List processes and status.", "اعرض العمليات وحالتها."), cmd: "pm2 status" },
                  { note: tr("Last 40 log lines (no live stream).", "آخر 40 سطراً من السجل (بدون بث حي)."), cmd: "pm2 logs BSS --lines 40 --nostream" },
                  { note: tr("Live logs (Ctrl+C to exit).", "السجلات الحية (Ctrl+C للخروج)."), cmd: "pm2 logs BSS" },
                  { note: tr("Restart picking up new env vars.", "أعد التشغيل مع التقاط متغيرات البيئة الجديدة."), cmd: "pm2 restart BSS --update-env" },
                  { note: tr("First-time start (script does this automatically).", "تشغيل لأول مرة (يقوم به السكربت تلقائياً)."), cmd: "pm2 start npm --name BSS --update-env -- run start" },
                  { note: tr("Persist the process list across reboots.", "احفظ قائمة العمليات بعد إعادة التشغيل."), cmd: "pm2 save" },
                ]} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />{tr("Database & build helpers", "أدوات قاعدة البيانات والبناء")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommandBlock commands={[
                  { note: tr("Type-check the whole project.", "افحص الأنواع لكامل المشروع."), cmd: "npm run check" },
                  { note: tr("Push schema (use --force only if a rename is blocked).", "ادفع المخطط (استخدم --force فقط عند تعذّر تغيير الاسم)."), cmd: "npm run db:push -- --force" },
                  { note: tr("Run the dev server locally.", "شغّل خادم التطوير محلياً."), cmd: "npm run dev" },
                ]} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== INSPECTION TOOLS ===================== */}
          <TabsContent value="inspection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />{tr("Using the Inspection Tools", "استخدام أدوات الفحص")}
                </CardTitle>
                <CardDescription>
                  {tr("Open Inspection Tools from the IT menu. It has five tabs — here is what each does.",
                    "افتح أدوات الفحص من قائمة تقنية المعلومات. تحتوي على خمسة تبويبات — وإليك وظيفة كل منها.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    title: tr("Overview", "نظرة عامة"),
                    body: tr("Live server status, uptime, memory, and database latency, plus active/expired/total sessions. Use 'Refresh All' to pull fresh numbers.",
                      "حالة الخادم الحية، مدة التشغيل، الذاكرة، وزمن استجابة قاعدة البيانات، إضافة إلى الجلسات النشطة/المنتهية/الإجمالية. استخدم 'تحديث الكل' لجلب أرقام جديدة."),
                  },
                  {
                    icon: <Database className="h-4 w-4" />,
                    title: tr("Database", "قاعدة البيانات"),
                    body: tr("Schema inspector: every table with column and row counts. Filter by name to confirm a table exists or check its size.",
                      "فاحص المخطط: كل جدول مع عدد الأعمدة والصفوف. صفِّ بالاسم للتأكد من وجود جدول أو معرفة حجمه."),
                  },
                  {
                    icon: <Network className="h-4 w-4" />,
                    title: tr("API Tester", "فاحص الواجهات"),
                    body: tr("Send GET/POST/PUT/PATCH/DELETE to any internal endpoint using your current session. Browse and filter all registered routes; click a route to load it.",
                      "أرسل GET/POST/PUT/PATCH/DELETE إلى أي مسار داخلي باستخدام جلستك الحالية. تصفّح وصفِّ كل المسارات المسجلة؛ انقر مساراً لتحميله."),
                  },
                  {
                    icon: <AlertTriangle className="h-4 w-4" />,
                    title: tr("Browser Errors", "أخطاء المتصفح"),
                    body: tr("Captures console errors, uncaught exceptions, and unhandled rejections since the page opened. Keep it open in a tab while reproducing a bug.",
                      "يلتقط أخطاء الكونسول والاستثناءات غير المعالجة منذ فتح الصفحة. أبقِه مفتوحاً في تبويب أثناء إعادة إنتاج الخطأ."),
                  },
                  {
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    title: tr("Delivery Parity", "تطابق التوصيل"),
                    body: tr("Runs the shared delivery-fee formula over 6 fixed scenarios and verifies POS and Profitability match to the halala. Aim for 6/6.",
                      "يشغّل معادلة رسوم التوصيل المشتركة على 6 سيناريوهات ثابتة ويتحقق من تطابق نقطة البيع والربحية حتى الهللة. الهدف 6/6."),
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3" data-testid={`row-inspection-${i}`}>
                    <Badge variant="secondary" className="mt-0.5">{item.icon}</Badge>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.body}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== TROUBLESHOOTING ===================== */}
          <TabsContent value="troubleshooting" className="space-y-4">
            <Accordion type="single" collapsible className="space-y-2">
              {[
                {
                  q: tr("ZATCA onboarding fails with \"Invalid OTP\"", "فشل إعداد ZATCA برسالة \"OTP غير صالح\""),
                  a: tr("The code is not a bug. Causes: the OTP expired, was already used, or the BSS Environment does not match the Fatoora portal you got it from. Generate a fresh OTP in the correct environment and onboard immediately.",
                    "الرسالة ليست خطأ برمجياً. الأسباب: انتهت صلاحية الرمز، أو استُخدم مسبقاً، أو أن بيئة BSS لا تطابق بوابة فاتورة التي حصلت منها على الرمز. أنشئ رمزاً جديداً في البيئة الصحيحة وأكمل الإعداد فوراً."),
                },
                {
                  q: tr("Emails are not being delivered", "البريد الإلكتروني لا يصل"),
                  a: tr("Check EMAIL_PROVIDER and the matching credentials (RESEND_API_KEY or the SMTP_* set). Confirm EMAIL_FROM is a verified sender. Trigger a password recovery to test.",
                    "تحقق من EMAIL_PROVIDER والبيانات المطابقة (RESEND_API_KEY أو مجموعة SMTP_*). تأكد أن EMAIL_FROM مرسل موثّق. شغّل استعادة كلمة المرور للاختبار."),
                },
                {
                  q: tr("Database card is red / latency very high", "بطاقة قاعدة البيانات حمراء / زمن الاستجابة مرتفع جداً"),
                  a: tr("Verify DATABASE_URL is set and the RDS instance allows the server's IP. Check pm2 logs for connection errors. Re-run npm run db:push if a table is missing.",
                    "تأكد من ضبط DATABASE_URL وأن RDS يسمح بعنوان IP للخادم. راجع سجلات pm2 لأخطاء الاتصال. أعد تشغيل npm run db:push إذا كان جدول مفقوداً."),
                },
                {
                  q: tr("\"column does not exist\" after deploying", "\"العمود غير موجود\" بعد النشر"),
                  a: tr("The production schema is behind the code. Re-run ./deploy.sh (it runs npm run db:push), or run npm run db:push manually, then pm2 restart BSS --update-env.",
                    "مخطط الإنتاج متأخر عن الكود. أعد تشغيل ./deploy.sh (ينفّذ npm run db:push)، أو شغّل npm run db:push يدوياً، ثم pm2 restart BSS --update-env."),
                },
                {
                  q: tr("PDF downloads come back blank or broken", "ملفات PDF المحمّلة فارغة أو تالفة"),
                  a: tr("The server renders PDFs with headless Chromium (Puppeteer). A blank file means the browser failed to launch on the VM. Run node scripts/check-pdf-engine.mjs to diagnose, then fix with sudo apt-get install -y chromium-browser (or npx puppeteer browsers install chrome), then pm2 restart BSS --update-env. Re-running ./deploy.sh performs this check and self-heals automatically.",
                    "يولّد الخادم ملفات PDF باستخدام كروميوم بدون واجهة (Puppeteer). الملف الفارغ يعني فشل تشغيل المتصفح على الخادم. شغّل node scripts/check-pdf-engine.mjs للتشخيص، ثم أصلح بـ sudo apt-get install -y chromium-browser (أو npx puppeteer browsers install chrome)، ثم pm2 restart BSS --update-env. إعادة تشغيل ./deploy.sh تجري هذا الفحص وتصلحه تلقائياً."),
                },
                {
                  q: tr("App is down after deploy", "التطبيق متوقف بعد النشر"),
                  a: tr("Run pm2 status to see the state, then pm2 logs BSS --lines 40 --nostream to read the crash. Most failures are a missing env var or an out-of-sync schema. To roll back: git reset --hard <previous-commit> && ./deploy.sh.",
                    "شغّل pm2 status لمعرفة الحالة، ثم pm2 logs BSS --lines 40 --nostream لقراءة سبب التعطل. معظم الأعطال متغير بيئة مفقود أو مخطط غير متزامن. للتراجع: git reset --hard <الكوميت-السابق> && ./deploy.sh."),
                },
              ].map((item, i) => (
                <AccordionItem key={i} value={`ts-${i}`} className="border rounded-md px-4" data-testid={`accordion-troubleshoot-${i}`}>
                  <AccordionTrigger className="hover:no-underline text-sm font-medium text-left">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
