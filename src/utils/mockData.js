export const mockOrders = [
  {
    id: 'ORD-001',
    clientName: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    productName: 'Premium Enamel Pin Set',
    price: 45.00,
    date: '2026-03-18',
    time: '14:30',
    status: 'Completed',
    purchasedFiles: ['enamel_pin_design.pdf', 'mockup_v1.png'],
    downloadLink: '#',
    paymentStatus: 'Paid',
    timeline: [
      { status: 'Created', date: '2026-03-18 14:15' },
      { status: 'Paid', date: '2026-03-18 14:20' },
      { status: 'Downloaded', date: '2026-03-18 14:30' }
    ]
  },
  {
    id: 'ORD-002',
    clientName: 'Sarah Jenkins',
    email: 's.jenkins@design.io',
    productName: 'Cyberpunk UI Kit',
    price: 99.00,
    date: '2026-03-18',
    time: '12:15',
    status: 'Pending',
    purchasedFiles: ['cyberpunk_ui_kit_full.zip'],
    downloadLink: '#',
    paymentStatus: 'Paid',
    timeline: [
      { status: 'Created', date: '2026-03-18 12:00' },
      { status: 'Paid', date: '2026-03-18 12:15' }
    ]
  },
  {
    id: 'ORD-003',
    clientName: 'Michael Chen',
    email: 'm.chen@techcorp.com',
    productName: 'Minimal Icon Pack',
    price: 29.00,
    date: '2026-03-17',
    time: '16:45',
    status: 'Downloaded',
    purchasedFiles: ['minimal_icons_svg.zip', 'licensing.txt'],
    downloadLink: '#',
    paymentStatus: 'Paid',
    timeline: [
      { status: 'Created', date: '2026-03-17 16:30' },
      { status: 'Paid', date: '2026-03-17 16:35' },
      { status: 'Downloaded', date: '2026-03-17 16:45' }
    ]
  },
  {
    id: 'ORD-004',
    clientName: 'Emma Wilson',
    email: 'emma.w@freelance.com',
    productName: 'Abstract 3D Renders',
    price: 59.00,
    date: '2026-03-16',
    time: '09:20',
    status: 'Completed',
    purchasedFiles: ['abstract_3d_pack_v2.zip'],
    downloadLink: '#',
    paymentStatus: 'Paid',
    timeline: [
      { status: 'Created', date: '2026-03-16 09:00' },
      { status: 'Paid', date: '2026-03-16 09:10' },
      { status: 'Downloaded', date: '2026-03-16 10:00' }
    ]
  }
];

export const mockEmails = [
  {
    id: 'EML-001',
    clientName: 'Alex Rivera',
    subject: 'Question about license',
    message: 'Hello, I recently purchased the Enamel Pin Set. Can I use these designs for commercial physical products?',
    date: '2026-03-18',
    time: '15:00',
    read: false
  },
  {
    id: 'EML-002',
    clientName: 'Sarah Jenkins',
    subject: 'Download link not working',
    message: 'Hi, I paid for the Cyberpunk UI Kit but the download link in the email seems to be broken. Could you please check?',
    date: '2026-03-18',
    time: '13:00',
    read: true
  },
  {
    id: 'EML-003',
    clientName: 'David Miller',
    subject: 'Custom design request',
    message: 'Hey there! I love your style. Do you take custom commissions for brand identity projects?',
    date: '2026-03-17',
    time: '11:30',
    read: true
  }
];

