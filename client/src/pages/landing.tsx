import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Landing() {
  const [currentLang, setCurrentLang] = useState<'en' | 'ar'>('en');
  const isRTL = currentLang === 'ar';

  const t = {
    en: {
      tagline: "Smart Restaurant Management for Saudi Arabia",
      description: "Complete POS, inventory, and multi-branch management system. ZATCA-compliant with subscription plans starting from 39.90 SAR/week.",
      startTrial: "Start Free Trial",
      viewPricing: "View Pricing",
      login: "Login",
      activeRestaurants: "Active Restaurants",
      uptime: "Uptime",
      support: "Support",
      zatcaCompliant: "ZATCA Compliant",
      featuresTitle: "Everything You Need to Run Your Restaurant",
      featuresSubtitle: "Powerful features designed specifically for Saudi Arabian restaurants",
      pos: "Point of Sale",
      posDesc: "Fast, intuitive POS system with real-time inventory tracking and multiple payment methods.",
      inventory: "Inventory Management",
      inventoryDesc: "Track stock levels, automatic alerts, and recipe-based inventory deduction.",
      multiBranch: "Multi-Branch",
      multiBranchDesc: "Manage multiple locations from a single dashboard with centralized reporting.",
      analytics: "Analytics & Reports",
      analyticsDesc: "Daily sales, demand forecasting, peak hours analysis, and profitability insights.",
      zatca: "ZATCA Compliant",
      zatcaDesc: "Bilingual invoices with QR codes, automatic VAT calculation, and e-invoicing.",
      languages: "7 Languages",
      languagesDesc: "Full support for Arabic, English, Urdu, and 4 more languages with RTL support.",
      pricingTitle: "Simple, Transparent Pricing",
      pricingSubtitle: "Choose the plan that fits your business. All plans include 15% VAT.",
      weekly: "Weekly",
      monthly: "Monthly",
      yearly: "Yearly",
      perWeek: "per week",
      perMonth: "per month",
      perYear: "per year",
      branchIncluded: "(1 branch included)",
      save17: "Save 17%!",
      mostPopular: "Most Popular",
      getStarted: "Get Started",
      readyTitle: "Ready to Transform Your Restaurant?",
      readySubtitle: "Join 750+ restaurants across Saudi Arabia using RestoPOS",
      madeBy: "Made By",
      saudiKinzhal: "Saudi Kinzhal",
    },
    ar: {
      tagline: "نظام ذكي لإدارة المطاعم في السعودية",
      description: "نظام نقاط بيع وإدارة مخزون ومتعدد الفروع. متوافق مع هيئة الزكاة والضريبة مع باقات تبدأ من 39.90 ريال/أسبوع.",
      startTrial: "ابدأ تجربة مجانية",
      viewPricing: "عرض الأسعار",
      login: "تسجيل الدخول",
      activeRestaurants: "مطعم نشط",
      uptime: "وقت التشغيل",
      support: "الدعم الفني",
      zatcaCompliant: "متوافق مع الزكاة",
      featuresTitle: "كل ما تحتاجه لإدارة مطعمك",
      featuresSubtitle: "ميزات قوية مصممة خصيصاً للمطاعم السعودية",
      pos: "نقطة البيع",
      posDesc: "نظام نقاط بيع سريع وسهل مع تتبع المخزون في الوقت الفعلي وطرق دفع متعددة.",
      inventory: "إدارة المخزون",
      inventoryDesc: "تتبع مستويات المخزون والتنبيهات التلقائية والخصم التلقائي للمكونات.",
      multiBranch: "متعدد الفروع",
      multiBranchDesc: "إدارة عدة فروع من لوحة تحكم واحدة مع تقارير مركزية.",
      analytics: "التحليلات والتقارير",
      analyticsDesc: "مبيعات يومية والتنبؤ بالطلب وتحليل ساعات الذروة ورؤى الربحية.",
      zatca: "متوافق مع الزكاة",
      zatcaDesc: "فواتير ثنائية اللغة مع رموز QR وحساب ضريبة القيمة المضافة التلقائي والفوترة الإلكترونية.",
      languages: "7 لغات",
      languagesDesc: "دعم كامل للعربية والإنجليزية والأردية و4 لغات أخرى مع دعم الكتابة من اليمين لليسار.",
      pricingTitle: "أسعار بسيطة وشفافة",
      pricingSubtitle: "اختر الباقة التي تناسب عملك. جميع الباقات تشمل ضريبة القيمة المضافة 15٪.",
      weekly: "أسبوعي",
      monthly: "شهري",
      yearly: "سنوي",
      perWeek: "في الأسبوع",
      perMonth: "في الشهر",
      perYear: "في السنة",
      branchIncluded: "(يشمل فرع واحد)",
      save17: "وفر 17٪!",
      mostPopular: "الأكثر شعبية",
      getStarted: "ابدأ الآن",
      readyTitle: "هل أنت مستعد لتحويل مطعمك؟",
      readySubtitle: "انضم إلى أكثر من 750 مطعماً في جميع أنحاء السعودية يستخدمون RestoPOS",
      madeBy: "صنع بواسطة",
      saudiKinzhal: "Saudi Kinzhal",
    }
  };

  const text = t[currentLang];

  const features = [
    { icon: "🏪", title: text.pos, desc: text.posDesc },
    { icon: "📦", title: text.inventory, desc: text.inventoryDesc },
    { icon: "🏢", title: text.multiBranch, desc: text.multiBranchDesc },
    { icon: "📊", title: text.analytics, desc: text.analyticsDesc },
    { icon: "📄", title: text.zatca, desc: text.zatcaDesc },
    { icon: "🌐", title: text.languages, desc: text.languagesDesc },
  ];

  const plans = [
    {
      name: text.weekly,
      price: "39.90",
      period: text.perWeek,
      features: [text.pos, text.inventory, text.zatca, "Basic Analytics", "Email Support"],
      popular: false
    },
    {
      name: text.monthly,
      price: "119.75",
      period: text.perMonth,
      features: ["Everything in Weekly", "Advanced Analytics", "Multi-Branch Support", "Kitchen Display System", "Priority Support"],
      popular: true
    },
    {
      name: text.yearly,
      price: "1,197.50",
      period: text.perYear,
      features: ["Everything in Monthly", "Unlimited Branches", "Demand Forecasting", "Custom Reports", "24/7 Phone Support"],
      popular: false,
      badge: text.save17
    },
  ];

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              RestoPOS
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setCurrentLang(currentLang === 'en' ? 'ar' : 'en')}
              >
                {currentLang === 'en' ? 'عربي' : 'English'}
              </Button>
              <Link href="/login">
                <Button variant="outline">{text.login}</Button>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                {text.tagline}
              </h1>
              <p className="text-lg md:text-xl text-white/90">
                {text.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="text-lg">
                    {text.startTrial}
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-lg bg-white/10 hover:bg-white/20 text-white border-white">
                  {text.viewPricing}
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <svg viewBox="0 0 400 300" className="w-full h-auto">
                  <rect width="400" height="300" fill="#f8fafc"/>
                  <rect x="20" y="20" width="360" height="60" rx="8" fill="#9333ea" opacity="0.1"/>
                  <rect x="40" y="35" width="120" height="30" rx="4" fill="#9333ea"/>
                  <rect x="20" y="100" width="170" height="180" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="2"/>
                  <rect x="210" y="100" width="170" height="80" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="2"/>
                  <rect x="210" y="200" width="170" height="80" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="2"/>
                  <circle cx="105" cy="140" r="20" fill="#10b981" opacity="0.2"/>
                  <circle cx="295" cy="140" r="20" fill="#f59e0b" opacity="0.2"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">750+</div>
              <div className="text-sm text-muted-foreground mt-2">{text.activeRestaurants}</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">99.9%</div>
              <div className="text-sm text-muted-foreground mt-2">{text.uptime}</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">24/7</div>
              <div className="text-sm text-muted-foreground mt-2">{text.support}</div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">100%</div>
              <div className="text-sm text-muted-foreground mt-2">{text.zatcaCompliant}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {text.featuresTitle}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {text.featuresSubtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {text.pricingTitle}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {text.pricingSubtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, idx) => (
              <Card key={idx} className={`p-8 relative ${plan.popular ? 'border-purple-600 border-2 shadow-xl scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600">
                    {text.mostPopular}
                  </Badge>
                )}
                {plan.badge && !plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600">
                    {plan.badge}
                  </Badge>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">SAR</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.period} {text.branchIncluded}
                  </p>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-sm">
                      <span className="text-green-600 font-bold">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={`/signup?plan=${plan.name.toLowerCase()}`}>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {text.getStarted}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold">
            {text.readyTitle}
          </h2>
          <p className="text-lg md:text-xl text-white/90">
            {text.readySubtitle}
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg">
              {text.startTrial}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t bg-background">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            {text.madeBy} <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{text.saudiKinzhal}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">© 2024 RestoPOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
