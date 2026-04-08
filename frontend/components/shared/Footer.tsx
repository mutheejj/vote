"use client"

import React from "react"
import Link from "next/link"
import { Mail, Phone, MapPin, Github, Twitter, Facebook, Shield, Heart } from "lucide-react"
import { APP_CONFIG } from "@/lib/constants"
import { cn } from "@/lib/utils/cn"

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { name: "About UniElect", href: "/about" },
    { name: "How to Vote", href: "/help/voting" },
    { name: "Election Rules", href: "/help/rules" },
    { name: "FAQs", href: "/help/faq" },
    { name: "Support", href: "/support" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ]

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: APP_CONFIG.CONTACT_EMAIL,
      href: `mailto:${APP_CONFIG.CONTACT_EMAIL}`,
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+254 67 52123",
      href: "tel:+254675212123",
    },
    {
      icon: MapPin,
      label: "Address",
      value: "Jomo Kenyatta University, Juja",
      href: "https://maps.google.com/?q=Jomo+Kenyatta+University",
    },
  ]

  const socialLinks = [
    {
      name: "GitHub",
      href: APP_CONFIG.GITHUB_URL,
      icon: Github,
    },
    {
      name: "Twitter",
      href: "https://twitter.com/unielect",
      icon: Twitter,
    },
    {
      name: "Facebook",
      href: "https://facebook.com/unielect",
      icon: Facebook,
    },
  ]

  return (
    <footer className={cn("bg-gray-900 text-white", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand and description */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <img
                src="/images/unielect-logo.jpg"
                alt="UniElect Logo"
                className="h-10 w-10 rounded-lg object-cover"
              />
              <div className="ml-3">
                <h3 className="text-lg font-bold">{APP_CONFIG.NAME}</h3>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {APP_CONFIG.DESCRIPTION}. Empowering democratic participation with
              cutting-edge security and transparency.
            </p>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <span>Built with</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>for UniElect community</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3">
              {contactInfo.map((contact) => (
                <li key={contact.label}>
                  <a
                    href={contact.href}
                    className="flex items-center text-gray-300 hover:text-white text-sm transition-colors group"
                    target={contact.href.startsWith('http') ? '_blank' : undefined}
                    rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    <contact.icon className="h-4 w-4 mr-2 group-hover:text-blue-400" />
                    <span>{contact.value}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources and Social */}
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 mb-6">
              <li>
                <Link
                  href={APP_CONFIG.SUPPORT_URL}
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/help/security"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Security Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/help/accessibility"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Accessibility
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  System Status
                </Link>
              </li>
            </ul>

            {/* Social Links */}
            <div>
              <h5 className="font-medium text-white mb-3 text-sm">Follow Us</h5>
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="text-gray-400 hover:text-white transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-gray-400 text-sm">
                � {currentYear} UniElect Voting Management System. All rights reserved.
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>Version {APP_CONFIG.VERSION}</span>
                <span>•</span>
                <Link href="/privacy" className="hover:text-gray-300">
                  Privacy
                </Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-gray-300">
                  Terms
                </Link>
                <span>•</span>
                <Link
                  href="/system/auth"
                  className="hover:text-gray-300 opacity-70"
                  title="System Administration"
                >
                  System
                </Link>
              </div>
            </div>

            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Shield className="h-3 w-3" />
                <span>Secured by end-to-end encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UniElect branding strip */}
      <div className="bg-blue-600 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center text-center">
            <p className="text-blue-100 text-xs">
              Proudly serving{" "}
              <span className="font-semibold text-white">
                Jomo Kenyatta University of Agriculture and Technology
              </span>
              {" "}" Empowering Innovation and Excellence
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer