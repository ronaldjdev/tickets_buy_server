import type { WompiSettings } from "../../../../shared/contracts/IWompiConfigReader.contract.js";

interface General {
	nameBusiness?: string;
	email?: string;
	phone?: string;
	logoUrl?: string;
}

interface WompiConfig {
	enabled?: boolean;
	environment?: WompiSettings["environment"];
	publicKey?: string;
	privateKey?: string;
	integrityKey?: string;
	eventsKey?: string;
}

export interface PaymentProviderSettings {
	enabled?: boolean;
	provider?: string;
	environment?: "sandbox" | "production";
	publicKey?: string;
	privateKey?: string;
	integrityKey?: string;
	eventsKey?: string;
}

export interface EmailIntegration {
	enabled?: boolean;
	provider?: "smtp" | "brevo" | "resend" | "sendgrid";
	host?: string;
	port?: number;
	secure?: boolean;
	user?: string;
	password?: string;
	apiKey?: string;
	fromEmail?: string;
	fromName?: string;
}

export interface SmsIntegration {
	enabled?: boolean;
	provider?: "brevo" | "twilio" | "http";
	apiKey?: string;
	apiUrl?: string;
	fromNumber?: string;
	accountSid?: string;
	authToken?: string;
}

export interface IntegrationsConfig {
	payments?: Record<string, PaymentProviderSettings>;
	email?: EmailIntegration;
	sms?: SmsIntegration;
}

// ─── Homepage CMS ─────────────────────────────────────────────────────────────

export type HomepageSectionType =
	| "hero"
	| "featured-raffle"
	| "raffle-grid"
	| "how-it-works"
	| "trust"
	| "stats"
	| "winners"
	| "testimonials"
	| "faq"
	| "cta";

export interface HomepageSectionVisibility {
	type: HomepageSectionType;
	enabled: boolean;
	order: number;
}

export interface HeroSlide {
	id?: string;
	image: string;
	top?: string;
	bottom?: string;
	model?: string;
	desc?: string;
}

export interface HeroCmsContent {
	eyebrow?: string;
	titleLine1?: string;
	titleLine2?: string;
	wordmark?: string;
	primaryButtonText?: string;
	secondaryButtonText?: string;
	mediaType?: "video" | "carousel";
	videoUrl?: string;
	carouselImages?: string[];
	slides?: HeroSlide[];
}

export interface HowItWorksStep {
	number: string;
	title: string;
	description: string;
}

export interface HowItWorksCmsContent {
	eyebrow?: string;
	title?: string;
	description?: string;
	steps?: HowItWorksStep[];
}

export interface TestimonialItem {
	quote: string;
	name: string;
	detail: string;
}

export interface TestimonialsCmsContent {
	eyebrow?: string;
	title?: string;
	items?: TestimonialItem[];
}

export interface FaqItem {
	question: string;
	answer: string;
}

export interface FaqCmsContent {
	eyebrow?: string;
	title?: string;
	items?: FaqItem[];
}

export interface CtaCmsContent {
	title?: string;
	description?: string;
	buttonText?: string;
}

export interface SalesProgressCmsContent {
	targetPercent?: number;
	title?: string;
	description?: string;
}

export interface HomepageCmsConfig {
	sections?: HomepageSectionVisibility[];
	hero?: HeroCmsContent;
	howItWorks?: HowItWorksCmsContent;
	testimonials?: TestimonialsCmsContent;
	faq?: FaqCmsContent;
	cta?: CtaCmsContent;
	salesProgress?: SalesProgressCmsContent;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface Config {
	isSingleton?: boolean;
	general?: General;
	wompi?: WompiConfig;
	integrations?: IntegrationsConfig;
	homepage?: HomepageCmsConfig;
	machine?: {
		/** Interruptor global de la máquina de tiros (default true). */
		enabled?: boolean;
	};
	createdAt?: Date;
	updatedAt?: Date;
}
