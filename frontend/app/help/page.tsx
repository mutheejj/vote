"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  HelpCircle,
  Vote,
  User,
  Shield,
  BarChart3,
  Mail,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Phone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/cn"

const faqs = [
  {
    category: "Voting",
    icon: Vote,
    color: "from-sage-500 to-sage-600",
    questions: [
      {
        q: "How do I vote in an election?",
        a: "Log in to your UniElect account, navigate to 'Elections', and select any active election. Review the candidates for each position, make your selection, and click 'Submit Vote'. You'll receive a confirmation receipt after voting."
      },
      {
        q: "Can I change my vote after submitting?",
        a: "No. Once a vote is submitted, it is final and cannot be changed. This ensures the integrity of the election. Please review your choices carefully before submitting."
      },
      {
        q: "How do I know my vote was counted?",
        a: "After voting, you receive a unique vote receipt token. This token can be used to verify that your vote was included in the final count without revealing who you voted for."
      },
      {
        q: "What if I miss the voting deadline?",
        a: "Voting is only possible during the active election period. Once an election closes, votes can no longer be submitted. Check the election countdown timer to ensure you vote before the deadline."
      }
    ]
  },
  {
    category: "Account",
    icon: User,
    color: "from-emerald-500 to-emerald-600",
    questions: [
      {
        q: "How do I register for UniElect?",
        a: "Click 'Get Started' on the homepage. Enter your student ID, university email, and personal information. Verify your email address to activate your account."
      },
      {
        q: "I forgot my password. What do I do?",
        a: "Click 'Forgot Password' on the login page. Enter your registered email address and we'll send you a password reset link. The link expires after 1 hour."
      },
      {
        q: "Why hasn't my email verification arrived?",
        a: "Check your spam/junk folder first. If it's not there, log in and use the 'Resend Verification' option. Make sure you're using your official university email address."
      },
      {
        q: "How do I update my profile information?",
        a: "Log in and go to 'My Profile'. You can update your first name, last name, and phone number. Academic details like faculty and department are managed by your university."
      }
    ]
  },
  {
    category: "Security",
    icon: Shield,
    color: "from-blue-500 to-blue-600",
    questions: [
      {
        q: "How is my vote kept secret?",
        a: "UniElect uses cryptographic techniques to separate your identity from your ballot. Election officials can verify that you voted, but cannot see who you voted for."
      },
      {
        q: "What is two-factor authentication?",
        a: "Two-factor authentication (2FA) adds an extra security layer by requiring a code from your phone app in addition to your password. Enable it in Settings > Privacy & Security."
      },
      {
        q: "Is my personal data safe?",
        a: "Yes. We use industry-standard encryption for all data storage and transmission. We never sell your data and comply with applicable data protection regulations. See our Privacy Policy for details."
      }
    ]
  },
  {
    category: "Results",
    icon: BarChart3,
    color: "from-purple-500 to-purple-600",
    questions: [
      {
        q: "When are election results published?",
        a: "Results are published after the election period ends and votes have been officially tallied and verified. You'll receive a notification when results are available."
      },
      {
        q: "How can I view election results?",
        a: "Go to 'Results' in the navigation menu. You can view results for any completed election, including vote counts and percentages per position and candidate."
      }
    ]
  }
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState("All")

  const toggleFaq = (id: string) => setOpenFaq(prev => prev === id ? null : id)

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      faq =>
        (activeCategory === "All" || cat.category === activeCategory) &&
        (searchQuery === "" ||
          faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.a.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(cat => cat.questions.length > 0)

  const categories = ["All", ...faqs.map(f => f.category)]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <Image src="/images/unielect-logo.jpg" alt="UniElect" width={36} height={36} className="rounded-lg shadow-sm" />
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-none">UniElect</h1>
                <p className="text-[10px] text-sage-600 font-medium">Secure Digital Voting</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-1 text-sm text-gray-600 hover:text-sage-600 transition-colors">
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-gradient-to-r from-sage-600 to-emerald-600 text-white hover:from-sage-700 hover:to-emerald-700">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-sage-50 via-white to-emerald-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Badge className="mb-4 bg-sage-100 text-sage-700 border-0">Help Center</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How Can We Help You?</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Find answers to common questions about voting, accounts, and security.
          </p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base rounded-xl border-gray-200 focus-visible:ring-sage-500 shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-4 border-b border-gray-100 sticky top-16 bg-white z-40">
        <div className="max-w-4xl mx-auto px-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                activeCategory === cat
                  ? "bg-gradient-to-r from-sage-600 to-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-sage-50 hover:text-sage-700"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-20">
              <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">Try a different search term or browse all categories.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredFaqs.map(category => (
                <div key={category.category}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color} shadow-sm`}>
                      <category.icon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{category.category}</h2>
                    <Badge className="bg-gray-100 text-gray-600 border-0">{category.questions.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {category.questions.map((faq, i) => {
                      const id = `${category.category}-${i}`
                      const isOpen = openFaq === id
                      return (
                        <div
                          key={i}
                          className={cn(
                            "rounded-xl border transition-all",
                            isOpen ? "border-sage-200 shadow-sm" : "border-gray-200 hover:border-sage-200"
                          )}
                        >
                          <button
                            className="w-full flex items-center justify-between p-5 text-left"
                            onClick={() => toggleFaq(id)}
                          >
                            <span className="font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
                            {isOpen ? (
                              <ChevronUp className="h-5 w-5 text-sage-600 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-5">
                              <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Still Need Help?</h2>
            <p className="text-gray-600">Our support team is available during university office hours.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Mail,
                title: "Email Support",
                desc: "Get a response within 24 hours",
                action: "support@unielect.ac.ke",
                color: "from-sage-500 to-sage-600"
              },
              {
                icon: MessageSquare,
                title: "Live Chat",
                desc: "Available Mon–Fri, 8am–5pm EAT",
                action: "Start Chat",
                color: "from-emerald-500 to-emerald-600"
              },
              {
                icon: BookOpen,
                title: "Documentation",
                desc: "Detailed guides and tutorials",
                action: "View Docs",
                color: "from-blue-500 to-blue-600"
              }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-all">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} mb-4 shadow-md`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{item.desc}</p>
                <Button variant="outline" size="sm" className="border-sage-200 text-sage-700 hover:bg-sage-50">
                  {item.action}
                </Button>
              </div>
            ))}
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
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
