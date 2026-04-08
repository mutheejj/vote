"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ChevronLeft,
  Mail,
  MessageSquare,
  Phone,
  Clock,
  CheckCircle,
  Send,
  HelpCircle,
  BookOpen,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    studentId: "",
    category: "",
    subject: "",
    message: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setIsSubmitting(false)
    setSubmitted(true)
  }

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      info: "support@unielect.ac.ke",
      desc: "For non-urgent issues and general enquiries",
      time: "Response within 24 hours",
      color: "from-sage-500 to-sage-600"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      info: "Available in the platform",
      desc: "Real-time help from our support team",
      time: "Mon–Fri, 8am–5pm EAT",
      color: "from-emerald-500 to-emerald-600"
    },
    {
      icon: AlertCircle,
      title: "Emergency Issues",
      info: "emergency@unielect.ac.ke",
      desc: "For critical election day issues only",
      time: "24/7 during active elections",
      color: "from-red-500 to-red-600"
    }
  ]

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
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-1 text-sm text-gray-600 hover:text-sage-600 transition-colors">
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </Link>
              <Link href="/help">
                <Button variant="outline" size="sm" className="border-sage-200 text-sage-700 hover:bg-sage-50">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help Center
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-br from-sage-50 via-white to-emerald-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Badge className="mb-4 bg-sage-100 text-sage-700 border-0">Contact Us</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Support</h1>
          <p className="text-gray-600 text-lg">
            Can't find what you're looking for? Our support team is here to help.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            {contactMethods.map((method, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} mb-4 shadow-md`}>
                  <method.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{method.title}</h3>
                <p className="text-sm font-medium text-sage-700 mb-1">{method.info}</p>
                <p className="text-xs text-gray-500 mb-2">{method.desc}</p>
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600">
                  <Clock className="h-3.5 w-3.5" />
                  {method.time}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Us a Message</h2>
              <p className="text-gray-500 text-sm mb-6">Fill in the form and we'll get back to you within 24 hours.</p>

              {submitted ? (
                <div className="text-center py-16 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Message Received!</h3>
                  <p className="text-gray-600 text-sm max-w-sm mx-auto mb-6">
                    Thank you for reaching out. Our support team will respond to <strong>{form.email}</strong> within 24 hours.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => { setSubmitted(false); setForm({ name: "", email: "", studentId: "", category: "", subject: "", message: "" }) }}
                    className="border-sage-200 text-sage-700 hover:bg-sage-50"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name <span className="text-red-500">*</span></Label>
                      <Input
                        required
                        placeholder="John Mwangi"
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        className="focus-visible:ring-sage-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Student ID</Label>
                      <Input
                        placeholder="CS001-0001/2024"
                        value={form.studentId}
                        onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))}
                        className="focus-visible:ring-sage-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email Address <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      required
                      placeholder="your.email@university.ac.ke"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className="focus-visible:ring-sage-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category <span className="text-red-500">*</span></Label>
                    <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                      <SelectTrigger className="focus:ring-sage-500">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="account">Account & Login</SelectItem>
                        <SelectItem value="voting">Voting Issues</SelectItem>
                        <SelectItem value="candidacy">Candidacy Applications</SelectItem>
                        <SelectItem value="results">Election Results</SelectItem>
                        <SelectItem value="technical">Technical Problem</SelectItem>
                        <SelectItem value="security">Security Concern</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Subject <span className="text-red-500">*</span></Label>
                    <Input
                      required
                      placeholder="Brief description of your issue"
                      value={form.subject}
                      onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                      className="focus-visible:ring-sage-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Message <span className="text-red-500">*</span></Label>
                    <Textarea
                      required
                      placeholder="Please describe your issue in detail..."
                      rows={5}
                      value={form.message}
                      onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      className="focus-visible:ring-sage-500 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !form.name || !form.email || !form.category || !form.subject || !form.message}
                    className="w-full bg-gradient-to-r from-sage-600 to-emerald-600 hover:from-sage-700 hover:to-emerald-700 text-white shadow-lg shadow-sage-500/20"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-sage-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-sage-600" />
                  Before You Contact Us
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Many common issues can be resolved quickly using our self-service resources:
                </p>
                <div className="space-y-2">
                  <Link href="/help" className="flex items-center justify-between p-3 bg-white rounded-xl border border-sage-100 hover:border-sage-300 transition-colors text-sm">
                    <span className="text-gray-700 font-medium">Help Center & FAQs</span>
                    <ChevronLeft className="h-4 w-4 rotate-180 text-sage-500" />
                  </Link>
                  <Link href="/security" className="flex items-center justify-between p-3 bg-white rounded-xl border border-sage-100 hover:border-sage-300 transition-colors text-sm">
                    <span className="text-gray-700 font-medium">Security Guide</span>
                    <ChevronLeft className="h-4 w-4 rotate-180 text-sage-500" />
                  </Link>
                  <Link href="/privacy" className="flex items-center justify-between p-3 bg-white rounded-xl border border-sage-100 hover:border-sage-300 transition-colors text-sm">
                    <span className="text-gray-700 font-medium">Privacy Policy</span>
                    <ChevronLeft className="h-4 w-4 rotate-180 text-sage-500" />
                  </Link>
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Support Hours
                </h3>
                <div className="space-y-1 text-sm text-amber-800">
                  <div className="flex justify-between">
                    <span>Monday – Friday</span>
                    <span className="font-medium">8:00am – 5:00pm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-medium">9:00am – 1:00pm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-medium">Closed</span>
                  </div>
                </div>
                <p className="text-xs text-amber-600 mt-3">
                  All times are East Africa Time (EAT / UTC+3)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
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
