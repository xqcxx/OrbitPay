import Link from 'next/link'

const projectLinks = [
  { label: 'GitHub', href: 'https://github.com/xqcxx/OrbitPay' },
  {
    label: 'Frontend Issues',
    href: 'https://github.com/xqcxx/OrbitPay/blob/main/docs/ISSUES-FRONTEND.md',
  },
  {
    label: 'Smart Contract Guide',
    href: 'https://github.com/xqcxx/OrbitPay/blob/main/docs/SMARTCONTRACT_GUIDE.md',
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.75)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-[rgb(var(--muted-foreground))] sm:px-6 md:flex-row md:items-center md:justify-between">
        <p>OrbitPay on Stellar Soroban</p>
        <nav className="flex flex-wrap items-center gap-4">
          {projectLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-[rgb(var(--foreground))]"
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
