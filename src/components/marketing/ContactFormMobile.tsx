import { useState } from 'react';
import { Mail, Phone, Headphones, Send } from 'lucide-react';
import { toast } from 'sonner';

const CONTACT_LINKS = [
  { icon: Mail, label: 'Email', value: 'contact@zeetop.ai', href: 'mailto:contact@zeetop.ai' },
  { icon: Phone, label: 'Phone', value: '+255 7XX XXX XXX', href: 'tel:+255712345678' },
  { icon: Headphones, label: 'Support', value: 'support@zeetop.ai', href: 'mailto:support@zeetop.ai' },
];

interface ContactFormMobileProps {
  title?: string;
  subtitle?: string;
  description?: string;
}

export default function ContactFormMobile({
  title = 'Get in Touch',
  subtitle = 'Contact Us',
  description = 'We are always ready to help. Reach out via any channel and we will respond within hours.',
}: ContactFormMobileProps) {
  const [formData, setFormData] = useState({ fullName: '', company: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Message sent! We will get back to you shortly.');
      setFormData({ fullName: '', company: '', email: '', phone: '', message: '' });
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="w-full py-8 md:py-16 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8 md:mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-primary text-xs md:text-sm font-medium mb-4">
            {subtitle}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">{title}</h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">{description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-3">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Reach Out Via Any Channel</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CONTACT_LINKS.map(({ icon: Icon, label, value, href }, i) => (
                  <a
                    key={i}
                    href={href}
                    className="group p-3 md:p-4 rounded-lg md:rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-primary/30 transition-colors flex flex-col items-center text-center"
                  >
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary mb-2" />
                    <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">{label}</p>
                    <p className="text-xs text-gray-500 truncate w-full">{value}</p>
                  </a>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="John Doe" required className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-sm" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="My Shop Ltd" className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-sm" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+255 7XX XXX XXX" className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Tell us how we can help..." required rows={4} className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 text-sm resize-none" />
              </div>

              <button type="submit" disabled={sending} className="w-full py-3 md:py-4 rounded-lg md:rounded-xl font-semibold bg-gradient-to-r from-primary to-accent text-white hover:from-primary hover:to-accent transition-colors shadow-lg shadow-primary/20 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {sending ? 'Sending...' : 'Send Message'}
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="hidden lg:flex flex-col justify-center">
            <div className="space-y-6">
              <div className="p-6 md:p-8 rounded-xl bg-gray-50 border border-gray-200 backdrop-blur">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-primary" />
                  Support Hours
                </h3>
                <div className="space-y-2 text-sm md:text-base text-gray-500">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM EAT</p>
                  <p>Saturday: 10:00 AM - 3:00 PM EAT</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>

              <div className="p-6 md:p-8 rounded-xl bg-gray-50 border border-gray-200 backdrop-blur">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Response Time</h3>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                  We typically respond to all messages within <span className="text-primary font-semibold">1-2 business hours</span> during working hours. For urgent matters, please call us directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
