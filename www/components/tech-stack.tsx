export function TechStack() {
  const services = [
    {
      name: 'Clerk',
      purpose: 'Authentication',
      description: 'Secure OAuth login for educators and students',
    },
    {
      name: 'Convex',
      purpose: 'Real-time Database',
      description: 'Instant sync between extension and dashboard',
    },
    {
      name: 'Vercel',
      purpose: 'Hosting',
      description: 'Fast, reliable deployment for the dashboard',
    },
    {
      name: 'Claude AI',
      purpose: 'Quiz Generation',
      description: 'Contextual comprehension questions via Anthropic',
    },
    {
      name: 'VS Code',
      purpose: 'Extension Platform',
      description: 'Seamless integration into the coding workflow',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Built With
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Modern, reliable services powering the Codswallop experience.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {service.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                    {service.purpose}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
