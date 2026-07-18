import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  KeyRound,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ToggleRight,
  AlertTriangle,
  Clock,
  RotateCcw,
  Lock,
  UserCheck,
  ClipboardList,
  Rocket,
  Timer,
} from "lucide-react";

export default function ZatcaIntegrationGuide() {
  const { language, isRTL } = useLanguage();
  const isAr = language === "Arabic";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  const collectItems = [
    {
      icon: Building2,
      title: tr("Business Identity", "هوية المنشأة"),
      items: [
        tr("VAT registration number (15 digits, starts and ends with 3)", "رقم التسجيل الضريبي (15 رقمًا، يبدأ وينتهي بالرقم 3)"),
        tr("Commercial Registration (CR) number", "رقم السجل التجاري"),
        tr("Official company name — exactly as registered with ZATCA", "اسم الشركة الرسمي — تمامًا كما هو مسجل لدى الزكاة والضريبة والجمارك"),
        tr("Branch name (if they have more than one branch)", "اسم الفرع (إذا كان لديهم أكثر من فرع)"),
      ],
    },
    {
      icon: MapPin,
      title: tr("National Address (as registered with ZATCA)", "العنوان الوطني (كما هو مسجل لدى الهيئة)"),
      items: [
        tr("Street name and building number", "اسم الشارع ورقم المبنى"),
        tr("District (city subdivision)", "الحي"),
        tr("City and postal code", "المدينة والرمز البريدي"),
      ],
    },
    {
      icon: UserCheck,
      title: tr("Access Needed", "الصلاحيات المطلوبة"),
      items: [
        tr(
          "Login access to their Fatoora portal (fatoora.zatca.gov.sa) — or have the client with you, because they must generate a one-time OTP code during activation. The OTP is only valid for about an hour, so plan this step together.",
          "الدخول إلى بوابة فاتورة (fatoora.zatca.gov.sa) — أو تواجد العميل معك، لأنه يجب توليد رمز تحقق لمرة واحدة (OTP) أثناء التفعيل. الرمز صالح لمدة ساعة تقريبًا، لذا خططوا لهذه الخطوة معًا.",
        ),
      ],
    },
  ];

  const steps = [
    {
      icon: FileText,
      title: tr("Enter the client's profile", "أدخل بيانات العميل"),
      desc: tr(
        "Fill in the VAT number, CR number, company name, branch, and address, then pick the environment. Best practice: test on Simulation first, then redo on Production.",
        "أدخل الرقم الضريبي ورقم السجل التجاري واسم الشركة والفرع والعنوان، ثم اختر البيئة. أفضل ممارسة: جرّب على بيئة المحاكاة أولاً ثم أعد العملية على بيئة الإنتاج.",
      ),
      badge: tr("Settings tab", "تبويب الإعدادات"),
    },
    {
      icon: KeyRound,
      title: tr("Generate CSR", "توليد طلب شهادة (CSR)"),
      desc: tr(
        "One click. The system creates the client's private key and a certificate request. Nothing is sent to the client — it's stored securely per account.",
        "نقرة واحدة. يُنشئ النظام المفتاح الخاص للعميل وطلب الشهادة. لا يُرسل شيء للعميل — يُخزَّن بأمان لكل حساب.",
      ),
      badge: tr("Onboarding tab", "تبويب التفعيل"),
    },
    {
      icon: Timer,
      title: tr("Get the OTP and onboard", "الحصول على رمز التحقق والتفعيل"),
      desc: tr(
        'The client (or you, with their Fatoora login) logs into the Fatoora portal, clicks "Onboard new solution unit / device", and generates an OTP. Enter that OTP here and click Onboard. ZATCA returns the Compliance CSID (a temporary certificate).',
        "يدخل العميل (أو أنت باستخدام حسابه) إلى بوابة فاتورة، ويضغط على «إضافة حل/جهاز جديد»، ويولّد رمز OTP. أدخل الرمز هنا واضغط تفعيل. تُعيد الهيئة شهادة الامتثال المؤقتة (Compliance CSID).",
      ),
      badge: tr("OTP valid ~1 hour", "الرمز صالح ~ساعة"),
    },
    {
      icon: ClipboardList,
      title: tr("Run compliance checks", "تشغيل فحوصات الامتثال"),
      desc: tr(
        "One click. The system automatically sends sample standard and simplified invoices to ZATCA to prove the setup works. All must pass.",
        "نقرة واحدة. يرسل النظام تلقائيًا فواتير تجريبية (قياسية ومبسطة) إلى الهيئة لإثبات أن الإعداد يعمل. يجب أن تنجح جميعها.",
      ),
      badge: tr("Automatic", "تلقائي"),
    },
    {
      icon: ShieldCheck,
      title: tr("Get Production CSID", "الحصول على شهادة الإنتاج"),
      desc: tr(
        "One click after checks pass. This exchanges the temporary certificate for the permanent production one.",
        "نقرة واحدة بعد نجاح الفحوصات. تُستبدل الشهادة المؤقتة بشهادة الإنتاج الدائمة.",
      ),
      badge: tr("After checks pass", "بعد نجاح الفحوصات"),
    },
    {
      icon: ToggleRight,
      title: tr("Enable the integration", "تفعيل الربط"),
      desc: tr(
        "Flip the toggle to Enabled. From then on, every invoice is automatically signed, gets the 9-tag QR code, and is reported to (simplified) or cleared by (standard) ZATCA.",
        "حوّل المفتاح إلى «مفعّل». من الآن فصاعدًا تُوقَّع كل فاتورة تلقائيًا، وتحصل على رمز QR بتسعة حقول، ويتم إبلاغ الهيئة بها (المبسطة) أو اعتمادها (القياسية).",
      ),
      badge: tr("Go live", "الانطلاق"),
    },
  ];

  const warnings = [
    {
      icon: Clock,
      text: tr(
        "The OTP expires quickly (~1 hour) — coordinate with the client so you enter it right after they generate it.",
        "رمز التحقق ينتهي سريعًا (~ساعة) — نسّق مع العميل لإدخاله فور توليده.",
      ),
    },
    {
      icon: AlertTriangle,
      text: tr(
        "The company name and VAT number you enter must match ZATCA's records exactly, or onboarding will fail.",
        "يجب أن يتطابق اسم الشركة والرقم الضريبي تمامًا مع سجلات الهيئة، وإلا سيفشل التفعيل.",
      ),
    },
    {
      icon: Building2,
      text: tr(
        "Each branch/device needs its own onboarding if they invoice separately.",
        "كل فرع/جهاز يحتاج إلى تفعيل مستقل إذا كان يُصدر فواتيره بشكل منفصل.",
      ),
    },
    {
      icon: RotateCcw,
      text: tr(
        'If something goes wrong mid-way, use the "Reset onboarding" option to clear the certificates and start over.',
        "إذا حدث خطأ في منتصف العملية، استخدم خيار «إعادة تعيين التفعيل» لمسح الشهادات والبدء من جديد.",
      ),
    },
    {
      icon: Lock,
      text: tr(
        "Keep the client's certificates and secrets in the system only — never send them by email or WhatsApp.",
        "احتفظ بشهادات العميل وأسراره داخل النظام فقط — لا ترسلها أبدًا عبر البريد الإلكتروني أو واتساب.",
      ),
    },
  ];

  return (
    <div className="space-y-6" data-testid="zatca-integration-guide">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-md border bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 dark:from-emerald-800 dark:via-emerald-900 dark:to-teal-950">
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative p-6 md:p-8 text-white">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/15 backdrop-blur-sm">
              <Rocket className="h-5 w-5" />
            </div>
            <Badge className="bg-white/15 text-white border-white/20 no-default-hover-elevate">
              {tr("ZATCA Phase 2", "المرحلة الثانية — فوترة")}
            </Badge>
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-2" data-testid="text-guide-title">
            {tr("How to get a client live on ZATCA e-invoicing", "كيف تُفعّل عميلًا على الفوترة الإلكترونية لهيئة الزكاة")}
          </h2>
          <p className="text-sm md:text-base text-white/85 max-w-3xl">
            {tr(
              "Collect the client's details, then the whole activation is about 10 minutes of clicking through 4 steps on this ZATCA Settings page.",
              "اجمع بيانات العميل، وبعدها تستغرق عملية التفعيل كاملة نحو 10 دقائق عبر 4 خطوات في صفحة إعدادات الزكاة هذه.",
            )}
          </p>
        </div>
      </div>

      {/* Pre-flight checklist */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-lg font-semibold" data-testid="text-collect-title">
            {tr("What to collect from each client (before you start)", "ما يجب جمعه من كل عميل (قبل البدء)")}
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {collectItems.map((section, i) => (
            <Card key={i} data-testid={`card-collect-${i}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/40">
                    <section.icon className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <span className="font-medium text-sm">{section.title}</span>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Activation timeline */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-lg font-semibold" data-testid="text-steps-title">
            {tr("Activation steps (done from this page)", "خطوات التفعيل (تتم من هذه الصفحة)")}
          </h3>
        </div>
        <div className="relative">
          <div className={`absolute top-0 bottom-0 w-px bg-border ${isRTL ? "right-[19px]" : "left-[19px]"}`} />
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="relative flex gap-4 items-start" data-testid={`step-activation-${i}`}>
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-700 text-white font-bold text-sm">
                  {i + 1}
                </div>
                <Card className="flex-1">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <step.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium">{step.title}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{step.badge}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Watch-outs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h3 className="text-lg font-semibold" data-testid="text-warnings-title">
            {tr("Things to watch out for", "أمور يجب الانتباه لها")}
          </h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {warnings.map((w, i) => (
            <Card key={i} data-testid={`card-warning-${i}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/40">
                  <w.icon className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                </div>
                <p className="text-sm text-muted-foreground">{w.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40">
        <CardContent className="p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <p className="text-sm" data-testid="text-guide-summary">
            {tr(
              "In short: collect the VAT number, CR number, exact registered name, national address, and Fatoora portal access — then the whole activation is about 10 minutes of clicking through the steps above.",
              "باختصار: اجمع الرقم الضريبي ورقم السجل التجاري والاسم المسجل بدقة والعنوان الوطني وصلاحية الدخول لبوابة فاتورة — وبعدها يستغرق التفعيل كاملًا نحو 10 دقائق باتباع الخطوات أعلاه.",
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
