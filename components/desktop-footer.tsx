"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react"

export function DesktopFooter() {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: "Producto",
      links: [
        { label: "Características", href: "/#features" },
        { label: "Precios", href: "/#pricing" },
        { label: "Testimonios", href: "/#testimonials" },
        { label: "Guías", href: "/guides" },
      ],
    },
    {
      title: "Recursos",
      links: [
        { label: "Documentación", href: "/docs" },
        { label: "Tutoriales", href: "/tutorials" },
        { label: "Blog", href: "/blog" },
        { label: "Soporte", href: "/support" },
      ],
    },
    {
      title: "Empresa",
      links: [
        { label: "Sobre nosotros", href: "/about" },
        { label: "Contacto", href: "/contact" },
        { label: "Trabaja con nosotros", href: "/careers" },
        { label: "Prensa", href: "/press" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Términos de servicio", href: "/terms" },
        { label: "Política de privacidad", href: "/privacy" },
        { label: "Cookies", href: "/cookies" },
        { label: "Seguridad", href: "/security" },
      ],
    },
  ]

  const socialLinks = [
    { icon: <Facebook size={20} />, label: "Facebook", href: "https://facebook.com" },
    { icon: <Twitter size={20} />, label: "Twitter", href: "https://twitter.com" },
    { icon: <Instagram size={20} />, label: "Instagram", href: "https://instagram.com" },
    { icon: <Linkedin size={20} />, label: "LinkedIn", href: "https://linkedin.com" },
    { icon: <Github size={20} />, label: "GitHub", href: "https://github.com" },
  ]

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link href={link.href} className="text-gray-300 hover:text-white transition duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="text-2xl font-bold">
              Juntify
            </Link>
            <p className="text-gray-400 mt-2">© {currentYear} Juntify. Todos los derechos reservados.</p>
          </div>
          <div className="flex space-x-4">
            {socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-gray-400 hover:text-white transition duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">{link.label}</span>
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
