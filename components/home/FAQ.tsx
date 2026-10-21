"use client";

import { useState } from "react";
import Reveal from "./Reveal";

const faqs = [
  {
    question: "How do I place an order?",
    answer: "Browse our shop, add products to your cart, and proceed to checkout. You'll receive an order confirmation email with all the details.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major payment methods including UPI, credit/debit cards, and net banking. Payment is securely processed at checkout.",
  },
  {
    question: "How are your products sourced?",
    answer: "We source ingredients directly from trusted local farmers in Tamil Nadu. All products are packed in small batches in our Kolathur, Chennai kitchen.",
  },
  {
    question: "How should I store the products?",
    answer: "Store in a cool, dry place away from direct sunlight. Once opened, keep in an airtight container to maintain freshness. Our products are best consumed within 3-4 months of opening.",
  },
  {
    question: "What is your shipping policy?",
    answer: "We ship across India. Orders are typically processed within 1-2 business days. Shipping times vary by location - metro cities usually receive orders within 3-5 business days.",
  },
  {
    question: "Can I return or exchange products?",
    answer: "Due to the nature of food products, we accept returns only for damaged or incorrect items. Please contact us within 48 hours of delivery if you have any issues.",
  },
  {
    question: "Are your products suitable for all diets?",
    answer: "Our products are vegetarian and naturally gluten-free. If you have specific dietary requirements or allergies, please check the product description or contact us before ordering.",
  },
  {
    question: "Do you offer bulk orders for businesses?",
    answer: "Yes, we welcome bulk orders for restaurants, cafes, and retail stores. Please contact us directly at hello@magnaecobites.com for custom pricing and availability.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" aria-label="Frequently Asked Questions" className="relative overflow-hidden bg-gradient-to-b from-cream to-sand/30 py-12 md:py-16 lg:py-20">
      {/* Decorative elements */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-1/3 h-64 w-64 -translate-y-1/2 rounded-full bg-leaf/5 blur-3xl" />
        <div className="absolute -right-20 bottom-1/3 h-64 w-64 translate-y-1/2 rounded-full bg-clay/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-clay/30 bg-white/40 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-clay sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-clay" aria-hidden="true" />
              FAQ
            </span>
            <h2 className="mt-6 font-display text-4xl font-medium leading-tight text-forest sm:mt-8 sm:text-5xl">
              Common Questions
            </h2>
            <p className="mt-4 text-lg text-ink/70">
              Quick answers about shopping, ingredients, storage, and orders.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 space-y-3 sm:mt-12">
          {faqs.map((faq, index) => (
            <Reveal key={index} delay={index * 50}>
              <div className="rounded-2xl border border-leaf/10 bg-white/60 shadow-soft">
                <button
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/80 sm:px-8 sm:py-6"
                  aria-expanded={openIndex === index}
                >
                  <span className="font-display text-lg font-medium text-forest sm:text-xl">
                    {faq.question}
                  </span>
                  <svg
                    className={`h-5 w-5 shrink-0 text-leaf transition-transform duration-300 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-6 pb-5 pt-0 text-base leading-relaxed text-ink/70 sm:px-8 sm:pb-6">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <div className="mt-12 text-center sm:mt-16">
            <p className="text-ink/60">
              Have more questions?{" "}
              <a href="/#contact" className="font-semibold text-leaf transition-colors hover:text-forest hover:underline">
                Contact us
              </a>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
