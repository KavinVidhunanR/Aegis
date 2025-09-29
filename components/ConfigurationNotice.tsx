import React from 'react';
import { AegisIcon } from './Icons';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-gray-800 text-gray-200 rounded-lg p-4 mt-2 text-left text-sm overflow-x-auto">
        <code>{children}</code>
    </pre>
);

const ConfigurationNotice: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="max-w-4xl w-full text-center space-y-8 bg-gray-800/50 p-10 rounded-2xl shadow-2xl border border-gray-700">
        
        <div className="flex items-center justify-center gap-4">
            <AegisIcon className="w-16 h-16" />
            <div>
                <h1 className="text-5xl font-bold text-white">AEGIS</h1>
                <p className="text-lg text-red-400">Backend Configuration Required</p>
            </div>
        </div>

        <div className="text-gray-300 space-y-4 text-lg">
           <p>
            Welcome to AEGIS! To connect the app to your secure backend, you need to provide your Supabase project credentials. This is done differently for local development and for your live Vercel deployment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 text-left">
            {/* Local Development Instructions */}
            <div className="space-y-4 p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h2 className="text-2xl font-semibold text-red-300 mb-2">1. For Local Development</h2>
                <p className="text-gray-400">Open the file named <span className="font-mono bg-gray-700 px-1 rounded">lib/config.ts</span> in your code editor.</p>
                <p className="text-gray-400">Replace the placeholder values with your actual Supabase URL and public 'anon' key.</p>
                <CodeBlock>
                    {`// In lib/config.ts\nexport const SUPABASE_CONFIG = {\n  url: "YOUR_URL_HERE",\n  anonKey: "YOUR_KEY_HERE",\n};`}
                </CodeBlock>
                 <p className="text-xs text-gray-500">A <span className="font-mono">.gitignore</span> file ensures this file is never uploaded to GitHub, keeping your keys safe.</p>
            </div>
            
             {/* Vercel Deployment Instructions */}
            <div className="space-y-4 p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h2 className="text-2xl font-semibold text-red-300 mb-2">2. For Vercel Deployment</h2>
                <p className="text-gray-400">In your Vercel project dashboard, go to <span className="font-semibold text-white">Settings &gt; Environment Variables</span>.</p>
                <p className="text-gray-400">Add the following two variables. Vercel will securely provide them to your live application during its build process.</p>
                <CodeBlock>
                    {`# Key: VITE_SUPABASE_URL\n# Value: (Your Supabase URL)\n\n# Key: VITE_SUPABASE_ANON_KEY\n# Value: (Your Supabase Anon Key)`}
                </CodeBlock>
                 <p className="text-xs text-gray-500">This keeps your keys out of your code and safe.</p>
            </div>
        </div>

        <div className="pt-6">
            <p className="text-lg text-gray-300">
                After configuring your environment, <span className="font-bold text-white">refresh this page</span>.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationNotice;
