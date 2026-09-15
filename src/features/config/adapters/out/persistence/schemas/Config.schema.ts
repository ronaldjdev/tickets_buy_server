import { model, Schema } from "mongoose";

import type { Config } from "../../../../domain/entities/Config.entity.js";

const PaymentProviderSchema = new Schema(
	{
		enabled: { type: Boolean, default: false },
		provider: { type: String },
		environment: { type: String },
		publicKey: { type: String },
		privateKey: { type: String },
		integrityKey: { type: String },
		eventsKey: { type: String },
	},
	{ _id: false },
);

const EmailIntegrationSchema = new Schema(
	{
		enabled: { type: Boolean, default: false },
		provider: { type: String },
		host: { type: String },
		port: { type: Number },
		secure: { type: Boolean },
		user: { type: String },
		password: { type: String },
		apiKey: { type: String },
		fromEmail: { type: String },
		fromName: { type: String },
	},
	{ _id: false },
);

const SmsIntegrationSchema = new Schema(
	{
		enabled: { type: Boolean, default: false },
		provider: { type: String },
		apiKey: { type: String },
		apiUrl: { type: String },
		fromNumber: { type: String },
		accountSid: { type: String },
		authToken: { type: String },
	},
	{ _id: false },
);

// ─── Homepage CMS Schemas ─────────────────────────────────────────────────────

const HomepageSectionVisibilitySchema = new Schema(
	{
		type: { type: String, required: true },
		enabled: { type: Boolean, default: true },
		order: { type: Number, default: 0 },
	},
	{ _id: false },
);

const HeroSlideSchema = new Schema(
	{
		id: { type: String },
		image: { type: String },
		top: { type: String },
		bottom: { type: String },
		model: { type: String },
		desc: { type: String },
	},
	{ _id: false },
);

const HeroCmsSchema = new Schema(
	{
		eyebrow: { type: String },
		titleLine1: { type: String },
		titleLine2: { type: String },
		wordmark: { type: String },
		primaryButtonText: { type: String },
		secondaryButtonText: { type: String },
		mediaType: { type: String, enum: ["video", "carousel"] },
		videoUrl: { type: String },
		carouselImages: { type: [String], default: undefined },
		slides: { type: [HeroSlideSchema], default: undefined },
	},
	{ _id: false },
);

const HowItWorksStepSchema = new Schema(
	{
		number: { type: String },
		title: { type: String },
		description: { type: String },
	},
	{ _id: false },
);

const HowItWorksCmsSchema = new Schema(
	{
		eyebrow: { type: String },
		title: { type: String },
		description: { type: String },
		steps: { type: [HowItWorksStepSchema], default: undefined },
	},
	{ _id: false },
);

const TestimonialItemSchema = new Schema(
	{
		quote: { type: String },
		name: { type: String },
		detail: { type: String },
	},
	{ _id: false },
);

const TestimonialsCmsSchema = new Schema(
	{
		eyebrow: { type: String },
		title: { type: String },
		items: { type: [TestimonialItemSchema], default: undefined },
	},
	{ _id: false },
);

const FaqItemSchema = new Schema(
	{
		question: { type: String },
		answer: { type: String },
	},
	{ _id: false },
);

const FaqCmsSchema = new Schema(
	{
		eyebrow: { type: String },
		title: { type: String },
		items: { type: [FaqItemSchema], default: undefined },
	},
	{ _id: false },
);

const CtaCmsSchema = new Schema(
	{
		title: { type: String },
		description: { type: String },
		buttonText: { type: String },
	},
	{ _id: false },
);

const SalesProgressCmsSchema = new Schema(
	{
		targetPercent: { type: Number, default: 50 },
		title: { type: String },
		description: { type: String },
	},
	{ _id: false },
);

const HomepageCmsSchema = new Schema(
	{
		sections: { type: [HomepageSectionVisibilitySchema], default: undefined },
		hero: { type: HeroCmsSchema },
		howItWorks: { type: HowItWorksCmsSchema },
		testimonials: { type: TestimonialsCmsSchema },
		faq: { type: FaqCmsSchema },
		cta: { type: CtaCmsSchema },
		salesProgress: { type: SalesProgressCmsSchema },
	},
	{ _id: false },
);

// ─────────────────────────────────────────────────────────────────────────────

const ConfigSchema = new Schema<Config>(
	{
		isSingleton: { type: Boolean, default: true, unique: true },
		general: {
			nameBusiness: { type: String },
			email: { type: String },
			phone: { type: String },
			logoUrl: { type: String },
		},
		wompi: {
			enabled: { type: Boolean, default: false },
			environment: {
				type: String,
				enum: ["test", "prod"],
				default: "test",
			},
			publicKey: { type: String },
			privateKey: { type: String },
			integrityKey: { type: String },
			eventsKey: { type: String },
		},
		integrations: {
			payments: {
				type: Map,
				of: PaymentProviderSchema,
			},
			email: EmailIntegrationSchema,
			sms: SmsIntegrationSchema,
		},
		homepage: { type: HomepageCmsSchema },
	},
	{ timestamps: true },
);

export default model<Config>("Config", ConfigSchema);
