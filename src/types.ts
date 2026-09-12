export interface DesignTokens {
  accentColor: string;
  glowColor: string;
  surface: string;
  border: string;
  radius: string;
  typography?: string;
}

export interface GeneratedComponent {
  componentName: string;
  title: string;
  category: string;
  style: string;
  designRationale: string;
  tokens: DesignTokens;
  tags: string[];
  cleanCode: string;
  htmlPreview: string;
  userPrompt?: string;
  timestamp?: string;
}

export interface ShowcaseItem {
  id: string;
  title: string;
  category: "SaaS" | "FinTech" | "Spatial UI" | "E-Commerce" | "Minimal";
  description: string;
  badge: string;
  image: string;
  stats: { label: string; value: string };
  codeSnippet: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  features: string[];
  buttonText: string;
  buttonVariant: "primary" | "secondary" | "outline";
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface BenchmarkMetric {
  metric: string;
  mandeScore: number;
  genericScore: number;
  unit: string;
  description: string;
}
