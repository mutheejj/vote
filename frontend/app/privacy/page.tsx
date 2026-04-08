"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, Shield, Lock, Eye, Database, UserCheck, Bell, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const sections = [
  {
    id: "collection",
    icon: Database,
    title: "Information We Collect",
    content: [
      {
        subtitle: "Account Information",
        text: "When you register, we collect your student ID, university email address, first and last name, faculty, department, course, year of study, and admission year. This information is required to verify your eligibility to participate in university elections."
      },
      {
        subtitle: "Usage Data",
        text: "We automatically collect information about how you interact with our platform, including pages visited, elections participated in, and device information. This data helps us improve the service."
      },
      {
        subtitle: "Voting Data",
        text: "We record that you have cast a vote (to prevent double voting), but your actual vote choices are cryptographically separated from your identity. We cannot link your identity to your specific ballot."
      }
    ]
  },
  {
    id: "use",
    icon: UserCheck,
    title: "How We Use Your Information",
    content: [
      {
        subtitle: "Election Administration",
        text: "Your information is used to verify your identity, confirm your eligibility to vote in specific elections, and maintain the integrity of the electoral process."
      },
      {
        subtitle: "Platform Improvements",
        text: "Aggregated, anonymized usage data helps us identify areas for improvement and ensure our platform meets the needs of all users."
      },
      {
        subtitle: "Communications",
        text: "We send essential account notifications (email verification, password resets) and election-related updates based on your notification preferences."
      }
    ]
  },
  {
    id: "sharing",
    icon: Eye,
    title: "Information Sharing",
    content: [
      {
        subtitle: "University Administration",
        text: "We share voter participation data (not vote choices) with election officials for audit purposes. This is limited to confirming participation, not revealing who you voted for."
      },
      {
        subtitle: "No Third-Party Sales",
        text: "We never sell, rent, or trade your personal information to third parties for commercial purposes."
      },
      {
        subtitle: "Legal Requirements",
        text: "We may disclose information if required by law, court order, or to protect the rights and safety of users and the institution."
      }
    ]
  },
  {
    id: "security",
    icon: Lock,
    title: "Data Security",
    content: [
      {
        subtitle: "Encryption",
        text: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Sensitive data is further protected with additional encryption layers."
      },
      {
        subtitle: "Access Controls",
        text: "Access to personal data is restricted to authorized personnel only, governed by strict role-based access controls and audit logging."
      },
      {
        subtitle: "Security Audits",
        text: "We conduct regular security audits, penetration testing, and code reviews to identify and address potential vulnerabilities."
      }
    ]
  },
  {
    id: "rights",
    icon: Shield,
    title: "Your Rights",
    content: [
      {
        subtitle: "Access & Correction",
        text: "You have the right to access the personal information we hold about you and to request corrections to any inaccurate information."
      },
      {
        subtitle: "Data Portability",
        text: "You can request an export of your account data at any time through the Settings page."
      },
      {
        subtitle: "Account Deletion",
        text: "You may request account deletion, which will remove your personal data. Note that anonymized voting participation records may be retained for election integrity purposes."
      }
    ]
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Cookies & Tracking",
    content: [
      {
        subtitle: "Essential Cookies",
        text: "We use session cookies for authentication and security purposes. These are strictly necessary for the platform to function."
      },
      {
        subtitle: "No Advertising Trackers",
        text: "We do not use advertising or cross-site tracking cookies. We do not participate in any ad networks or behavioral tracking."
      }
    ]
  }
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/images/unielect-logo.jpg" alt="UniElect" width={36} height={36} className="rounded-lg shadow-sm" />
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-none">UniElect</h1>
                <p className="text-[10px] text-sage-600 font-medium">Secure Digital Voting</p>
              </div>
            </Link>
            <Link href="/" className="flex items-center gap-1 text-sm text-gray-600 hover:text-sage-600 transition-colors">
              <ChevronLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-sage-50 via-white to-emerald-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge className="mb-4 bg-sage-100 text-sage-700 border-0">Legal</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 text-lg mb-4">
            We are committed to protecting your privacy and handling your data with transparency and care.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: <strong>January 1, 2025</strong> &middot; Effective: <strong>January 1, 2025</strong>
          </p>
        </div>
      </section>

      {/* Quick Nav + Content */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* TOC */}
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Contents</p>
              <nav className="space-y-1">
                {sections.map(section => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-sage-700 hover:bg-sage-50 transition-all"
                  >
                    <section.icon className="h-4 w-4 flex-shrink-0" />
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3 space-y-12">
            <div className="p-5 bg-sage-50 dark:bg-sage-900/20 rounded-xl border border-sage-200">
              <p className="text-sm text-sage-800 leading-relaxed">
                <strong>Summary:</strong> We collect only the data necessary to run secure elections. We never sell your data. Your vote choice is cryptographically protected from your identity. You have full rights to access, correct, and delete your data.
              </p>
            </div>

            {sections.map(section => (
              <div key={section.id} id={section.id} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-sage-500 to-emerald-500 rounded-lg shadow-sm">
                    <section.icon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                </div>
                <div className="space-y-6">
                  {section.content.map((item, i) => (
                    <div key={i}>
                      <h3 className="font-semibold text-gray-900 mb-2">{item.subtitle}</h3>
                      <p className="text-gray-600 leading-relaxed text-sm">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Contact */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gradient-to-br from-sage-500 to-emerald-500 rounded-lg">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Contact Our Privacy Team</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    For privacy-related questions, data access requests, or concerns, contact us at:
                  </p>
                  <p className="text-sm font-medium text-sage-700">privacy@unielect.ac.ke</p>
                  <p className="text-xs text-gray-500 mt-1">We respond to all privacy requests within 30 days.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">&copy; 2025 UniElect. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            <Link href="/help" className="hover:text-white transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
