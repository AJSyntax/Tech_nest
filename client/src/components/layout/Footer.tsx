import { Link } from "wouter";
import { Code, Twitter, Github, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-800 text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center">
              <Code className="h-8 w-8 text-primary-500" />
              <span className="ml-2 text-xl font-semibold">Technest</span>
            </div>
            <p className="mt-4 text-slate-400">
              Build your developer portfolio in minutes with professional templates and easy customization.
            </p>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-white">
                <Github size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-white">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              <li><Link href="/templates" className="text-slate-400 hover:text-white">Templates</Link></li>
              <li><Link href="/features" className="text-slate-400 hover:text-white">Features</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-400 hover:text-white">Documentation</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white">FAQs</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-400 hover:text-white">About</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center">
          <p className="text-base text-slate-400">
            &copy; {new Date().getFullYear()} Technest. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0">
            <a href="#" className="text-sm text-slate-400 hover:text-white mr-4">Privacy Policy</a>
            <a href="#" className="text-sm text-slate-400 hover:text-white">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
