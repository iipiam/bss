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
};

export const marketingTranslations: Record<Language, MarketingT> = {
  English: en,
  Arabic: ar,
  German: en,
  Chinese: en,
  Bengali: en,
  Italian: en,
  Hindi: en,
  Urdu: ar,
  Spanish: en,
  Tagalog: en,
};

export function getMarketingT(language: Language): MarketingT {
  return marketingTranslations[language] || en;
}
