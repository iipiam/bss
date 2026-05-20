import type { Language } from "./translations";

export type MarketingT = {
  marketing: string;
  marketingSubtitle: string;
  loadExample: string;
  resetAll: string;
  downloadFullReport: string;
  gtmStrategy: string;
  salesCycle: string;
  financialAnalysis: string;
  bloggers: string;

  gtmTitle: string;
  gtmDesc: string;
  card1Title: string; card1Body: string;
  card2Title: string; card2Body: string;
  card3Title: string; card3Body: string;
  card4Title: string; card4Body: string;
  card5Title: string; card5Body: string;
  card6Title: string; card6Body: string;

  swotAnalysis: string;
  swotDesc: string;
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
  listYour: string;

  businessModelCanvas: string;
  bmcDesc: string;
  keyPartnerships: string;
  keyActivities: string;
  valuePropositions: string;
  customerRelationships: string;
  customerSegments: string;
  keyResources: string;
  channels: string;
  costStructure: string;
  revenueStreams: string;

  salesCycleStages: string;
  salesCycleDesc: string;
  stage1Title: string; stage1Body: string;
  stage2Title: string; stage2Body: string;
  stage3Title: string; stage3Body: string;
  stage4Title: string; stage4Body: string;
  stage5Title: string; stage5Body: string;
  stage6Title: string; stage6Body: string;
  stage7Title: string; stage7Body: string;
  keySalesMetrics: string;
  cac: string; cacDesc: string;
  ltv: string; ltvDesc: string;
  conversionRate: string; conversionRateDesc: string;
  cycleLength: string; cycleLengthDesc: string;
  winRate: string; winRateDesc: string;
  pipelineCoverage: string; pipelineCoverageDesc: string;

  finTitle: string;
  finDesc: string;
  addProduct: string;
  selectFromMenu: string;
  selectMenuItemPlaceholder: string;
  noMenuItems: string;
  linkedFromMenuToast: string;
  productName: string;
  sellingPrice: string; sellingPriceHelp: string;
  variableCost: string; variableCostHelp: string;
  fixedCosts: string; fixedCostsHelp: string;
  initialCapital: string; initialCapitalHelp: string;
  monthlyUnits: string; monthlyUnitsHelp: string;
  growthRate: string; growthRateHelp: string;
  grossMargin: string;
  breakEvenUnits: string;
  breakEvenRevenue: string;
  monthlyProfit: string;
  yearlyProfit: string;
  paybackPeriod: string;
  roiAnnual: string;
  contributionUnit: string;
  cumulativeProfit: string;
  monthlyProfitChart: string;
  month: string;
  na: string;

  singleInfluencerCalc: string;
  singleInfluencerDesc: string;
  followers: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  totalEngagements: string;
  engagementRate: string;
  rating: string;
  excellent: string;
  good: string;
  average: string;
  low: string;
  foodBenchmarks: string;
  nano: string; nanoDesc: string;
  micro: string; microDesc: string;
  macro: string; macroDesc: string;
  compareInfluencers: string;
  compareDesc: string;
  add: string;
  name: string;
  averageER: string;
  createBloggerFile: string;
  createBloggerDesc: string;
  handle: string;
  platform: string;
  niche: string;
  email: string;
  phone: string;
  city: string;
  notes: string;
  saveBloggerFile: string;
  savedBloggers: string;
  required: string;

  exampleLoaded: string;
  resetConfirm: string;
  resetDone: string;
  error: string;
  bloggerNameRequired: string;
  bloggerSaved: string;

  pdfTitle: string;
  pdfGenerated: string;
  page: string;
  of: string;

  // ====== Marketing Tools (Discounts, WhatsApp Broadcast, Poster, QR) ======
  discounts: string;
  whatsappBroadcast: string;
  posterGenerator: string;
  qrCodes: string;

  // Discounts
  discountCodes: string;
  discountCodesDesc: string;
  newDiscountCode: string;
  code: string;
  discountType: string;
  percent: string;
  fixedAmount: string;
  value: string;
  expiresAt: string;
  usageCap: string;
  active: string;
  inactive: string;
  noDiscountCodes: string;
  createCode: string;
  codeCreated: string;
  codeDeleted: string;
  used: string;
  noLimit: string;
  noExpiry: string;
  copyCode: string;
  copied: string;

  // WhatsApp Broadcast
  broadcastDesc: string;
  newTemplate: string;
  templateName: string;
  segment: string;
  segmentAll: string;
  segmentRecent: string;
  segmentSubscribers: string;
  messageBody: string;
  menuPdfUrlOptional: string;
  saveTemplate: string;
  templateSaved: string;
  templateDeleted: string;
  noTemplates: string;
  recipients: string;
  noRecipients: string;
  generateLinks: string;
  openWhatsApp: string;
  openAllRecipients: string;
  copyLink: string;
  linkCopied: string;
  contactsLoaded: string;

  // Poster Generator
  posterDesc: string;
  posterTitle: string;
  posterBody: string;
  posterPrice: string;
  posterImage: string;
  accentColor: string;
  generatePoster: string;
  generatingPoster: string;
  posterGenerated: string;
  uploadImage: string;
  removeImage: string;

  // QR Codes
  qrCodesDesc: string;
  qrUrl: string;
  qrUrlPlaceholder: string;
  qrLabel: string;
  qrLabelPlaceholder: string;
  generateQr: string;
  downloadQr: string;
  qrSize: string;
  invalidUrl: string;
};

const en: MarketingT = {
  marketing: "Marketing",
  marketingSubtitle:
    "Bloggers, Go-to-Market Strategies, Sales Cycles & Business Financial Analysis Toolkit",
  loadExample: "Load Example",
  resetAll: "Reset",
  downloadFullReport: "Full PDF Report",
  gtmStrategy: "Go-to-Market Strategy",
  salesCycle: "Sales Cycle",
  financialAnalysis: "Financial Analysis",
  bloggers: "Bloggers",

  gtmTitle: "Go-to-Market Strategy",
  gtmDesc:
    "A Go-to-Market (GTM) strategy is the plan that defines how a company launches a product, reaches its target customers, and achieves competitive advantage.",
  card1Title: "1. Target Audience",
  card1Body:
    "Define your ideal customer profile (ICP) and buyer personas — demographics, behaviour, pain points and where they spend time.",
  card2Title: "2. Value Proposition",
  card2Body:
    "A clear statement of the unique value you deliver, why it matters, and how it differs from alternatives in the market.",
  card3Title: "3. Market & Competitor Analysis",
  card3Body:
    "Understand market size (TAM/SAM/SOM), trends, and your direct & indirect competitors' positioning and pricing.",
  card4Title: "4. Pricing & Packaging",
  card4Body:
    "Set a pricing model (subscription, freemium, value-based) that aligns with customer value and unit economics.",
  card5Title: "5. Marketing Channels",
  card5Body:
    "Choose the most effective acquisition channels: SEO, paid ads, content, partnerships, events, influencer or community.",
  card6Title: "6. Sales Motion & KPIs",
  card6Body:
    "Decide between self-serve, inside sales, or field sales. Track activation, conversion, CAC, LTV and payback.",

  swotAnalysis: "SWOT Analysis",
  swotDesc:
    "Identify internal Strengths & Weaknesses, external Opportunities & Threats.",
  strengths: "Strengths",
  weaknesses: "Weaknesses",
  opportunities: "Opportunities",
  threats: "Threats",
  listYour: "List your",

  businessModelCanvas: "Business Model Canvas",
  bmcDesc: "A one-page view of how your business creates, delivers, and captures value.",
  keyPartnerships: "Key Partnerships",
  keyActivities: "Key Activities",
  valuePropositions: "Value Propositions",
  customerRelationships: "Customer Relationships",
  customerSegments: "Customer Segments",
  keyResources: "Key Resources",
  channels: "Channels",
  costStructure: "Cost Structure",
  revenueStreams: "Revenue Streams",

  salesCycleStages: "Sales Cycle Stages",
  salesCycleDesc:
    "The repeatable process your team follows to move a prospect from first touch to closed deal and beyond.",
  stage1Title: "Prospecting",
  stage1Body:
    "Identify potential customers through research, referrals, inbound leads, and outbound outreach.",
  stage2Title: "Qualification",
  stage2Body: "Verify fit using frameworks like BANT or MEDDIC — budget, authority, need, timing.",
  stage3Title: "Discovery & Needs Analysis",
  stage3Body:
    "Ask open-ended questions to understand pain points, goals, and decision-making criteria.",
  stage4Title: "Presentation / Demo",
  stage4Body:
    "Tailor your product demonstration to the prospect's specific needs and desired outcomes.",
  stage5Title: "Proposal & Negotiation",
  stage5Body: "Send a clear proposal, handle objections, and negotiate terms that work for both sides.",
  stage6Title: "Closing",
  stage6Body:
    "Confirm the decision, sign the contract, collect payment details, and onboard the customer.",
  stage7Title: "Retention & Upsell",
  stage7Body:
    "Deliver value, monitor satisfaction, expand the relationship through renewals and cross-sells.",
  keySalesMetrics: "Key Sales Metrics",
  cac: "CAC",
  cacDesc: "Cost to acquire a customer = Total Sales & Marketing Spend / New Customers",
  ltv: "LTV",
  ltvDesc: "Lifetime value = Avg Revenue per Customer × Gross Margin × Avg Lifespan",
  conversionRate: "Conversion Rate",
  conversionRateDesc: "% of leads that become paying customers at each funnel stage",
  cycleLength: "Sales Cycle Length",
  cycleLengthDesc: "Average time from first touch to closed deal",
  winRate: "Win Rate",
  winRateDesc: "Deals won / Total deals worked",
  pipelineCoverage: "Pipeline Coverage",
  pipelineCoverageDesc: "Total pipeline value / Target quota (3-4x is healthy)",

  finTitle: "Business & Financial Analysis",
  finDesc: "Break-even, ROI, payback period, and 24-month cumulative profit — calculated in real time.",
  addProduct: "Add Product",
  selectFromMenu: "Select from Menu",
  selectMenuItemPlaceholder: "Choose a menu item…",
  noMenuItems: "No menu items found",
  linkedFromMenuToast: "Product linked from menu with costs",
  productName: "Product name",
  sellingPrice: "Selling Price / Unit",
  sellingPriceHelp: "Price you charge for one unit.",
  variableCost: "Variable Cost / Unit",
  variableCostHelp: "Cost that varies per unit sold (ingredients, materials).",
  fixedCosts: "Monthly Fixed Costs",
  fixedCostsHelp: "Rent, salaries, utilities — costs that don't change with volume.",
  initialCapital: "Initial Capital",
  initialCapitalHelp: "Upfront investment in equipment, deposits, setup.",
  monthlyUnits: "Expected Monthly Units",
  monthlyUnitsHelp: "Realistic monthly sales volume.",
  growthRate: "Monthly Growth Rate %",
  growthRateHelp: "Expected month-over-month volume growth.",
  grossMargin: "Gross Margin",
  breakEvenUnits: "Break-even Units",
  breakEvenRevenue: "Break-even Revenue",
  monthlyProfit: "Monthly Profit",
  yearlyProfit: "Yearly Profit",
  paybackPeriod: "Payback Period",
  roiAnnual: "ROI (annual)",
  contributionUnit: "Contribution / Unit",
  cumulativeProfit: "Cumulative Profit",
  monthlyProfitChart: "Monthly Profit",
  month: "Month",
  na: "N/A",

  singleInfluencerCalc: "Single Influencer Calculator",
  singleInfluencerDesc: "Quickly calculate engagement rate for one influencer.",
  followers: "Followers",
  likes: "Likes",
  comments: "Comments",
  shares: "Shares",
  saves: "Saves",
  totalEngagements: "Total Engagements",
  engagementRate: "Engagement Rate",
  rating: "Rating",
  excellent: "Excellent",
  good: "Good",
  average: "Average",
  low: "Low",
  foodBenchmarks: "Food Niche Benchmarks",
  nano: "Nano (1k–10k)",
  nanoDesc: "Good ER > 8%",
  micro: "Micro (10k–100k)",
  microDesc: "Good ER > 4–5%",
  macro: "Macro (100k+)",
  macroDesc: "Good ER > 2–3%",
  compareInfluencers: "Compare Influencers",
  compareDesc: "Add multiple influencers and compare their engagement performance.",
  add: "Add",
  name: "Name",
  averageER: "Average ER",
  createBloggerFile: "Create Blogger File",
  createBloggerDesc:
    "Save a complete profile for each blogger including contact details and engagement stats.",
  handle: "Handle / Username",
  platform: "Platform",
  niche: "Niche",
  email: "Email",
  phone: "Phone",
  city: "City",
  notes: "Notes",
  saveBloggerFile: "Save Blogger File",
  savedBloggers: "Saved Blogger Files",
  required: "Required",

  exampleLoaded: "Example loaded",
  resetConfirm: "Reset everything? This cannot be undone.",
  resetDone: "All data cleared",
  error: "Error",
  bloggerNameRequired: "Blogger name is required",
  bloggerSaved: "Blogger file created",

  pdfTitle: "Marketing & Business Toolkit Report",
  pdfGenerated: "Generated",
  page: "Page",
  of: "of",

  discounts: "Discounts",
  whatsappBroadcast: "WhatsApp Broadcast",
  posterGenerator: "Poster Generator",
  qrCodes: "QR Codes",

  discountCodes: "Discount Codes",
  discountCodesDesc: "Create and manage promo codes (percent or fixed amount) with optional expiry and usage caps.",
  newDiscountCode: "New discount code",
  code: "Code",
  discountType: "Type",
  percent: "Percent (%)",
  fixedAmount: "Fixed amount",
  value: "Value",
  expiresAt: "Expires at",
  usageCap: "Usage cap",
  active: "Active",
  inactive: "Inactive",
  noDiscountCodes: "No discount codes yet. Create one above.",
  createCode: "Create code",
  codeCreated: "Discount code created",
  codeDeleted: "Discount code deleted",
  used: "Used",
  noLimit: "No limit",
  noExpiry: "No expiry",
  copyCode: "Copy code",
  copied: "Copied to clipboard",

  broadcastDesc: "Generate WhatsApp wa.me deep-links from saved templates to a customer segment.",
  newTemplate: "New broadcast template",
  templateName: "Template name",
  segment: "Audience segment",
  segmentAll: "All customers",
  segmentRecent: "Recent customers (last 30 days)",
  segmentSubscribers: "Meal subscribers",
  messageBody: "Message",
  menuPdfUrlOptional: "Menu / PDF URL (optional)",
  saveTemplate: "Save template",
  templateSaved: "Template saved",
  templateDeleted: "Template deleted",
  noTemplates: "No saved templates yet.",
  recipients: "Recipients",
  noRecipients: "No recipients in this segment.",
  generateLinks: "Generate links",
  openWhatsApp: "Open WhatsApp",
  openAllRecipients: "Open WhatsApp for all recipients",
  copyLink: "Copy link",
  linkCopied: "Link copied",
  contactsLoaded: "contacts loaded",

  posterDesc: "Create an A4 promo poster with your logo, headline, image and price.",
  posterTitle: "Headline",
  posterBody: "Body text",
  posterPrice: "Price (optional)",
  posterImage: "Promo image",
  accentColor: "Accent color",
  generatePoster: "Generate PDF poster",
  generatingPoster: "Generating poster…",
  posterGenerated: "Poster downloaded",
  uploadImage: "Upload image",
  removeImage: "Remove image",

  qrCodesDesc: "Generate a downloadable QR code for any URL — menu, promo landing, social profile.",
  qrUrl: "Target URL",
  qrUrlPlaceholder: "https://example.com/promo",
  qrLabel: "Label (optional)",
  qrLabelPlaceholder: "Summer Promo 2026",
  generateQr: "Generate QR",
  downloadQr: "Download PNG",
  qrSize: "Size",
  invalidUrl: "Enter a valid URL (must start with http:// or https://)",
};

const ar: MarketingT = {
  marketing: "التسويق",
  marketingSubtitle:
    "أدوات التسويق: المدوّنون، استراتيجيات الوصول للسوق، دورات البيع والتحليل المالي للأعمال",
  loadExample: "تحميل مثال",
  resetAll: "إعادة تعيين",
  downloadFullReport: "تقرير PDF كامل",
  gtmStrategy: "استراتيجية الوصول إلى السوق",
  salesCycle: "دورة المبيعات",
  financialAnalysis: "التحليل المالي",
  bloggers: "المدوّنون",

  gtmTitle: "استراتيجية الوصول إلى السوق",
  gtmDesc:
    "هي الخطة التي تحدد كيف تطلق الشركة منتجاً، وتصل إلى عملائها المستهدفين، وتحقق ميزة تنافسية في السوق.",
  card1Title: "١. الجمهور المستهدف",
  card1Body:
    "حدد ملف العميل المثالي (ICP) وشخصيات المشترين — الديموغرافيا، السلوك، نقاط الألم، وأين يقضون وقتهم.",
  card2Title: "٢. القيمة المقدمة",
  card2Body:
    "بيان واضح للقيمة الفريدة التي تقدمها، ولماذا تهم، وكيف تختلف عن البدائل في السوق.",
  card3Title: "٣. تحليل السوق والمنافسين",
  card3Body:
    "افهم حجم السوق (TAM/SAM/SOM)، الاتجاهات، ومواقع المنافسين المباشرين وغير المباشرين وتسعيرهم.",
  card4Title: "٤. التسعير والتغليف",
  card4Body:
    "ضع نموذج تسعير (اشتراك، مجاني محدود، قائم على القيمة) يتوافق مع قيمة العميل واقتصاديات الوحدة.",
  card5Title: "٥. قنوات التسويق",
  card5Body:
    "اختر أكثر قنوات الاكتساب فعالية: تحسين محركات البحث، الإعلانات المدفوعة، المحتوى، الشراكات، الفعاليات، المؤثرون أو المجتمع.",
  card6Title: "٦. نموذج البيع والمؤشرات",
  card6Body:
    "اختر بين الخدمة الذاتية، البيع الداخلي، أو البيع الميداني. تتبع التفعيل والتحويل و CAC و LTV وفترة الاسترداد.",

  swotAnalysis: "تحليل سوات (SWOT)",
  swotDesc: "حدد نقاط القوة والضعف الداخلية، والفرص والتهديدات الخارجية.",
  strengths: "نقاط القوة",
  weaknesses: "نقاط الضعف",
  opportunities: "الفرص",
  threats: "التهديدات",
  listYour: "اذكر",

  businessModelCanvas: "نموذج العمل التجاري",
  bmcDesc: "عرض من صفحة واحدة لكيفية إنشاء عملك للقيمة وتقديمها واستحواذها.",
  keyPartnerships: "الشراكات الرئيسية",
  keyActivities: "الأنشطة الرئيسية",
  valuePropositions: "القيمة المقدمة",
  customerRelationships: "علاقات العملاء",
  customerSegments: "شرائح العملاء",
  keyResources: "الموارد الرئيسية",
  channels: "القنوات",
  costStructure: "هيكل التكاليف",
  revenueStreams: "مصادر الإيرادات",

  salesCycleStages: "مراحل دورة المبيعات",
  salesCycleDesc:
    "العملية المتكررة التي يتبعها فريقك لنقل العميل المحتمل من أول لمسة إلى صفقة مغلقة وما بعدها.",
  stage1Title: "البحث عن العملاء المحتملين",
  stage1Body: "تحديد العملاء المحتملين من خلال البحث والإحالات والعملاء الداخليين والتواصل الخارجي.",
  stage2Title: "التأهيل",
  stage2Body: "تحقق من الملاءمة باستخدام أُطر مثل BANT أو MEDDIC — الميزانية، الصلاحية، الحاجة، التوقيت.",
  stage3Title: "الاكتشاف وتحليل الاحتياجات",
  stage3Body: "اطرح أسئلة مفتوحة لفهم نقاط الألم والأهداف ومعايير اتخاذ القرار.",
  stage4Title: "العرض التقديمي",
  stage4Body: "خصص عرض منتجك ليتناسب مع احتياجات العميل المحددة والنتائج المرغوبة.",
  stage5Title: "العرض والتفاوض",
  stage5Body: "أرسل عرضاً واضحاً، تعامل مع الاعتراضات، وتفاوض على شروط مناسبة للطرفين.",
  stage6Title: "الإغلاق",
  stage6Body: "تأكيد القرار، توقيع العقد، جمع تفاصيل الدفع، وبدء استخدام العميل.",
  stage7Title: "الاحتفاظ والبيع الإضافي",
  stage7Body: "قدم قيمة، راقب الرضا، ووسع العلاقة من خلال التجديدات والبيع المتقاطع.",
  keySalesMetrics: "مؤشرات المبيعات الرئيسية",
  cac: "CAC",
  cacDesc: "تكلفة اكتساب العميل = إجمالي إنفاق المبيعات والتسويق / العملاء الجدد",
  ltv: "LTV",
  ltvDesc: "القيمة الدائمة = متوسط الإيراد للعميل × هامش الربح × متوسط العمر",
  conversionRate: "معدل التحويل",
  conversionRateDesc: "نسبة العملاء المحتملين الذين يصبحون عملاء مدفوعين في كل مرحلة",
  cycleLength: "طول دورة المبيعات",
  cycleLengthDesc: "متوسط الوقت من أول لمسة إلى صفقة مغلقة",
  winRate: "معدل الفوز",
  winRateDesc: "الصفقات المربوحة / إجمالي الصفقات",
  pipelineCoverage: "تغطية خط الأنابيب",
  pipelineCoverageDesc: "إجمالي قيمة خط الأنابيب / الحصة المستهدفة (٣-٤ أضعاف مثالي)",

  finTitle: "التحليل التجاري والمالي",
  finDesc: "نقطة التعادل، العائد على الاستثمار، فترة الاسترداد، والربح التراكمي لـ ٢٤ شهراً — محسوبة فوراً.",
  addProduct: "إضافة منتج",
  selectFromMenu: "اختر من القائمة",
  selectMenuItemPlaceholder: "اختر صنفًا من القائمة…",
  noMenuItems: "لا توجد أصناف في القائمة",
  linkedFromMenuToast: "تم ربط المنتج من القائمة مع التكاليف",
  productName: "اسم المنتج",
  sellingPrice: "سعر البيع / الوحدة",
  sellingPriceHelp: "السعر الذي تتقاضاه عن الوحدة الواحدة.",
  variableCost: "التكلفة المتغيرة / الوحدة",
  variableCostHelp: "التكلفة التي تتغير لكل وحدة مباعة (المكونات، المواد).",
  fixedCosts: "التكاليف الثابتة الشهرية",
  fixedCostsHelp: "الإيجار، الرواتب، الفواتير — التكاليف التي لا تتغير مع الحجم.",
  initialCapital: "رأس المال الأولي",
  initialCapitalHelp: "الاستثمار الأولي في المعدات والودائع والإعداد.",
  monthlyUnits: "الوحدات الشهرية المتوقعة",
  monthlyUnitsHelp: "حجم المبيعات الشهري الواقعي.",
  growthRate: "معدل النمو الشهري ٪",
  growthRateHelp: "معدل النمو المتوقع شهراً بعد شهر.",
  grossMargin: "هامش الربح الإجمالي",
  breakEvenUnits: "وحدات التعادل",
  breakEvenRevenue: "إيرادات التعادل",
  monthlyProfit: "الربح الشهري",
  yearlyProfit: "الربح السنوي",
  paybackPeriod: "فترة الاسترداد",
  roiAnnual: "العائد على الاستثمار (سنوي)",
  contributionUnit: "المساهمة / الوحدة",
  cumulativeProfit: "الربح التراكمي",
  monthlyProfitChart: "الربح الشهري",
  month: "الشهر",
  na: "غير متاح",

  singleInfluencerCalc: "حاسبة مؤثر واحد",
  singleInfluencerDesc: "احسب معدل التفاعل لمؤثر واحد بسرعة.",
  followers: "المتابعون",
  likes: "الإعجابات",
  comments: "التعليقات",
  shares: "المشاركات",
  saves: "الحفظ",
  totalEngagements: "إجمالي التفاعلات",
  engagementRate: "معدل التفاعل",
  rating: "التقييم",
  excellent: "ممتاز",
  good: "جيد",
  average: "متوسط",
  low: "منخفض",
  foodBenchmarks: "معايير قطاع الطعام",
  nano: "نانو (١ك–١٠ك)",
  nanoDesc: "معدل تفاعل جيد > ٨٪",
  micro: "مايكرو (١٠ك–١٠٠ك)",
  microDesc: "معدل تفاعل جيد > ٤–٥٪",
  macro: "ماكرو (١٠٠ك+)",
  macroDesc: "معدل تفاعل جيد > ٢–٣٪",
  compareInfluencers: "مقارنة المؤثرين",
  compareDesc: "أضف عدة مؤثرين وقارن أداء تفاعلهم.",
  add: "إضافة",
  name: "الاسم",
  averageER: "متوسط معدل التفاعل",
  createBloggerFile: "إنشاء ملف مدوّن",
  createBloggerDesc: "احفظ ملفاً كاملاً لكل مدوّن بما في ذلك تفاصيل الاتصال وإحصاءات التفاعل.",
  handle: "اسم المستخدم",
  platform: "المنصة",
  niche: "التخصص",
  email: "البريد الإلكتروني",
  phone: "الهاتف",
  city: "المدينة",
  notes: "ملاحظات",
  saveBloggerFile: "حفظ ملف المدوّن",
  savedBloggers: "ملفات المدوّنين المحفوظة",
  required: "مطلوب",

  exampleLoaded: "تم تحميل المثال",
  resetConfirm: "إعادة تعيين كل شيء؟ لا يمكن التراجع عن هذا الإجراء.",
  resetDone: "تم مسح جميع البيانات",
  error: "خطأ",
  bloggerNameRequired: "اسم المدوّن مطلوب",
  bloggerSaved: "تم إنشاء ملف المدوّن",

  pdfTitle: "تقرير أدوات التسويق والأعمال",
  pdfGenerated: "تم الإنشاء",
  page: "صفحة",
  of: "من",

  discounts: "الخصومات",
  whatsappBroadcast: "بث واتساب",
  posterGenerator: "مولّد البوسترات",
  qrCodes: "رموز QR",

  discountCodes: "أكواد الخصم",
  discountCodesDesc: "أنشئ وأدِر أكواد الخصم (نسبة مئوية أو مبلغ ثابت) مع تاريخ انتهاء وحد استخدام اختياري.",
  newDiscountCode: "كود خصم جديد",
  code: "الكود",
  discountType: "النوع",
  percent: "نسبة (٪)",
  fixedAmount: "مبلغ ثابت",
  value: "القيمة",
  expiresAt: "ينتهي في",
  usageCap: "الحد الأقصى للاستخدام",
  active: "فعّال",
  inactive: "غير فعّال",
  noDiscountCodes: "لا توجد أكواد خصم بعد. أنشئ واحدًا أعلاه.",
  createCode: "إنشاء كود",
  codeCreated: "تم إنشاء كود الخصم",
  codeDeleted: "تم حذف كود الخصم",
  used: "مستخدم",
  noLimit: "بدون حد",
  noExpiry: "بدون انتهاء",
  copyCode: "نسخ الكود",
  copied: "تم النسخ إلى الحافظة",

  broadcastDesc: "أنشئ روابط wa.me من قوالب محفوظة إلى شريحة عملاء.",
  newTemplate: "قالب بث جديد",
  templateName: "اسم القالب",
  segment: "شريحة الجمهور",
  segmentAll: "كل العملاء",
  segmentRecent: "العملاء الجدد (آخر ٣٠ يوماً)",
  segmentSubscribers: "مشتركو الوجبات",
  messageBody: "الرسالة",
  menuPdfUrlOptional: "رابط القائمة / PDF (اختياري)",
  saveTemplate: "حفظ القالب",
  templateSaved: "تم حفظ القالب",
  templateDeleted: "تم حذف القالب",
  noTemplates: "لا توجد قوالب محفوظة بعد.",
  recipients: "المستلمون",
  noRecipients: "لا يوجد مستلمون في هذه الشريحة.",
  generateLinks: "إنشاء الروابط",
  openWhatsApp: "فتح واتساب",
  openAllRecipients: "فتح واتساب لكل المستلمين",
  copyLink: "نسخ الرابط",
  linkCopied: "تم نسخ الرابط",
  contactsLoaded: "جهات اتصال تم تحميلها",

  posterDesc: "صمّم بوستر ترويجي بحجم A4 مع شعارك، عنوان، صورة وسعر.",
  posterTitle: "العنوان الرئيسي",
  posterBody: "نص المحتوى",
  posterPrice: "السعر (اختياري)",
  posterImage: "صورة العرض",
  accentColor: "اللون المميّز",
  generatePoster: "إنشاء بوستر PDF",
  generatingPoster: "جاري إنشاء البوستر…",
  posterGenerated: "تم تنزيل البوستر",
  uploadImage: "رفع صورة",
  removeImage: "إزالة الصورة",

  qrCodesDesc: "أنشئ رمز QR قابل للتنزيل لأي رابط — قائمة، صفحة عرض، حساب اجتماعي.",
  qrUrl: "الرابط المستهدف",
  qrUrlPlaceholder: "https://example.com/promo",
  qrLabel: "تسمية (اختياري)",
  qrLabelPlaceholder: "عرض الصيف ٢٠٢٦",
  generateQr: "إنشاء QR",
  downloadQr: "تحميل PNG",
  qrSize: "الحجم",
  invalidUrl: "أدخل رابطًا صحيحًا (يجب أن يبدأ بـ http:// أو https://)",
};

// Native translations for the marketing-tools (Task #8) keys for the remaining
// 8 supported languages. We merge over the English base so any non-marketing
// keys keep the pre-existing English fallback.
type MarketingToolsKeys =
  | "discounts" | "whatsappBroadcast" | "posterGenerator" | "qrCodes"
  | "discountCodes" | "discountCodesDesc" | "newDiscountCode" | "code"
  | "discountType" | "percent" | "fixedAmount" | "value" | "expiresAt"
  | "usageCap" | "active" | "inactive" | "noDiscountCodes" | "createCode"
  | "codeCreated" | "codeDeleted" | "used" | "noLimit" | "noExpiry"
  | "copyCode" | "copied" | "broadcastDesc" | "newTemplate" | "templateName"
  | "segment" | "segmentAll" | "segmentRecent" | "segmentSubscribers"
  | "messageBody" | "menuPdfUrlOptional" | "saveTemplate" | "templateSaved"
  | "templateDeleted" | "noTemplates" | "recipients" | "noRecipients"
  | "generateLinks" | "openWhatsApp" | "openAllRecipients" | "copyLink"
  | "linkCopied" | "contactsLoaded" | "posterDesc" | "posterTitle"
  | "posterBody" | "posterPrice" | "posterImage" | "accentColor"
  | "generatePoster" | "generatingPoster" | "posterGenerated" | "uploadImage"
  | "removeImage" | "qrCodesDesc" | "qrUrl" | "qrUrlPlaceholder" | "qrLabel"
  | "qrLabelPlaceholder" | "generateQr" | "downloadQr" | "qrSize" | "invalidUrl";

const de: Pick<MarketingT, MarketingToolsKeys> = {
  discounts: "Rabatte", whatsappBroadcast: "WhatsApp-Versand", posterGenerator: "Poster-Generator", qrCodes: "QR-Codes",
  discountCodes: "Rabattcodes", discountCodesDesc: "Erstellen und verwalten Sie Rabattcodes (Prozent oder Festbetrag) mit optionalem Ablaufdatum und Nutzungslimit.",
  newDiscountCode: "Neuer Rabattcode", code: "Code", discountType: "Typ", percent: "Prozent (%)", fixedAmount: "Festbetrag",
  value: "Wert", expiresAt: "Läuft ab", usageCap: "Nutzungslimit", active: "Aktiv", inactive: "Inaktiv",
  noDiscountCodes: "Noch keine Rabattcodes. Erstellen Sie oben einen.", createCode: "Code erstellen",
  codeCreated: "Rabattcode erstellt", codeDeleted: "Rabattcode gelöscht", used: "Verwendet", noLimit: "Kein Limit",
  noExpiry: "Kein Ablauf", copyCode: "Code kopieren", copied: "In die Zwischenablage kopiert",
  broadcastDesc: "Erzeugen Sie WhatsApp wa.me-Links aus gespeicherten Vorlagen an ein Kundensegment.",
  newTemplate: "Neue Versandvorlage", templateName: "Vorlagenname", segment: "Zielgruppensegment",
  segmentAll: "Alle Kunden", segmentRecent: "Neue Kunden (letzte 30 Tage)", segmentSubscribers: "Menü-Abonnenten",
  messageBody: "Nachricht", menuPdfUrlOptional: "Menü-/PDF-URL (optional)", saveTemplate: "Vorlage speichern",
  templateSaved: "Vorlage gespeichert", templateDeleted: "Vorlage gelöscht", noTemplates: "Noch keine gespeicherten Vorlagen.",
  recipients: "Empfänger", noRecipients: "Keine Empfänger in diesem Segment.", generateLinks: "Links generieren",
  openWhatsApp: "WhatsApp öffnen", openAllRecipients: "WhatsApp für alle Empfänger öffnen", copyLink: "Link kopieren",
  linkCopied: "Link kopiert", contactsLoaded: "Kontakte geladen",
  posterDesc: "Erstellen Sie ein A4-Werbeposter mit Ihrem Logo, Titel, Bild und Preis.", posterTitle: "Überschrift",
  posterBody: "Textinhalt", posterPrice: "Preis (optional)", posterImage: "Werbebild", accentColor: "Akzentfarbe",
  generatePoster: "PDF-Poster erzeugen", generatingPoster: "Poster wird erstellt…", posterGenerated: "Poster heruntergeladen",
  uploadImage: "Bild hochladen", removeImage: "Bild entfernen",
  qrCodesDesc: "Erzeugen Sie einen herunterladbaren QR-Code für jede URL.", qrUrl: "Ziel-URL",
  qrUrlPlaceholder: "https://example.com/aktion", qrLabel: "Label (optional)", qrLabelPlaceholder: "Sommeraktion 2026",
  generateQr: "QR erstellen", downloadQr: "PNG herunterladen", qrSize: "Größe",
  invalidUrl: "Geben Sie eine gültige URL ein (muss mit http:// oder https:// beginnen)",
};

const zh: Pick<MarketingT, MarketingToolsKeys> = {
  discounts: "折扣", whatsappBroadcast: "WhatsApp 群发", posterGenerator: "海报生成器", qrCodes: "二维码",
  discountCodes: "折扣码", discountCodesDesc: "创建并管理折扣码（百分比或固定金额），可选有效期与使用上限。",
  newDiscountCode: "新折扣码", code: "代码", discountType: "类型", percent: "百分比 (%)", fixedAmount: "固定金额",
  value: "数值", expiresAt: "过期时间", usageCap: "使用上限", active: "启用", inactive: "停用",
  noDiscountCodes: "尚无折扣码，请在上方创建。", createCode: "创建代码", codeCreated: "折扣码已创建",
  codeDeleted: "折扣码已删除", used: "已使用", noLimit: "无限制", noExpiry: "无过期", copyCode: "复制代码",
  copied: "已复制到剪贴板", broadcastDesc: "从已保存的模板生成 wa.me 深度链接，发送到客户分群。",
  newTemplate: "新群发模板", templateName: "模板名称", segment: "受众分群", segmentAll: "全部客户",
  segmentRecent: "近期客户（30 天内）", segmentSubscribers: "餐订阅用户", messageBody: "消息",
  menuPdfUrlOptional: "菜单/PDF 链接（可选）", saveTemplate: "保存模板", templateSaved: "模板已保存",
  templateDeleted: "模板已删除", noTemplates: "尚无保存的模板。", recipients: "收件人",
  noRecipients: "此分群中没有收件人。", generateLinks: "生成链接", openWhatsApp: "打开 WhatsApp",
  openAllRecipients: "为所有收件人打开 WhatsApp", copyLink: "复制链接", linkCopied: "链接已复制",
  contactsLoaded: "联系人已加载",
  posterDesc: "使用您的徽标、标题、图片和价格创建 A4 宣传海报。", posterTitle: "标题",
  posterBody: "正文", posterPrice: "价格（可选）", posterImage: "宣传图片", accentColor: "强调色",
  generatePoster: "生成 PDF 海报", generatingPoster: "正在生成海报…", posterGenerated: "海报已下载",
  uploadImage: "上传图片", removeImage: "移除图片",
  qrCodesDesc: "为任意网址生成可下载的二维码。", qrUrl: "目标 URL",
  qrUrlPlaceholder: "https://example.com/promo", qrLabel: "标签（可选）",
  qrLabelPlaceholder: "2026 夏季活动", generateQr: "生成二维码", downloadQr: "下载 PNG", qrSize: "尺寸",
  invalidUrl: "请输入有效 URL（必须以 http:// 或 https:// 开头）",
};

const bn: Pick<MarketingT, MarketingToolsKeys> = {
  discounts: "ছাড়", whatsappBroadcast: "হোয়াটসঅ্যাপ ব্রডকাস্ট", posterGenerator: "পোস্টার জেনারেটর", qrCodes: "QR কোড",
  discountCodes: "ছাড়ের কোড", discountCodesDesc: "ছাড়ের কোড (শতাংশ বা নির্দিষ্ট পরিমাণ) তৈরি ও পরিচালনা করুন।",
  newDiscountCode: "নতুন ছাড় কোড", code: "কোড", discountType: "ধরন", percent: "শতাংশ (%)", fixedAmount: "নির্দিষ্ট পরিমাণ",
  value: "মান", expiresAt: "মেয়াদ শেষ", usageCap: "ব্যবহারের সীমা", active: "সক্রিয়", inactive: "নিষ্ক্রিয়",
  noDiscountCodes: "এখনো কোনো ছাড় কোড নেই।", createCode: "কোড তৈরি করুন",
  codeCreated: "ছাড় কোড তৈরি হয়েছে", codeDeleted: "ছাড় কোড মুছে ফেলা হয়েছে", used: "ব্যবহৃত",
  noLimit: "কোনো সীমা নেই", noExpiry: "মেয়াদ নেই", copyCode: "কোড কপি", copied: "ক্লিপবোর্ডে কপি হয়েছে",
  broadcastDesc: "সংরক্ষিত টেমপ্লেট থেকে গ্রাহক সেগমেন্টে wa.me লিঙ্ক তৈরি করুন।",
  newTemplate: "নতুন ব্রডকাস্ট টেমপ্লেট", templateName: "টেমপ্লেট নাম", segment: "শ্রোতা সেগমেন্ট",
  segmentAll: "সব গ্রাহক", segmentRecent: "সাম্প্রতিক গ্রাহক (গত ৩০ দিন)", segmentSubscribers: "মিল সাবস্ক্রাইবার",
  messageBody: "বার্তা", menuPdfUrlOptional: "মেনু/PDF লিঙ্ক (ঐচ্ছিক)", saveTemplate: "টেমপ্লেট সংরক্ষণ",
  templateSaved: "টেমপ্লেট সংরক্ষিত", templateDeleted: "টেমপ্লেট মুছে ফেলা হয়েছে",
  noTemplates: "এখনো সংরক্ষিত কোনো টেমপ্লেট নেই।", recipients: "প্রাপক",
  noRecipients: "এই সেগমেন্টে কোনো প্রাপক নেই।", generateLinks: "লিঙ্ক তৈরি",
  openWhatsApp: "হোয়াটসঅ্যাপ খুলুন", openAllRecipients: "সব প্রাপকের জন্য হোয়াটসঅ্যাপ খুলুন",
  copyLink: "লিঙ্ক কপি", linkCopied: "লিঙ্ক কপি হয়েছে", contactsLoaded: "পরিচিতি লোড হয়েছে",
  posterDesc: "আপনার লোগো, শিরোনাম, ছবি ও দাম দিয়ে A4 প্রচারপত্র তৈরি করুন।",
  posterTitle: "শিরোনাম", posterBody: "মূল লেখা", posterPrice: "দাম (ঐচ্ছিক)", posterImage: "প্রচার ছবি",
  accentColor: "প্রধান রঙ", generatePoster: "PDF পোস্টার তৈরি", generatingPoster: "পোস্টার তৈরি হচ্ছে…",
  posterGenerated: "পোস্টার ডাউনলোড হয়েছে", uploadImage: "ছবি আপলোড", removeImage: "ছবি সরান",
  qrCodesDesc: "যেকোনো URL-এর জন্য ডাউনলোডযোগ্য QR কোড তৈরি করুন।", qrUrl: "টার্গেট URL",
  qrUrlPlaceholder: "https://example.com/promo", qrLabel: "লেবেল (ঐচ্ছিক)",
  qrLabelPlaceholder: "গ্রীষ্ম অফার ২০২৬", generateQr: "QR তৈরি", downloadQr: "PNG ডাউনলোড", qrSize: "আকার",
  invalidUrl: "একটি বৈধ URL দিন (http:// বা https:// দিয়ে শুরু হওয়া আবশ্যক)",
};

const it: Pick<MarketingT, MarketingToolsKeys> = {
  discounts: "Sconti", whatsappBroadcast: "Trasmissione WhatsApp", posterGenerator: "Generatore di poster", qrCodes: "Codici QR",
  discountCodes: "Codici sconto", discountCodesDesc: "Crea e gestisci codici promozionali (percentuale o importo fisso) con scadenza e limite d'uso opzionali.",
  newDiscountCode: "Nuovo codice sconto", code: "Codice", discountType: "Tipo", percent: "Percentuale (%)",
  fixedAmount: "Importo fisso", value: "Valore", expiresAt: "Scadenza", usageCap: "Limite d'uso",
  active: "Attivo", inactive: "Inattivo", noDiscountCodes: "Nessun codice sconto. Creane uno sopra.",
  createCode: "Crea codice", codeCreated: "Codice sconto creato", codeDeleted: "Codice sconto eliminato",
  used: "Usato", noLimit: "Nessun limite", noExpiry: "Nessuna scadenza", copyCode: "Copia codice",
  copied: "Copiato negli appunti",
  broadcastDesc: "Genera collegamenti WhatsApp wa.me da template salvati verso un segmento clienti.",
  newTemplate: "Nuovo modello di trasmissione", templateName: "Nome modello", segment: "Segmento di pubblico",
  segmentAll: "Tutti i clienti", segmentRecent: "Clienti recenti (ultimi 30 giorni)", segmentSubscribers: "Abbonati ai pasti",
  messageBody: "Messaggio", menuPdfUrlOptional: "URL menu/PDF (opzionale)", saveTemplate: "Salva modello",
  templateSaved: "Modello salvato", templateDeleted: "Modello eliminato", noTemplates: "Nessun modello salvato.",
  recipients: "Destinatari", noRecipients: "Nessun destinatario in questo segmento.", generateLinks: "Genera link",
  openWhatsApp: "Apri WhatsApp", openAllRecipients: "Apri WhatsApp per tutti i destinatari", copyLink: "Copia link",
  linkCopied: "Link copiato", contactsLoaded: "contatti caricati",
  posterDesc: "Crea un poster promozionale A4 con il tuo logo, titolo, immagine e prezzo.",
  posterTitle: "Titolo", posterBody: "Testo", posterPrice: "Prezzo (opzionale)", posterImage: "Immagine promozionale",
  accentColor: "Colore accento", generatePoster: "Genera PDF poster", generatingPoster: "Generazione poster…",
  posterGenerated: "Poster scaricato", uploadImage: "Carica immagine", removeImage: "Rimuovi immagine",
  qrCodesDesc: "Genera un codice QR scaricabile per qualsiasi URL.", qrUrl: "URL di destinazione",
  qrUrlPlaceholder: "https://example.com/promo", qrLabel: "Etichetta (opzionale)",
  qrLabelPlaceholder: "Promo Estate 2026", generateQr: "Genera QR", downloadQr: "Scarica PNG", qrSize: "Dimensione",
  invalidUrl: "Inserisci un URL valido (deve iniziare con http:// o https://)",
};

const hi: Pick<MarketingT, MarketingToolsKeys> = {
  discounts: "छूट", whatsappBroadcast: "व्हाट्सएप ब्रॉडकास्ट", posterGenerator: "पोस्टर जेनरेटर", qrCodes: "QR कोड",
  discountCodes: "छूट कोड", discountCodesDesc: "छूट कोड (प्रतिशत या निश्चित राशि) बनाएं और प्रबंधित करें।",
  newDiscountCode: "नया छूट कोड", code: "कोड", discountType: "प्रकार", percent: "प्रतिशत (%)", fixedAmount: "निश्चित राशि",
  value: "मान", expiresAt: "समाप्ति", usageCap: "उपयोग सीमा", active: "सक्रिय", inactive: "निष्क्रिय",
  noDiscountCodes: "अभी कोई छूट कोड नहीं है।", createCode: "कोड बनाएं",
  codeCreated: "छूट कोड बनाया गया", codeDeleted: "छूट कोड हटाया गया", used: "उपयोग किया गया",
  noLimit: "कोई सीमा नहीं", noExpiry: "कोई समाप्ति नहीं", copyCode: "कोड कॉपी करें",
  copied: "क्लिपबोर्ड में कॉपी हो गया",
  broadcastDesc: "सहेजे गए टेम्पलेट से ग्राहक सेगमेंट के लिए wa.me लिंक बनाएं।",
  newTemplate: "नया ब्रॉडकास्ट टेम्पलेट", templateName: "टेम्पलेट का नाम", segment: "दर्शक सेगमेंट",
  segmentAll: "सभी ग्राहक", segmentRecent: "हाल के ग्राहक (30 दिन)", segmentSubscribers: "भोजन ग्राहक",
  messageBody: "संदेश", menuPdfUrlOptional: "मेनू/PDF लिंक (वैकल्पिक)", saveTemplate: "टेम्पलेट सहेजें",
  templateSaved: "टेम्पलेट सहेजा गया", templateDeleted: "टेम्पलेट हटाया गया",
  noTemplates: "अभी कोई सहेजा टेम्पलेट नहीं।", recipients: "प्राप्तकर्ता",
  noRecipients: "इस सेगमेंट में कोई प्राप्तकर्ता नहीं।", generateLinks: "लिंक बनाएं",
  openWhatsApp: "व्हाट्सएप खोलें", openAllRecipients: "सभी प्राप्तकर्ताओं के लिए व्हाट्सएप खोलें",
  copyLink: "लिंक कॉपी करें", linkCopied: "लिंक कॉपी हुआ", contactsLoaded: "संपर्क लोड हुए",
  posterDesc: "अपने लोगो, शीर्षक, चित्र और मूल्य के साथ A4 प्रचार पोस्टर बनाएं।",
  posterTitle: "शीर्षक", posterBody: "मुख्य पाठ", posterPrice: "मूल्य (वैकल्पिक)", posterImage: "प्रचार चित्र",
  accentColor: "उच्चारण रंग", generatePoster: "PDF पोस्टर बनाएं", generatingPoster: "पोस्टर बन रहा है…",
  posterGenerated: "पोस्टर डाउनलोड हुआ", uploadImage: "चित्र अपलोड करें", removeImage: "चित्र हटाएं",
  qrCodesDesc: "किसी भी URL के लिए डाउनलोड करने योग्य QR कोड बनाएं।", qrUrl: "लक्ष्य URL",
  qrUrlPlaceholder: "https://example.com/promo", qrLabel: "लेबल (वैकल्पिक)",
  qrLabelPlaceholder: "ग्रीष्म प्रोमो 2026", generateQr: "QR बनाएं", downloadQr: "PNG डाउनलोड करें",
  qrSize: "आकार", invalidUrl: "मान्य URL दर्ज करें (http:// या https:// से शुरू होना चाहिए)",
};

const ur: Pick<MarketingT, MarketingToolsKeys> = {
  discounts: "رعایتیں", whatsappBroadcast: "واٹس ایپ براڈ کاسٹ", posterGenerator: "پوسٹر جنریٹر", qrCodes: "QR کوڈز",
  discountCodes: "ڈسکاؤنٹ کوڈز", discountCodesDesc: "ڈسکاؤنٹ کوڈز (فیصد یا فکسڈ رقم) بنائیں اور ان کا انتظام کریں۔",
  newDiscountCode: "نیا ڈسکاؤنٹ کوڈ", code: "کوڈ", discountType: "قسم", percent: "فیصد (%)", fixedAmount: "فکسڈ رقم",
  value: "قدر", expiresAt: "اختتام", usageCap: "استعمال کی حد", active: "فعال", inactive: "غیر فعال",
  noDiscountCodes: "ابھی کوئی ڈسکاؤنٹ کوڈ نہیں۔", createCode: "کوڈ بنائیں",
  codeCreated: "ڈسکاؤنٹ کوڈ بن گیا", codeDeleted: "ڈسکاؤنٹ کوڈ حذف ہو گیا", used: "استعمال شدہ",
  noLimit: "کوئی حد نہیں", noExpiry: "کوئی اختتام نہیں", copyCode: "کوڈ کاپی کریں",
  copied: "کلپ بورڈ پر کاپی ہو گیا",
  broadcastDesc: "محفوظ ٹیمپلیٹس سے گاہک سیگمنٹ کے لیے wa.me لنکس بنائیں۔",
  newTemplate: "نیا براڈ کاسٹ ٹیمپلیٹ", templateName: "ٹیمپلیٹ کا نام", segment: "سامعین سیگمنٹ",
  segmentAll: "تمام گاہک", segmentRecent: "حالیہ گاہک (پچھلے 30 دن)", segmentSubscribers: "کھانے کے سبسکرائبر",
  messageBody: "پیغام", menuPdfUrlOptional: "مینو/PDF لنک (اختیاری)", saveTemplate: "ٹیمپلیٹ محفوظ کریں",
  templateSaved: "ٹیمپلیٹ محفوظ ہو گیا", templateDeleted: "ٹیمپلیٹ حذف ہو گیا",
  noTemplates: "ابھی کوئی محفوظ ٹیمپلیٹ نہیں۔", recipients: "وصول کنندگان",
  noRecipients: "اس سیگمنٹ میں کوئی وصول کنندہ نہیں۔", generateLinks: "لنکس بنائیں",
  openWhatsApp: "واٹس ایپ کھولیں", openAllRecipients: "تمام وصول کنندگان کے لیے واٹس ایپ کھولیں",
  copyLink: "لنک کاپی کریں", linkCopied: "لنک کاپی ہو گیا", contactsLoaded: "روابط لوڈ ہو گئے",
  posterDesc: "اپنے لوگو، عنوان، تصویر اور قیمت کے ساتھ A4 پروموشنل پوسٹر بنائیں۔",
  posterTitle: "عنوان", posterBody: "متن", posterPrice: "قیمت (اختیاری)", posterImage: "پروموشنل تصویر",
  accentColor: "ایکسنٹ کلر", generatePoster: "PDF پوسٹر بنائیں", generatingPoster: "پوسٹر بن رہا ہے…",
  posterGenerated: "پوسٹر ڈاؤن لوڈ ہو گیا", uploadImage: "تصویر اپ لوڈ کریں", removeImage: "تصویر ہٹائیں",
  qrCodesDesc: "کسی بھی URL کے لیے ڈاؤن لوڈ ہونے والا QR کوڈ بنائیں۔", qrUrl: "ہدف URL",
  qrUrlPlaceholder: "https://example.com/promo", qrLabel: "لیبل (اختیاری)",
  qrLabelPlaceholder: "سمر پرومو 2026", generateQr: "QR بنائیں", downloadQr: "PNG ڈاؤن لوڈ کریں",
  qrSize: "سائز", invalidUrl: "درست URL درج کریں (http:// یا https:// سے شروع ہونا چاہیے)",
};

const es: Pick<MarketingT, MarketingToolsKeys> = {
  discounts: "Descuentos", whatsappBroadcast: "Difusión por WhatsApp", posterGenerator: "Generador de pósters", qrCodes: "Códigos QR",
  discountCodes: "Códigos de descuento", discountCodesDesc: "Crea y gestiona códigos promocionales (porcentaje o monto fijo) con caducidad y límite de uso opcionales.",
  newDiscountCode: "Nuevo código de descuento", code: "Código", discountType: "Tipo", percent: "Porcentaje (%)",
  fixedAmount: "Monto fijo", value: "Valor", expiresAt: "Vence", usageCap: "Límite de uso",
  active: "Activo", inactive: "Inactivo", noDiscountCodes: "Aún no hay códigos de descuento.",
  createCode: "Crear código", codeCreated: "Código de descuento creado", codeDeleted: "Código de descuento eliminado",
  used: "Usado", noLimit: "Sin límite", noExpiry: "Sin caducidad", copyCode: "Copiar código",
  copied: "Copiado al portapapeles",
  broadcastDesc: "Genera enlaces wa.me desde plantillas guardadas a un segmento de clientes.",
  newTemplate: "Nueva plantilla de difusión", templateName: "Nombre de la plantilla", segment: "Segmento de audiencia",
  segmentAll: "Todos los clientes", segmentRecent: "Clientes recientes (últimos 30 días)", segmentSubscribers: "Suscriptores de comidas",
  messageBody: "Mensaje", menuPdfUrlOptional: "URL del menú/PDF (opcional)", saveTemplate: "Guardar plantilla",
  templateSaved: "Plantilla guardada", templateDeleted: "Plantilla eliminada", noTemplates: "Aún no hay plantillas guardadas.",
  recipients: "Destinatarios", noRecipients: "No hay destinatarios en este segmento.", generateLinks: "Generar enlaces",
  openWhatsApp: "Abrir WhatsApp", openAllRecipients: "Abrir WhatsApp para todos los destinatarios", copyLink: "Copiar enlace",
  linkCopied: "Enlace copiado", contactsLoaded: "contactos cargados",
  posterDesc: "Crea un póster promocional A4 con tu logo, título, imagen y precio.",
  posterTitle: "Título", posterBody: "Texto", posterPrice: "Precio (opcional)", posterImage: "Imagen promocional",
  accentColor: "Color de acento", generatePoster: "Generar póster PDF", generatingPoster: "Generando póster…",
  posterGenerated: "Póster descargado", uploadImage: "Subir imagen", removeImage: "Quitar imagen",
  qrCodesDesc: "Genera un código QR descargable para cualquier URL.", qrUrl: "URL de destino",
  qrUrlPlaceholder: "https://example.com/promo", qrLabel: "Etiqueta (opcional)",
  qrLabelPlaceholder: "Promo Verano 2026", generateQr: "Generar QR", downloadQr: "Descargar PNG", qrSize: "Tamaño",
  invalidUrl: "Ingresa una URL válida (debe comenzar con http:// o https://)",
};

const tl: Pick<MarketingT, MarketingToolsKeys> = {
  discounts: "Mga diskwento", whatsappBroadcast: "WhatsApp Broadcast", posterGenerator: "Tagagawa ng poster", qrCodes: "Mga QR code",
  discountCodes: "Mga discount code", discountCodesDesc: "Gumawa at pamahalaan ang mga promo code (porsyento o fixed amount).",
  newDiscountCode: "Bagong discount code", code: "Code", discountType: "Uri", percent: "Porsyento (%)", fixedAmount: "Fixed amount",
  value: "Halaga", expiresAt: "Mag-e-expire", usageCap: "Limit sa paggamit", active: "Aktibo", inactive: "Hindi aktibo",
  noDiscountCodes: "Wala pang mga discount code.", createCode: "Gumawa ng code",
  codeCreated: "Nalikha ang discount code", codeDeleted: "Natanggal ang discount code", used: "Nagamit",
  noLimit: "Walang limit", noExpiry: "Walang expiry", copyCode: "Kopyahin ang code",
  copied: "Nakopya sa clipboard",
  broadcastDesc: "Gumawa ng wa.me deep-link mula sa mga naka-save na template patungo sa isang customer segment.",
  newTemplate: "Bagong broadcast template", templateName: "Pangalan ng template", segment: "Audience segment",
  segmentAll: "Lahat ng customer", segmentRecent: "Mga kamakailang customer (huling 30 araw)", segmentSubscribers: "Mga meal subscriber",
  messageBody: "Mensahe", menuPdfUrlOptional: "URL ng Menu/PDF (opsyonal)", saveTemplate: "I-save ang template",
  templateSaved: "Na-save ang template", templateDeleted: "Natanggal ang template", noTemplates: "Wala pang naka-save na template.",
  recipients: "Mga tatanggap", noRecipients: "Walang tatanggap sa segment na ito.", generateLinks: "Gumawa ng mga link",
  openWhatsApp: "Buksan ang WhatsApp", openAllRecipients: "Buksan ang WhatsApp para sa lahat ng tatanggap",
  copyLink: "Kopyahin ang link", linkCopied: "Nakopya ang link", contactsLoaded: "mga contact ang naka-load",
  posterDesc: "Gumawa ng A4 promo poster gamit ang logo, headline, larawan at presyo mo.",
  posterTitle: "Headline", posterBody: "Body text", posterPrice: "Presyo (opsyonal)", posterImage: "Promo image",
  accentColor: "Accent color", generatePoster: "Gumawa ng PDF poster", generatingPoster: "Ginagawa ang poster…",
  posterGenerated: "Na-download ang poster", uploadImage: "Mag-upload ng larawan", removeImage: "Alisin ang larawan",
  qrCodesDesc: "Gumawa ng nada-download na QR code para sa anumang URL.", qrUrl: "Target URL",
  qrUrlPlaceholder: "https://example.com/promo", qrLabel: "Label (opsyonal)",
  qrLabelPlaceholder: "Summer Promo 2026", generateQr: "Gumawa ng QR", downloadQr: "I-download ang PNG",
  qrSize: "Sukat", invalidUrl: "Maglagay ng wastong URL (dapat magsimula sa http:// o https://)",
};

export const marketingTranslations: Record<Language, MarketingT> = {
  English: en,
  Arabic: ar,
  German: { ...en, ...de },
  Chinese: { ...en, ...zh },
  Bengali: { ...en, ...bn },
  Italian: { ...en, ...it },
  Hindi: { ...en, ...hi },
  Urdu: { ...ar, ...ur },
  Spanish: { ...en, ...es },
  Tagalog: { ...en, ...tl },
};

export function getMarketingT(language: Language): MarketingT {
  return marketingTranslations[language] || en;
}
