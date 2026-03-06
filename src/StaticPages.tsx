import React from 'react';
import { motion } from 'motion/react';

export const PrivacyPolicy = ({ onClose }: { onClose: () => void }) => (
  <StaticPage title="Privacy Policy" onClose={onClose}>
    <p>At MoneyTrack, we take your privacy seriously. This privacy policy explains how we collect, use, and protect your personal information.</p>
    <h3 className="font-bold mt-4">Information We Collect</h3>
    <p>We collect information you provide directly to us, such as your email address and financial transaction data.</p>
    <h3 className="font-bold mt-4">How We Use Your Information</h3>
    <p>We use your information to provide and improve our financial tracking services and to communicate with you.</p>
    <h3 className="font-bold mt-4">Data Security</h3>
    <p>We implement appropriate security measures to protect your personal information from unauthorized access.</p>
  </StaticPage>
);

export const TermsOfService = ({ onClose }: { onClose: () => void }) => (
  <StaticPage title="Terms of Service" onClose={onClose}>
    <p>Welcome to MoneyTrack. By using our application, you agree to these terms of service.</p>
    <h3 className="font-bold mt-4">Use of Service</h3>
    <p>You agree to use MoneyTrack only for lawful purposes and in accordance with these terms.</p>
    <h3 className="font-bold mt-4">Account Responsibility</h3>
    <p>You are responsible for maintaining the security of your account and password.</p>
    <h3 className="font-bold mt-4">Limitation of Liability</h3>
    <p>MoneyTrack is not liable for any damages arising from your use of the service.</p>
  </StaticPage>
);

const StaticPage = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto"
    >
      <h2 className="text-2xl font-bold mb-6 dark:text-white">{title}</h2>
      <div className="space-y-4 text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
      <button onClick={onClose} className="w-full mt-8 bg-black dark:bg-white text-white dark:text-black py-3 rounded-2xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all">Close</button>
    </motion.div>
  </div>
);
