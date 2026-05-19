-- Default UK HMRC-style allowable expense categories (SA103F-oriented labels)
-- Reference data only; no per-user copies.

insert into public.hmrc_categories (code, name, description, sa_box, is_allowable_expense, sort_order)
values
  (
    'cost_of_goods',
    'Cost of goods bought for resale or goods used',
    'Stock, materials, and goods bought to sell or use in your work.',
    '17',
    true,
    10
  ),
  (
    'construction_industry',
    'Payments to subcontractors (Construction Industry Scheme)',
    'CIS deductions and payments to subcontractors where applicable.',
    '19',
    true,
    20
  ),
  (
    'wages_staff',
    'Wages, salaries and other staff costs',
    'Employee wages, employer NIC, pensions, and staff benefits.',
    '20',
    true,
    30
  ),
  (
    'car_van_travel',
    'Car, van and travel expenses',
    'Business mileage, fuel, parking, trains, and other travel for work.',
    '20',
    true,
    40
  ),
  (
    'rent_rates_power',
    'Rent, rates, power and insurance costs',
    'Business premises rent, business rates, gas, electricity, and property insurance.',
    '21',
    true,
    50
  ),
  (
    'repairs_maintenance',
    'Repairs and maintenance of property and equipment',
    'Repairs to business premises, tools, or equipment (not improvements).',
    '22',
    true,
    60
  ),
  (
    'phone_office_stationery',
    'Phone, fax, stationery and other office costs',
    'Phone, broadband, postage, printing, and general office supplies.',
    '23',
    true,
    70
  ),
  (
    'advertising_marketing',
    'Advertising and marketing',
    'Advertising, websites, business cards, and promotional costs.',
    '24',
    true,
    80
  ),
  (
    'interest_bank_charges',
    'Interest on bank and other business loans',
    'Interest on business loans and bank charges on business accounts.',
    '25',
    true,
    90
  ),
  (
    'bank_credit_card_charges',
    'Bank, credit card and other financial charges',
    'Merchant fees, card charges, and other finance costs.',
    '26',
    true,
    100
  ),
  (
    'irrecoverable_debts',
    'Irrecoverable debts written off',
    'Bad debts from business sales that cannot be recovered.',
    '27',
    true,
    110
  ),
  (
    'accountancy_legal_professional',
    'Accountancy, legal and other professional fees',
    'Accountant, solicitor, and other professional services for the business.',
    '28',
    true,
    120
  ),
  (
    'professional_subscriptions',
    'Professional subscriptions',
    'Membership of professional bodies required for your trade.',
    '29',
    true,
    130
  ),
  (
    'other_finance_charges',
    'Other finance charges',
    'Hire purchase interest and other finance charges not listed elsewhere.',
    '30',
    true,
    140
  ),
  (
    'depreciation_loss_sale',
    'Depreciation and loss or profit on sale of assets',
    'Capital allowances and profit or loss on disposal of business assets.',
    '31',
    true,
    150
  ),
  (
    'other_business_expenses',
    'Other business expenses',
    'Allowable business costs that do not fit other categories.',
    '32',
    true,
    160
  ),
  (
    'use_of_home',
    'Use of home as office',
    'Simplified or actual costs for working from home.',
    null,
    true,
    170
  ),
  (
    'equipment_tools',
    'Equipment, tools and computer costs',
    'Tools, computers, and equipment used wholly for business.',
    null,
    true,
    180
  ),
  (
    'training',
    'Training and professional development',
    'Courses and training that maintain or update skills for your current trade.',
    null,
    true,
    190
  ),
  (
    'insurance',
    'Business insurance',
    'Public liability, professional indemnity, and other business insurance.',
    null,
    true,
    200
  ),
  (
    'clothing_uniforms',
    'Protective clothing and uniforms',
    'Specialist clothing or uniforms required for your work.',
    null,
    true,
    210
  ),
  (
    'entertainment_disallowed',
    'Client entertainment (generally not allowable)',
    'Track separately; most client entertainment is not tax-deductible.',
    null,
    false,
    900
  ),
  (
    'personal_private',
    'Personal / private (not allowable)',
    'Private spending — not an allowable business expense.',
    null,
    false,
    910
  )
on conflict (code) do nothing;
