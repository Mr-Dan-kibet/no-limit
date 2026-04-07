-- ========================================
-- NO LIMIT — Seed Data
-- Run AFTER schema.sql
-- ========================================

-- -------------------------
-- 1. YEAR
-- -------------------------
insert into years (id, label, start_date, end_date)
values ('00000000-0000-0000-0000-000000000001', 'April 2026 – March 2027', '2026-04-01', '2027-03-31')
on conflict do nothing;

-- -------------------------
-- 2. GOAL CATEGORIES
-- -------------------------
insert into goal_categories (id, name, icon, color, year_id, sort_order) values
  ('10000000-0000-0000-0000-000000000001', 'Learning',              '📚', '#4CAF50', '00000000-0000-0000-0000-000000000001', 0),
  ('10000000-0000-0000-0000-000000000002', 'Developer',             '💻', '#FF6044', '00000000-0000-0000-0000-000000000001', 1),
  ('10000000-0000-0000-0000-000000000003', 'Business',              '🏢', '#FFC107', '00000000-0000-0000-0000-000000000001', 2),
  ('10000000-0000-0000-0000-000000000004', 'Gym',                   '💪', '#2196F3', '00000000-0000-0000-0000-000000000001', 3),
  ('10000000-0000-0000-0000-000000000005', 'Personal Development',  '🧠', '#9C27B0', '00000000-0000-0000-0000-000000000001', 4)
on conflict do nothing;

-- -------------------------
-- 3. GOALS
-- -------------------------

-- LEARNING
insert into goals (id, category_id, year_id, name, detail, status, type, timeline, due_date, sort_order) values
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Graduate Moringa',
  'Capstone presented and passed Feb 2026. Graduation ceremony July 29 2026.',
  'complete', 'milestone', 'Ceremony Jul 29 2026', '2026-07-29', 0
),
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Business management foundation',
  'Start with general business management — operations, finance basics, strategy. One course or book per quarter.',
  'not-started', 'ongoing', 'Apr–Dec 2026', null, 1
),
(
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'KaziExpress — dairy & domestic workers school research',
  'Learn dairy farm management, worker training curriculum design, and school operations. Feeds directly into KaziExpress business.',
  'not-started', 'multi-step', 'Research by Sep 2026', null, 2
),
(
  '20000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Get skilled in aviation',
  'First step: check PPL or drone/UAV qualification requirements. Proceed only if eligible.',
  'not-started', 'conditional', 'Check eligibility Apr 2026', null, 3
),
(
  '20000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Read 10 books (non-career)',
  'Started: The Blunder. Next: Atomic Habits. Target one book per month across the year.',
  'in-progress', 'recurring', '~1 book/month', null, 4
),

-- DEVELOPER
(
  '20000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Grade Agrovet',
  'POS + inventory + finance platform for mom''s agrovet. Live at gradeagrovet.vercel.app.',
  'in-progress', 'carry-over', 'Ongoing QA', null, 0
),
(
  '20000000-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Kapgrade Dairy platform',
  'Smart dairy management system. Live at kapgrade-dairy.vercel.app.',
  'in-progress', 'carry-over', 'Ongoing dev', null, 1
),
(
  '20000000-0000-0000-0000-000000000008',
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Multiventures platform',
  'Member data management for Multiventures 800+ members. Profiles, data tracking, admin dashboard.',
  'not-started', 'fresh', 'Q2 2026', null, 2
),
(
  '20000000-0000-0000-0000-000000000009',
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Luxury Rides',
  'Intercity travel platform — seat booking from home + stopover food pre-ordering so passengers skip the queue.',
  'not-started', 'fresh', 'Q3 2026', null, 3
),
(
  '20000000-0000-0000-0000-000000000010',
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'AgriConnect',
  'Connects farmers, transporters, and buyers directly. Cuts out brokers who take margin without planting a seed or owning a lorry.',
  'not-started', 'fresh', 'Q3–Q4 2026', null, 4
),
(
  '20000000-0000-0000-0000-000000000011',
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Barter Trader',
  'Barter exchange platform. Design session pending.',
  'parked', 'fresh', 'TBD', null, 5
),

-- BUSINESS
(
  '20000000-0000-0000-0000-000000000012',
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Cloud seeding pilot',
  'Run a pilot programme for cloud seeding. Identify partners, regulatory requirements, and target region.',
  'not-started', 'multi-step', 'Q2–Q3 2026', null, 0
),
(
  '20000000-0000-0000-0000-000000000013',
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Speed-Ro Pocket — Kenya market entry',
  'Import and distribute Korean pothole repair product in Kenya. Steps: import approval, KEBS standards, county roads pilot.',
  'not-started', 'multi-step', 'Q1–Q2 2026', null, 1
),
(
  '20000000-0000-0000-0000-000000000014',
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'DOD tender',
  'Win at least one Department of Defence tender. Open scope. First step: register as a supplier.',
  'not-started', 'multi-step', 'Q1 2026', null, 2
),
(
  '20000000-0000-0000-0000-000000000015',
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Welding machine — put to work',
  'Machine already owned. Define service offering, location, and pricing then start generating revenue.',
  'not-started', 'fresh', 'Q1 2026', null, 3
),
(
  '20000000-0000-0000-0000-000000000016',
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'KaziExpress',
  'Trained domestic and agricultural worker placement agency + platform. Training school + vetting + tech platform + contracts.',
  'not-started', 'multi-step', 'Design by Q2 2026', null, 4
),
(
  '20000000-0000-0000-0000-000000000017',
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Build 4 longterm networks',
  'Build 4 meaningful long-term connections aligned with goals — business, political, investor. Quality over quantity.',
  'not-started', 'ongoing', 'By Mar 2027', null, 5
),
(
  '20000000-0000-0000-0000-000000000018',
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Ayabei''s 2nd birthday',
  'Celebrate Ayabei turning 2. Make it special.',
  'not-started', 'milestone', 'Jul 8 2026', '2026-07-08', 6
),

-- GYM
(
  '20000000-0000-0000-0000-000000000019',
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'Gain 5kg',
  'Structured bulk — clean calories, progressive overload. Track weight weekly.',
  'not-started', 'measurable', 'By Dec 2026', null, 0
),
(
  '20000000-0000-0000-0000-000000000020',
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'T-shirt free body',
  'Achieve the physique comfortable being shirtless. Combination of muscle gain and body composition.',
  'not-started', 'measurable', 'By Mar 2027', null, 1
),
(
  '20000000-0000-0000-0000-000000000021',
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'Full body checkup',
  'Comprehensive health screening — blood panel, vitals, dental. Do this first before training hard.',
  'not-started', 'one-off', 'Apr–May 2026', null, 2
),

-- PERSONAL DEVELOPMENT
(
  '20000000-0000-0000-0000-000000000022',
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'Control emotions and speech',
  'Pause before reacting. Choose words deliberately under pressure. Monthly self-audit.',
  'not-started', 'ongoing', 'Lifelong, review quarterly', null, 0
),
(
  '20000000-0000-0000-0000-000000000023',
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'Understand and grow love',
  'Intentional investment in relationships — romantic, family, self. Learn the language of the people around you.',
  'not-started', 'ongoing', 'Lifelong, review quarterly', null, 1
)
on conflict do nothing;

-- -------------------------
-- 4. PROJECTS
-- -------------------------
insert into projects (id, name, description, category, status, goal_id, color) values
(
  '30000000-0000-0000-0000-000000000001',
  'Grade Agrovet',
  'POS + inventory + finance platform for mom''s agrovet.',
  'developer', 'in-progress',
  '20000000-0000-0000-0000-000000000006',
  '#FF6044'
),
(
  '30000000-0000-0000-0000-000000000002',
  'Kapgrade Dairy',
  'Smart dairy management system.',
  'developer', 'in-progress',
  '20000000-0000-0000-0000-000000000007',
  '#FF6044'
),
(
  '30000000-0000-0000-0000-000000000003',
  'KaziExpress',
  'Trained worker placement agency, platform and training school.',
  'business', 'not-started',
  '20000000-0000-0000-0000-000000000016',
  '#FFC107'
),
(
  '30000000-0000-0000-0000-000000000004',
  'Luxury Rides',
  'Intercity travel platform with seat booking and food pre-ordering.',
  'developer', 'not-started',
  '20000000-0000-0000-0000-000000000009',
  '#FF6044'
),
(
  '30000000-0000-0000-0000-000000000005',
  'AgriConnect',
  'Connects farmers, transporters, and buyers directly.',
  'developer', 'not-started',
  '20000000-0000-0000-0000-000000000010',
  '#4CAF50'
),
(
  '30000000-0000-0000-0000-000000000006',
  'Multiventures Platform',
  'Member data management for 800+ members.',
  'developer', 'not-started',
  '20000000-0000-0000-0000-000000000008',
  '#FF6044'
),
(
  '30000000-0000-0000-0000-000000000007',
  'Speed-Ro Pocket',
  'Korean pothole repair product — Kenya market entry.',
  'business', 'not-started',
  '20000000-0000-0000-0000-000000000013',
  '#FFC107'
),
(
  '30000000-0000-0000-0000-000000000008',
  'Cloud Seeding Pilot',
  'Pilot programme for cloud seeding in Kenya.',
  'business', 'not-started',
  '20000000-0000-0000-0000-000000000012',
  '#2196F3'
)
on conflict do nothing;

-- -------------------------
-- 5. EVENTS
-- -------------------------
insert into events (title, date, type, color, notes) values
  ('Moringa graduation ceremony', '2026-07-29', 'milestone', '#FFC107', 'Graduation ceremony after completing Moringa School.'),
  ('Ayabei''s 2nd birthday', '2026-07-08', 'birthday', '#4CAF50', 'Celebrate Ayabei turning 2. Make it special.'),
  ('Year begins — No Limit', '2026-04-01', 'event', '#FF6044', 'Start of the April 2026 – March 2027 year.'),
  ('Year ends — review & reset', '2027-03-31', 'event', '#888888', 'End of year. Full review and reset for next cycle.')
on conflict do nothing;

-- -------------------------
-- 6. CHECKLISTS
-- -------------------------

-- DAILY
insert into checklists (title, frequency, sort_order) values
  ('Review today''s priorities', 'daily', 0),
  ('Check project progress',     'daily', 1),
  ('30 mins reading',            'daily', 2),
  ('Gym / physical activity',    'daily', 3),
  ('Drink 3L water',             'daily', 4)
on conflict do nothing;

-- WEEKLY
insert into checklists (title, frequency, sort_order) values
  ('Review goal progress',                    'weekly', 0),
  ('Plan next week',                          'weekly', 1),
  ('Check project milestones',               'weekly', 2),
  ('Network — reach out to 1 person',        'weekly', 3),
  ('Financial review (income / expenses)',   'weekly', 4)
on conflict do nothing;

-- MONTHLY
insert into checklists (title, frequency, sort_order) values
  ('Full goals board review',                        'monthly', 0),
  ('Update project milestones',                      'monthly', 1),
  ('Add calendar events for next month',             'monthly', 2),
  ('Assess what''s working and what isn''t',         'monthly', 3),
  ('Read at least 1 book chapter (non-career)',      'monthly', 4)
on conflict do nothing;

-- QUARTERLY
insert into checklists (title, frequency, sort_order) values
  ('Full year goals audit',            'quarterly', 0),
  ('Set next quarter priorities',      'quarterly', 1),
  ('Review networks built',            'quarterly', 2),
  ('Assess business ideas progress',   'quarterly', 3),
  ('Physical health check-in',         'quarterly', 4)
on conflict do nothing;
