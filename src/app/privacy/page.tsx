import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | Vehicle Hub",
    description: "Privacy policy and data handling for Vehicle Hub",
};

export default function PrivacyPolicy() {
    return (
        <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 md:p-12 transition-colors">
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                <header className="flex items-center gap-4 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm dark:shadow-none">
                    <Link href="/" className="p-2 -ml-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            Privacy Policy
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Last updated: March 2026</p>
                    </div>
                </header>

                <section className="p-8 sm:p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none space-y-8">

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">1. Information We Collect</h2>
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            When you use our application, we only collect information necessary to provide you with our services.
                            Because our app leverages your personal Google Drive for data storage, we do not store your private vehicle maintenance data on our own servers.
                            The information we temporarily process includes your Google Profile (Name and Email) for authentication purposes, and the vehicle data you actively input to be synchronized to your spreadsheet.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">2. How We Use Your Information</h2>
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            We use your Google Account strictly to authenticate you and to interact with Google Sheets/Drive APIs on your behalf.
                            Any vehicle data, service logs, and receipt images you upload are entirely saved into your chosen Google Drive directories. We do not sell, rent, or share your data with any third parties, as the data strictly remains within your own Google infrastructure.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">3. Data Security</h2>
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            We implement a variety of security measures to maintain the safety of your personal information. Our application communicates via encrypted SSL connections, and authentication is securely handled by Google's OAuth 2.0 mechanisms. We never see or store your Google password.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">4. Your Consent</h2>
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            By using our app, you consent to our privacy policy. Because the data is stored in your Google Drive, you retain full ownership and control over your data. You may delete the generated spreadsheets and directories from your Drive at any time.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">5. Contacting Us</h2>
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            If there are any questions regarding this privacy policy, you may contact the developer using the contact link provided on the application dashboard.
                        </p>
                    </div>

                </section>

            </div>
        </div>
    );
}
