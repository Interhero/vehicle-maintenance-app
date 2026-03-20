import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service | Vehicle Hub",
    description: "Terms of Service for Vehicle Hub",
};

export default function TermsOfService() {
    return (
        <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 md:p-12 transition-colors">
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                <header className="flex items-center gap-4 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm dark:shadow-none">
                    <Link href="/" className="p-2 -ml-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="w-6 h-6 text-blue-500" />
                            Terms of Service
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Last updated: March 2026</p>
                    </div>
                </header>

                <section className="p-8 sm:p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none space-y-8">

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">1. Agreement to Terms</h2>
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            By accessing or using our application, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you are prohibited from using or accessing this application.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">2. Use License & Permissions</h2>
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            In order to use the core features of the application, you must grant the necessary Google Drive permissions.
                            You explicitly authorize this application to read, write, and modify spreadsheet documents created by this application within your personal Google Drive.
                            We are not responsible for any accidental deletion or corruption of data inside your Google Drive.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">3. Disclaimer</h2>
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            The materials on this application are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                            Furthermore, the service mileage calculations and predictive suggestions are for informational reference only. You should always consult with certified mechanics for professional vehicle maintenance.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">4. Limitations of Liability</h2>
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            In no event shall the developer or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption, or vehicle breakdown) arising out of the use or inability to use the application or the calculations provided therein.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">5. Modifications</h2>
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            We may revise these terms of service for the application at any time without notice. By using this application you are agreeing to be bound by the then-current version of these terms.
                        </p>
                    </div>

                </section>

            </div>
        </div>
    );
}
