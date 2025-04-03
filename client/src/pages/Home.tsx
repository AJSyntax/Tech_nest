import { Link } from "wouter";
import { 
  Code, 
  Paintbrush, 
  Code2, 
  Smartphone, 
  Download, 
  Search, 
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Home = () => {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="container-custom py-12 md:py-20">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl">
                <span className="block">Build your developer</span>
                <span className="block text-primary-600">portfolio in minutes</span>
              </h1>
              <p className="mt-3 text-base text-slate-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Technest helps you create impressive developer portfolios without code. Choose from professional templates, customize with your projects, and launch your online presence instantly.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-3">
                  <Link href="/create">
                    <Button size="lg" className="w-full sm:w-auto">Get started</Button>
                  </Link>
                  <Link href="/templates">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">Browse templates</Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <img 
                  className="w-full rounded-lg" 
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2072&q=80" 
                  alt="Developer coding on a laptop" 
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/20 to-purple-500/20 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 py-16">
        <div className="container-custom">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Everything you need to showcase your skills
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-slate-500 lg:mx-auto">
              Build impressive portfolios with our intuitive platform designed specifically for developers.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="bg-white shadow-sm rounded-lg p-6 border border-slate-200 hover:shadow-md transition">
                <div className="feature-icon bg-primary-500">
                  <Paintbrush className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-slate-900">Professional Templates</h3>
                <p className="mt-2 text-base text-slate-500">
                  Choose from a variety of professional templates designed specifically for developers.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white shadow-sm rounded-lg p-6 border border-slate-200 hover:shadow-md transition">
                <div className="feature-icon bg-secondary-500">
                  <Code2 className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-slate-900">Showcase Your Projects</h3>
                <p className="mt-2 text-base text-slate-500">
                  Highlight your best work with dedicated project sections and custom screenshots.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white shadow-sm rounded-lg p-6 border border-slate-200 hover:shadow-md transition">
                <div className="feature-icon bg-accent-500">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-slate-900">Responsive Design</h3>
                <p className="mt-2 text-base text-slate-500">
                  All portfolios look great on any device, from mobile phones to desktop computers.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white shadow-sm rounded-lg p-6 border border-slate-200 hover:shadow-md transition">
                <div className="feature-icon bg-primary-500">
                  <Paintbrush className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-slate-900">Customizable Design</h3>
                <p className="mt-2 text-base text-slate-500">
                  Choose colors, typography, and layout options to match your personal brand.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-white shadow-sm rounded-lg p-6 border border-slate-200 hover:shadow-md transition">
                <div className="feature-icon bg-secondary-500">
                  <Download className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-slate-900">Export & Host</h3>
                <p className="mt-2 text-base text-slate-500">
                  Download your portfolio as a complete package ready to host anywhere.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white shadow-sm rounded-lg p-6 border border-slate-200 hover:shadow-md transition">
                <div className="feature-icon bg-accent-500">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-slate-900">SEO Optimized</h3>
                <p className="mt-2 text-base text-slate-500">
                  Built-in SEO tools to help employers and clients find your portfolio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Showcase */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Choose from beautiful templates
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-slate-500 lg:mx-auto">
              Start with a professional template designed for developers and customize to match your style.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Template 1 */}
            <div className="group relative rounded-lg overflow-hidden shadow-md border border-slate-200 hover:shadow-lg transition">
              <div className="aspect-w-16 aspect-h-9 bg-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1517292987719-0369a794ec0f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80" 
                  alt="Minimal template" 
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-primary-600 bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                  <span className="bg-white text-primary-600 px-4 py-2 rounded-md font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">Preview</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">Minimal</h3>
                <p className="text-slate-500 mt-1">Clean, minimalist design with emphasis on content.</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-medium text-primary-600">Free</span>
                  <Link href="/create">
                    <Button>Use Template</Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Template 2 */}
            <div className="group relative rounded-lg overflow-hidden shadow-md border border-slate-200 hover:shadow-lg transition">
              <div className="aspect-w-16 aspect-h-9 bg-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80" 
                  alt="Tech template" 
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-primary-600 bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                  <span className="bg-white text-primary-600 px-4 py-2 rounded-md font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">Preview</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">Tech Stack</h3>
                <p className="text-slate-500 mt-1">Modern design highlighting your technical skills.</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-medium text-primary-600">Premium</span>
                  <Link href="/create">
                    <Button>Use Template</Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Template 3 */}
            <div className="group relative rounded-lg overflow-hidden shadow-md border border-slate-200 hover:shadow-lg transition">
              <div className="aspect-w-16 aspect-h-9 bg-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
                  alt="Portfolio template" 
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-primary-600 bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                  <span className="bg-white text-primary-600 px-4 py-2 rounded-md font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">Preview</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">Project Showcase</h3>
                <p className="text-slate-500 mt-1">Visual portfolio with emphasis on your projects.</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-medium text-primary-600">Premium</span>
                  <Link href="/create">
                    <Button>Use Template</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/templates">
              <Button size="lg" className="inline-flex items-center">
                View all templates
                <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600">
        <div className="container-custom py-12 md:py-16">
          <div className="text-center md:max-w-2xl md:mx-auto">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to build your developer portfolio?
            </h2>
            <p className="mt-4 text-xl text-primary-100">
              Get started today and showcase your skills to potential employers.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/create">
                <Button variant="secondary" size="lg">Create your portfolio</Button>
              </Link>
              <Link href="/templates">
                <Button variant="outline" size="lg" className="bg-primary-700 hover:bg-primary-800 text-white border-primary-500">
                  Browse templates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
