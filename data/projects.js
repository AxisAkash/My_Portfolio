export const projects = [
  {
    id: 'sofol',
    number: '01',
    title: 'SOFOL',
    subtitle: 'Farmer Credit Profile Platform',
    outcome: 'A role-based mobile fintech platform for digital credit profiling, field verification, and loan workflows for farmers.',
    role: 'Mobile + backend product work',
    date: 'Jul–Oct 2026',
    visualLabel: 'Mobile fintech / role-based flows',
    placeholder: 'TODO_SCREENSHOT_SOFOL',
    stack: ['React Native', 'Expo', 'TypeScript', 'Express.js', 'Supabase / PostgreSQL'],
    problem: 'Farmers need a clearer path from financial records and field verification to a usable credit profile and loan application.',
    roleDetail: 'Built with a product team across the mobile experience and backend web solutions, focusing on role-based workflows and secure APIs.',
    architecture: 'React Native and Expo client, TypeScript application code, Express.js backend APIs, and Supabase/PostgreSQL data storage.',
    features: ['Four role experiences: Farmer, Field Officer, Bank Officer, and Admin.', 'Financial records and transaction workflows.', 'Loan applications and field-verification flows.', 'Secure role-based backend APIs.'],
    improve: 'I would deepen the validation and observability around cross-role workflows as more field feedback becomes available.',
    links: [
      { label: 'GitHub', url: 'TODO_SOFOL_GITHUB_URL' },
      { label: 'Backend repo', url: 'TODO_SOFOL_BACKEND_URL' }
    ]
  },
  {
    id: 'car-rent',
    number: '02',
    title: 'Car Rent',
    subtitle: 'Management System',
    outcome: 'A full-stack rental workflow covering authentication, bookings, payment tracking, and admin operations.',
    role: 'Full-stack developer',
    date: 'Apr–May 2026',
    visualLabel: 'Booking system / admin view',
    placeholder: 'TODO_SCREENSHOT_CAR_RENT',
    stack: ['PHP', 'MySQL', 'MVC', 'HTML / CSS / JS', 'AJAX'],
    problem: 'A rental operation needs one consistent system for access control, vehicle bookings, payment tracking, and rental history.',
    roleDetail: 'Implemented the full-stack application structure, booking workflows, role-based access, and responsive interface behavior.',
    architecture: 'PHP MVC application with MySQL persistence, AJAX interactions, prepared statements, and session-based authentication.',
    features: ['Authentication and role-based access control.', 'Admin dashboard and booking workflows.', 'Payment tracking and rental history.', 'Validated responsive UI with prepared statements and session handling.'],
    improve: 'I would add broader integration coverage around booking state changes and connect a confirmed live payment provider when requirements are defined.',
    links: [
      { label: 'Live demo', url: 'TODO_CAR_RENT_LIVE_URL' },
      { label: 'GitHub', url: 'TODO_CAR_RENT_GITHUB_URL' }
    ]
  },
  {
    id: 'ai-calculator',
    number: '03',
    title: 'AI Calculator',
    subtitle: 'Natural-language math parser',
    outcome: 'A Python and TensorFlow NLP pipeline that turns conversational math prompts into calculations.',
    role: 'AI / Python developer',
    date: 'Mar–Jun 2025',
    visualLabel: 'NLP pipeline / expression parsing',
    placeholder: 'TODO_SCREENSHOT_AI_CALCULATOR',
    stack: ['Python', 'TensorFlow', 'NLP'],
    problem: 'People express simple calculations in natural language, while traditional calculators expect a rigid symbolic format.',
    roleDetail: 'Developed the NLP pipeline, tuned hyperparameters, and evaluated iterations against natural-language math inputs.',
    architecture: 'Python processing pipeline using TensorFlow-based modeling and iterative evaluation for natural-language expressions.',
    features: ['Natural-language prompts such as “what is 20% of 350”.', 'Hyperparameter tuning across iterations.', 'Evaluation of parsing and calculation behavior.'],
    improve: 'I would expand the evaluation set and make ambiguity handling more explicit for multi-step expressions.',
    links: [
      { label: 'Live demo', url: 'TODO_AI_CALCULATOR_LIVE_URL' },
      { label: 'GitHub', url: 'TODO_AI_CALCULATOR_GITHUB_URL' }
    ]
  },
  {
    id: 'rental-management',
    number: '04',
    title: 'Rental Management',
    subtitle: 'Desktop operations app',
    outcome: 'A C# desktop application for tenant, unit, lease, invoice, and payment management with role-aware access.',
    role: 'Desktop application developer',
    date: 'Oct 2024–Jan 2025',
    visualLabel: 'Desktop app / property operations',
    placeholder: 'TODO_SCREENSHOT_RENTAL_MANAGEMENT',
    stack: ['C#', '.NET Framework', 'SQL Server'],
    problem: 'Property operations need a single place to manage tenants, units, leases, invoices, and payments securely.',
    roleDetail: 'Built the desktop application workflows, authentication model, rental data management, and automated billing behavior.',
    architecture: 'C# and .NET Framework desktop application backed by SQL Server, with hashed credentials and role-based access.',
    features: ['Tenant registration and lease tracking.', 'Unit management.', 'Hashed-credential authentication and role-based access.', 'Automated invoicing and payment tracking.'],
    improve: 'I would improve the reporting surface and add more automated tests around invoice and payment edge cases.',
    links: [
      { label: 'GitHub', url: 'https://github.com/AxisAkash/Rental-Management-System' }
    ]
  }
];
