"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, FileText, Users, Shield, AlertTriangle, Scale, Ban, Mail } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const sections = [
  {
    id: "acceptance",
    icon: FileText,
    title: "Acceptance of Terms",
    content: "By registering for or using the UniElect platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform. These terms apply to all users including students, candidates, and administrators."
  },
  {
    id: "eligibility",
    icon: Users,
    title: "Eligibility",
    content: "To use UniElect, you must be a currently enrolled student or authorized staff member at a participating university. You must register with your official university-issued student ID and email address. By registering, you confirm that the information you provide is accurate and truthful.\n\nUniElect reserves the right to verify your enrollment status with your institution and to suspend or terminate accounts found to contain false information."
  },
  {
    id: "account",
    icon: Shield,
    title: "Account Responsibilities",
    content: "You are responsible for maintaining the confidentiality of your login credentials. You must not share your password or allow any other person to access your account. You are responsible for all activities that occur under your account.\n\nYou agree to notify us immediately of any unauthorized use of your account. UniElect is not liable for any loss or damage arising from unauthorized use of your credentials."
  },
  {
    id: "conduct",
    icon: Scale,
    title: "Acceptable Use",
    content: "You agree to use UniElect only for its intended purpose — participating in official university elections. You must not:\n\n• Attempt to vote more than once in any single election\n• Attempt to access another user's account or voting data\n• Use automated tools or bots to interact with the platform\n• Attempt to manipulate, compromise, or interfere with election results\n• Reverse-engineer, decompile, or copy any part of the platform\n• Use the platform for any illegal or unauthorized purpose\n\nViolation of these terms may result in immediate account suspension and referral to university disciplinary authorities."
  },
  {
    id: "elections",
    icon: FileText,
    title: "Election Integrity",
    content: "UniElect is a facilitating platform for university elections. The rules, eligibility criteria, and outcomes of elections are governed by your university's election commission and student governance policies, not by UniElect.\n\nUniElect is responsible for the secure and accurate recording of votes cast through the platform. We are not responsible for disputes regarding election rules, candidate eligibility, or result interpretation — those matters fall under your university's jurisdiction."
  },
  {
    id: "prohibited",
    icon: Ban,
    title: "Prohibited Activities",
    content: "The following activities are strictly prohibited:\n\n• Voting fraud, including attempting to vote multiple times\n• Impersonating another student or staff member\n• Bribery, coercion, or intimidation related to voting\n• Unauthorized disclosure of election data or results before official publication\n• Any activity that disrupts the fair conduct of elections\n\nUniElect will cooperate fully with law enforcement and university authorities in investigating any suspected fraudulent activity."
  },
  {
    id: "liability",
    icon: AlertTriangle,
    title: "Limitation of Liability",
    content: "UniElect provides the platform 'as is' and makes no warranties regarding uptime, accuracy, or fitness for any particular purpose beyond conducting university elections.\n\nTo the maximum extent permitted by applicable law, UniElect shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform. Our total liability for any claims arising under these terms shall not exceed the fees paid by your institution for platform use in the preceding 12 months."
  },
  {
    id: "changes",
    icon: FileText,
    title: "Changes to Terms",
    content: "We may update these Terms of Service from time to time. We will notify registered users of material changes via email at least 14 days before they take effect. Your continued use of the platform after changes take effect constitutes acceptance of the revised terms."
  }
]

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 text-lg mb-4">
            Please read these terms carefully before using UniElect.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: <strong>January 1, 2025</strong> &middot; Effective: <strong>January 1, 2025</strong>
          </p>
        </div>
      </section>

      {/* Content */}
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
            <div className="p-5 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Important:</strong> By creating an account or casting a vote on UniElect, you agree to these Terms of Service. Election fraud or misuse of the platform may result in academic disciplinary action.
              </p>
            </div>

            {sections.map(section => (
              <div key={section.id} id={section.id} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-sage-500 to-emerald-500 rounded-lg shadow-sm">
                    <section.icon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                </div>
                <div className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
                  {section.content}
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
                  <h3 className="font-bold text-gray-900 mb-1">Questions About These Terms?</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    If you have any questions about these Terms of Service, contact us at:
                  </p>
                  <p className="text-sm font-medium text-sage-700">legal@unielect.ac.ke</p>
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
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            <Link href="/help" className="hover:text-white transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
